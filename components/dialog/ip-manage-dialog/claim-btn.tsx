import BigNumber from "bignumber.js"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Abi, Address, encodeFunctionData, isAddress, maxUint256, zeroAddress } from "viem"
import { useReadContract, useWaitForTransactionReceipt } from "wagmi"
import { useEmbeddedWriteContract } from "@/hooks/use-embedded-write-contract"
import { useAccount } from "@/hooks/use-account"

import Slippage from "@/app/(dApp)/token/[tokenAddress]/trade/slippage"
import BigNumberInput from "@/components/bignumber-input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import Spinner from "@/components/ui/spinner"
import { env } from "@/config"
import IPTokenABI from "@/config/IPToken.abi.json"
import IPWorldOwnerVaultABI from "@/config/IPWorldOwnerVault.abi.json"
import QuoterABI from "@/config/Quoter.abi.json"
import StoryHuntSwapRouterABI from "@/config/SwapRouter.abi.json"
import { useIpPrice } from "@/context/token-metrics-context"
import useGetOwnerVaultAddress from "@/hooks/use-get-owner-vault-address"
import { useRefreshAllBalances } from "@/hooks/use-refresh-all-balances"
import { usePoolFee } from "@/hooks/use-pool-fee"
import { bigNumberToFloat } from "@/lib/bignumber"
import { formatNumber, formatNumberWithSuffix } from "@/lib/number"
import Amount from "@/types/amount"
import { ChevronDown, Cog } from "@/components/icons"

type ActionType = "claim" | "transfer" | "burn" | "sell"

interface ExactInputSingleParams {
  tokenIn: string
  tokenOut: string
  fee: bigint
  recipient: string
  deadline: number
  amountIn: bigint
  amountOutMinimum: bigint
  sqrtPriceLimitX96: bigint
}

const ClaimBtn = ({
  tokenAddress,
  harvested,
  refetch,
  claimableAmount = 0,
  tokenSymbol = "",
}: {
  tokenAddress: Address
  harvested: boolean
  refetch: () => void
  claimableAmount?: number
  tokenSymbol?: string
}) => {
  const { address } = useAccount()
  const { refreshAllBalances } = useRefreshAllBalances()
  const ownerVaultAddress = useGetOwnerVaultAddress()
  const ipPrice = useIpPrice()
  const { fee: poolFee } = usePoolFee(tokenAddress)

  // Modal states
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState<ActionType>("claim")

  // Transfer states
  const [transferAddress, setTransferAddress] = useState("")
  const [transferAmount, setTransferAmount] = useState<Amount>({
    valueNumber: 0,
    valueBigInt: BigInt(0),
    valueString: "",
    decimals: 18,
  })

  // Sell states
  const [sellAmount, setSellAmount] = useState<Amount>({
    valueNumber: 0,
    valueBigInt: BigInt(0),
    valueString: "",
    decimals: 18,
  })
  const [slippage, setSlippage] = useState(0.05)
  const [openSlippage, setOpenSlippage] = useState(false)


  // Get token decimals
  const { data: tokenDecimals } = useReadContract({
    address: tokenAddress,
    abi: IPTokenABI,
    functionName: "decimals",
  })

  const { fee: poolFee } = usePoolAndFee(tokenAddress)

  // Get estimated amount out for sell
  const { data: estimatedAmountOut, isLoading: isLoadingEstimate } = useReadContract({
    address: env.NEXT_PUBLIC_QUOTER_ADDRESS,
    abi: QuoterABI,
    functionName: "quoteExactInputSingle",
    args: [
      tokenAddress,
      env.NEXT_PUBLIC_WRAPPED_IP_TOKEN_ADDRESS,
      poolFee,
      sellAmount.valueBigInt,
      BigInt(0),
    ],
    query: {
      enabled: actionType === "sell" && sellAmount.valueBigInt > 0 && poolFee !== undefined,
    },
  })

  // Get allowance for sell action
  const { data: tokenAllowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: IPTokenABI,
    functionName: "allowance",
    args: [address, env.NEXT_PUBLIC_STORYHUNT_SWAP_ROUTER],
    query: {
      enabled: actionType === "sell",
    },
  })

  // Transaction hooks
  const { data, isPending: isPendingTx, writeContractAsync } = useEmbeddedWriteContract()
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: txError,
  } = useWaitForTransactionReceipt({
    hash: data,
    query: {
      refetchOnWindowFocus: false,
    },
  })

  // Handle action selection
  const handleActionSelect = (action: ActionType) => {
    setActionType(action)
    if (action === "claim") {
      handleClaim()
    } else {
      // Initialize amounts for transfer/sell actions
      if (action === "transfer" || action === "sell") {
        const amount: Amount = {
          valueNumber: claimableAmount,
          valueBigInt: BigInt(
            new BigNumber(claimableAmount).times(new BigNumber(10).pow((tokenDecimals as number) || 18)).toNumber()
          ),
          valueString: claimableAmount.toString(),
          decimals: (tokenDecimals as number) || 18,
        }
        if (action === "transfer") setTransferAmount(amount)
        if (action === "sell") setSellAmount(amount)
      }
      setShowActionModal(true)
    }
  }

  // Claim function
  const handleClaim = async () => {
    if (!ownerVaultAddress || !harvested) return

    try {
      await writeContractAsync({
        abi: IPWorldOwnerVaultABI as Abi,
        address: ownerVaultAddress as Address,
        functionName: "claim",
        args: [tokenAddress],
      })
    } catch (error) {
      console.error("Claim failed:", error)
    }
  }

  // Sequential claim and action
  const handleClaimAndAction = async () => {
    if (!address || !ownerVaultAddress || !harvested) return

    try {
      // Step 1: Claim tokens
      await writeContractAsync({
        abi: IPWorldOwnerVaultABI as Abi,
        address: ownerVaultAddress as Address,
        functionName: "claim",
        args: [tokenAddress],
      })

      // Wait for claim to be confirmed
      // Note: The transaction receipt hook will handle this
    } catch (error) {
      console.error("Claim failed:", error)
      toast.error("Claim transaction failed")
    }
  }

  // Execute the follow-up action after claim is confirmed
  const executeFollowUpAction = useCallback(async () => {
    if (!address || actionType === "claim") return

    try {
      if (actionType === "transfer") {
        if (!isAddress(transferAddress)) {
          toast.error("Invalid transfer address")
          return
        }

        await writeContractAsync({
          address: tokenAddress,
          abi: IPTokenABI,
          functionName: "transfer",
          args: [transferAddress as Address, transferAmount.valueBigInt],
        })
      } else if (actionType === "burn") {
        await writeContractAsync({
          address: tokenAddress,
          abi: IPTokenABI,
          functionName: "transfer",
          args: [zeroAddress, transferAmount.valueBigInt], // Burn by sending to zero address
        })
      } else if (actionType === "sell") {
        if (poolFee === undefined) return

        // First approve if needed
        if (!tokenAllowance || (tokenAllowance as bigint) < sellAmount.valueBigInt) {
          await writeContractAsync({
            address: tokenAddress,
            abi: IPTokenABI,
            functionName: "approve",
            args: [env.NEXT_PUBLIC_STORYHUNT_SWAP_ROUTER, maxUint256],
          })
          return // Will retry after approval
        }

        // Execute swap
        const amountOutMinimum = ((estimatedAmountOut as bigint) * BigInt((1 - slippage) * 10000)) / BigInt(10000)

        const exactInputSingleParams: ExactInputSingleParams = {
          tokenIn: tokenAddress,
          tokenOut: env.NEXT_PUBLIC_WRAPPED_IP_TOKEN_ADDRESS,
          fee: poolFee,
          recipient: zeroAddress, // Will unwrap to native IP
          amountIn: sellAmount.valueBigInt,
          amountOutMinimum,
          sqrtPriceLimitX96: BigInt("1461446703485210103287273052203988822378723970341"), // Max price for sell
          deadline: Math.floor(Date.now() / 1000) + 60, // 1 minute
        }

        const toHex = (value: bigint) => {
          let hex = value.toString(16)
          if (hex.length % 2 !== 0) hex = `0${hex}`
          return `0x${hex}`
        }

        await writeContractAsync({
          address: env.NEXT_PUBLIC_STORYHUNT_SWAP_ROUTER,
          abi: StoryHuntSwapRouterABI,
          functionName: "multicall",
          args: [
            [
              encodeFunctionData({
                abi: StoryHuntSwapRouterABI,
                functionName: "exactInputSingle",
                args: [exactInputSingleParams],
              }),
              encodeFunctionData({
                abi: StoryHuntSwapRouterABI,
                functionName: "unwrapWIP9",
                args: [toHex(amountOutMinimum), address as Address],
              }),
            ],
          ],
        })
      }
    } catch (error) {
      console.error("Follow-up action failed:", error)
      toast.error(`${actionType} transaction failed`)
    }
  }, [
    actionType,
    address,
    tokenAddress,
    transferAddress,
    transferAmount,
    sellAmount,
    slippage,
    estimatedAmountOut,
    tokenAllowance,
    writeContractAsync,
    poolFee,
  ])

  // Handle transaction success
  useEffect(() => {
    if (isConfirmed) {
      if (actionType === "claim") {
        toast.success("Claimed successfully")
      } else if (data && !isPendingTx && !isConfirming) {
        // This is a follow-up action completion
        const actionMessages = {
          transfer: "Transfer completed",
          burn: "Tokens burned",
          sell: "Swap completed",
        }
        toast.success(actionMessages[actionType as keyof typeof actionMessages] || "Transaction completed")
      }

      refreshAllBalances()
      refetch()
      refetchAllowance()

      // If this was a claim and we have a follow-up action, execute it
      if (isConfirmed && actionType !== "claim" && showActionModal) {
        executeFollowUpAction()
      }

      // Close modal after successful transaction
      setShowActionModal(false)
    }
  }, [
    isConfirmed,
    actionType,
    showActionModal,
    executeFollowUpAction,
    refreshAllBalances,
    refetch,
    refetchAllowance,
    data,
    isPendingTx,
    isConfirming,
  ])

  // Handle transaction errors
  useEffect(() => {
    if (txError) {
      toast.error("Transaction failed")
    }
  }, [txError])

  // Amount update handlers
  const handleUpdateTransferAmount = useCallback(
    (value: string) => {
      setTransferAmount({
        valueNumber: parseFloat(value) || 0,
        valueBigInt: BigInt(
          new BigNumber(value || "0").times(new BigNumber(10).pow((tokenDecimals as number) || 18)).toString()
        ),
        valueString: value,
        decimals: (tokenDecimals as number) || 18,
      })
    },
    [tokenDecimals]
  )

  const handleUpdateSellAmount = useCallback(
    (value: string) => {
      setSellAmount({
        valueNumber: parseFloat(value) || 0,
        valueBigInt: BigInt(
          new BigNumber(value || "0").times(new BigNumber(10).pow((tokenDecimals as number) || 18)).toString()
        ),
        valueString: value,
        decimals: (tokenDecimals as number) || 18,
      })
    },
    [tokenDecimals]
  )

  const estimatedAmountOutNumber = estimatedAmountOut ? bigNumberToFloat(estimatedAmountOut as bigint, 18) : 0

  const isLoading = isPendingTx || isConfirming

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="w-40" disabled={!harvested || isLoading} variant="pattern-3">
            {isLoading ? (
              <Spinner size={24} />
            ) : (
              <div className="flex items-center gap-1">
                Claim
                <ChevronDown size={12} />
              </div>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleActionSelect("claim")}>
            <div className="text-white">Claim</div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleActionSelect("transfer")}>
            <div className="text-white">Claim & Transfer</div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleActionSelect("burn")}>
            <div className="text-white">Claim & Burn</div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleActionSelect("sell")}>
            <div className="text-white">Claim & Sell</div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Transfer Modal */}
      <Dialog open={showActionModal && actionType === "transfer"} onOpenChange={setShowActionModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-white">Transfer {tokenSymbol}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-2 block text-sm text-neutral-300">Recipient Address</label>
              <Input
                value={transferAddress}
                onChange={(e) => setTransferAddress(e.target.value)}
                placeholder="0x..."
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-neutral-300">Amount</label>
              <div className="rounded-[10px] border bg-black p-4">
                <BigNumberInput
                  value={transferAmount.valueString}
                  onChange={isLoading ? () => { } : handleUpdateTransferAmount}
                  className={`w-full bg-transparent text-xl outline-none ${isLoading ? "cursor-not-allowed opacity-50" : ""}`}
                />
                <div className="mt-2 flex gap-1">
                  {[0.25, 0.5, 0.75, 1].map((percentage) => (
                    <Button
                      key={percentage}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUpdateTransferAmount((claimableAmount * percentage).toString())}
                      disabled={isLoading}
                    >
                      {percentage * 100}%
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <Button
              onClick={handleClaimAndAction}
              disabled={isLoading || !isAddress(transferAddress) || transferAmount.valueNumber <= 0}
              className="w-full"
            >
              {isLoading ? <Spinner size={24} /> : `Claim & Transfer ${tokenSymbol}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Burn Modal */}
      <Dialog open={showActionModal && actionType === "burn"} onOpenChange={setShowActionModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-white">Burn {tokenSymbol}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="rounded-[10px] border bg-red-50/10 p-4">
              <p className="text-sm text-neutral-300">
                You are about to burn{" "}
                <span className="font-bold text-white">
                  {formatNumber(claimableAmount, 4)} {tokenSymbol}
                </span>
                . This action cannot be undone.
              </p>
            </div>
            <Button onClick={handleClaimAndAction} disabled={isLoading} variant="destructive" className="w-full">
              {isLoading ? <Spinner size={24} /> : `Claim & Burn ${tokenSymbol}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sell Modal */}
      <Dialog open={showActionModal && actionType === "sell"} onOpenChange={setShowActionModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-white">Sell {tokenSymbol}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-300">Available to sell</span>
              <span className="text-white">
                {formatNumberWithSuffix(claimableAmount)} {tokenSymbol}
              </span>
            </div>

            <div className="rounded-[10px] border bg-black p-4">
              <div className="mb-3 flex items-center justify-between">
                <BigNumberInput
                  value={sellAmount.valueString}
                  onChange={isLoading ? () => { } : handleUpdateSellAmount}
                  className={`flex-1 bg-transparent text-xl outline-none ${isLoading ? "cursor-not-allowed opacity-50" : ""}`}
                />
                <div className="text-sm text-neutral-300">
                  ${formatNumber((sellAmount.valueNumber || 0) * (ipPrice || 0), 2, true)}
                </div>
              </div>

              <div className="flex items-center gap-1 text-sm">
                <span className="text-neutral-300">You receive:</span>
                {isLoadingEstimate ? (
                  <Spinner size={12} />
                ) : (
                  <span className="font-semibold text-white">{formatNumber(estimatedAmountOutNumber, 4)} IP</span>
                )}
              </div>

              <div className="mt-2 flex gap-1">
                {[0.25, 0.5, 0.75, 1].map((percentage) => (
                  <Button
                    key={percentage}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUpdateSellAmount((claimableAmount * percentage).toString())}
                    disabled={isLoading}
                  >
                    {percentage * 100}%
                  </Button>
                ))}
                <Button variant="ghost" size="sm" onClick={() => setOpenSlippage(!openSlippage)} disabled={isLoading}>
                  <Cog size={16} />
                </Button>
              </div>

              <Slippage
                value={slippage}
                onChange={(value) => {
                  setSlippage(value)
                  setOpenSlippage(false)
                }}
              />
            </div>

            <Button
              onClick={handleClaimAndAction}
              disabled={isLoading || sellAmount.valueNumber <= 0}
              className="w-full"
            >
              {isLoading ? <Spinner size={24} /> : `Claim & Sell ${tokenSymbol}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ClaimBtn
