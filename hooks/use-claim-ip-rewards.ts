import { useCallback, useEffect } from "react"
import { toast } from "sonner"
import { Abi, Address } from "viem"
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi"
import IPOwnerVaultABI from "@/config/IPOwnerVault.abi.json"
import useGetOwnerVaultAddress from "@/hooks/use-get-owner-vault-address"

const useClaimIpRewards = ({ tokenAddress, onSuccess }: { tokenAddress: Address; onSuccess: () => void }) => {
  const ownerVaultAddress = useGetOwnerVaultAddress()

  const { data, isPending: isPendingTx, error, writeContract } = useWriteContract()
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

  const handleClaim = useCallback(() => {
    if (!tokenAddress || !ownerVaultAddress) return

    writeContract({
      abi: IPOwnerVaultABI as Abi,
      address: ownerVaultAddress as Address,
      functionName: "claim",
      args: [tokenAddress],
    })
  }, [tokenAddress, ownerVaultAddress, writeContract])

  useEffect(() => {
    if (isConfirmed) {
      onSuccess()
    }
  }, [isConfirmed, onSuccess])

  useEffect(() => {
    if (error || txError) {
      toast.error("Failed to claim IP rewards")
    }
  }, [error, txError])

  return { handleClaim, isPending: isPendingTx || isConfirming }
}

export default useClaimIpRewards
