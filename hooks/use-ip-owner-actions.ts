import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Abi, Address, isAddress } from "viem"
import { useReadContract, useWaitForTransactionReceipt } from "wagmi"
import { useEmbeddedWriteContract } from "@/hooks/use-embedded-write-contract"
import { useAccount } from "@/hooks/use-account"
import IPOwnerVaultABI from "@/config/IPOwnerVault.abi.json"
import IPTokenABI from "@/config/IPToken.abi.json"
import { getContractAddress } from "@/lib/services"
import { useRefreshAllBalances } from "@/hooks/use-refresh-all-balances"
import { Holding } from "@/types/holding"

export type ActionType = "claim" | "sell" | "transfer" | "burn"

export interface IpOwnerActionsParams {
  holding: Holding | null
  onClaimSuccess?: () => void
  onSellSuccess?: () => void
  onTransferSuccess?: () => void
  onBurnSuccess?: () => void
}

export const useIpOwnerActions = ({
  holding,
  onClaimSuccess,
  onTransferSuccess,
  onBurnSuccess,
}: IpOwnerActionsParams) => {
  const { address: userAddress } = useAccount()
  const { refreshAllBalances } = useRefreshAllBalances()
  const ownerVaultAddress = getContractAddress("IPOwnerVault")
  const successHandledRef = useRef<string | null>(null)
  const [currentAction, setCurrentAction] = useState<ActionType | null>(null)

  // Ensure we always have valid addresses for hooks (prevents conditional hook calls)
  const tokenAddress = (holding?.token_address as Address) || "0x0000000000000000000000000000000000000000"
  const validUserAddress = userAddress || "0x0000000000000000000000000000000000000000"
  const hasValidData = !!holding?.token_address && !!userAddress

  // Get user's current token balance
  const { data: userTokenBalance, refetch: refetchUserBalance } = useReadContract({
    address: tokenAddress as Address,
    abi: IPTokenABI,
    functionName: "balanceOf",
    args: [validUserAddress as Address],
    query: {
      enabled: hasValidData,
    },
  })

  // Transaction hooks
  const { data: txHash, isPending: isPendingTx, error, writeContract } = useEmbeddedWriteContract()
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: txError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
    query: {
      refetchOnWindowFocus: false,
    },
  })

  // Get the latest claimable amount before claiming (vested ERC20 tokens)
  const { data: latestClaimableAmount, refetch: refetchClaimableAmount } = useReadContract({
    abi: IPOwnerVaultABI as Abi,
    address: ownerVaultAddress as Address,
    functionName: "releasable",
    args: [tokenAddress as Address],
    query: {
      enabled: hasValidData,
    },
  })

  // Get accumulated ETH/WIP from harvests (released alongside vested tokens on claim)
  const { data: owdAmount, refetch: refetchOwdAmount } = useReadContract({
    abi: IPOwnerVaultABI as Abi,
    address: ownerVaultAddress as Address,
    functionName: "owdAmount",
    args: [tokenAddress as Address],
    query: {
      enabled: hasValidData,
    },
  })

  // Get token decimals for calculations
  const { data: tokenDecimals } = useReadContract({
    address: tokenAddress as Address,
    abi: IPTokenABI,
    functionName: "decimals",
    query: {
      enabled: hasValidData,
    },
  })

  // Updated success/error handling to route based on currentAction
  useEffect(() => {
    if (isConfirmed && txHash && successHandledRef.current !== txHash) {
      successHandledRef.current = txHash
      if (currentAction === "transfer") {
        toast.success("Transfer successful!")
        onTransferSuccess?.()
      } else if (currentAction === "claim") {
        toast.success("Claim successful!")
        onClaimSuccess?.()
      } else if (currentAction === "burn") {
        toast.success("Burn successful!")
        onBurnSuccess?.()
      }
      setCurrentAction(null)
      refreshAllBalances()
      refetchClaimableAmount()
      refetchOwdAmount()
      refetchUserBalance()
    }
  }, [
    isConfirmed,
    txHash,
    currentAction,
    onClaimSuccess,
    onTransferSuccess,
    onBurnSuccess,
    refreshAllBalances,
    refetchClaimableAmount,
    refetchOwdAmount,
    refetchUserBalance,
  ])

  // Reset success handled ref when starting new transaction
  useEffect(() => {
    if (isPendingTx) {
      successHandledRef.current = null
    }
  }, [isPendingTx])

  // Handle transaction errors
  useEffect(() => {
    if (error || txError) {
      const errorMessage = error?.message || txError?.message || "Transaction failed"
      toast.error(`Transaction failed: ${errorMessage}`)
      setCurrentAction(null) // Reset on error
    }
  }, [error, txError])

  // Claim action
  const handleClaim = useCallback(async () => {
    if (!holding?.token_address || !ownerVaultAddress) {
      toast.error("Missing required data for claim")
      return
    }

    try {
      setCurrentAction("claim")
      await refetchClaimableAmount()
      await refetchOwdAmount()

      writeContract({
        abi: IPOwnerVaultABI as Abi,
        address: ownerVaultAddress as Address,
        functionName: "claim",
        args: [holding.token_address as Address],
      })
    } catch (error) {
      console.error("Claim failed:", error)
      setCurrentAction(null)
      toast.error("Failed to initiate claim transaction")
    }
  }, [holding, ownerVaultAddress, writeContract, refetchClaimableAmount, refetchOwdAmount])

  // Transfer action (independent - uses current token balance)
  const handleTransfer = useCallback(
    async (recipientAddress: string, amount: bigint) => {
      if (!holding?.token_address || !userAddress) {
        toast.error("Missing required data for transfer")
        return
      }

      if (!isAddress(recipientAddress)) {
        toast.error("Invalid recipient address")
        return
      }

      if (amount <= 0) {
        toast.error("Transfer amount must be greater than zero")
        return
      }

      const currentBalance = (userTokenBalance as bigint) || BigInt(0)
      if (amount > currentBalance) {
        toast.error("Insufficient token balance")
        return
      }

      try {
        setCurrentAction("transfer")
        writeContract({
          address: holding.token_address as Address,
          abi: IPTokenABI,
          functionName: "transfer",
          args: [recipientAddress as Address, amount],
        })
      } catch (error) {
        console.error("Transfer failed:", error)
        setCurrentAction(null)
        toast.error("Failed to initiate transfer transaction")
      }
    },
    [holding, userAddress, userTokenBalance, writeContract]
  )

  const handleBurn = useCallback(
    async (amount: bigint) => {
      if (!holding?.token_address || !userAddress) {
        toast.error("Invalid token address or user not connected")
        return
      }

      if (amount <= 0) {
        toast.error("Amount must be greater than 0")
        return
      }

      if (!userTokenBalance || amount > (userTokenBalance as bigint)) {
        toast.error("Insufficient balance")
        return
      }

      try {
        setCurrentAction("burn")
        writeContract({
          address: holding.token_address as Address,
          abi: IPTokenABI,
          functionName: "burn",
          args: [amount],
        })
      } catch (error) {
        console.error("Burn failed:", error)
        toast.error("Burn transaction failed")
        setCurrentAction(null)
      }
    },
    [holding, userAddress, userTokenBalance, writeContract]
  )

  // TODO: Implement sell, burn actions

  const isLoading = isPendingTx || isConfirming

  return {
    // Actions
    handleClaim,
    handleSell: () => toast.info("Sell functionality coming soon"),
    handleTransfer,
    handleBurn,

    // State
    isLoading,
    latestClaimableAmount,
    owdAmount,
    tokenDecimals,
    userTokenBalance,

    // Utils
    refetchClaimableAmount,
    refetchOwdAmount,
    refetchUserBalance,
  }
}
