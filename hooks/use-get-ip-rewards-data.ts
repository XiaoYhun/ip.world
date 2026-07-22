import { useCallback, useMemo, useState } from "react"
import { Abi, Address } from "viem"
import { useReadContract, useReadContracts } from "wagmi"
import { useAccount } from "@/hooks/use-account"
import { env } from "@/config"
import IPTokenABI from "@/config/IPToken.abi.json"
import IpWorldABI from "@/config/IPWorld.abi.json"
import IPWorldOwnerVaultABI from "@/config/IPWorldOwnerVault.abi.json"
import { bigNumberToFloat } from "@/lib/bignumber"

export type RewardDataType = {
  harvested: boolean
  vested: number
  total: number
  balance: number
  claimable: number
}

const useGetIpRewardsData = (tokens: Address[]) => {
  const { address } = useAccount()

  const [currentUnixTimestamp, setCurrentUnixTimestamp] = useState(() => Math.floor(Date.now() / 1000))

  const { data: ownerVaultAddress, isLoading: isLoadingOwnerVaultAddress } = useReadContract({
    abi: IpWorldABI,
    address: env.NEXT_PUBLIC_IP_WORLD_ADDRESS,
    functionName: "ownerVault",
  })

  const {
    data: released,
    refetch: refetchReleased,
    isLoading: isLoadingReleased,
  } = useReadContracts({
    contracts: tokens.map((token) => ({
      abi: IPWorldOwnerVaultABI as Abi,
      address: ownerVaultAddress as Address,
      functionName: "released",
      args: [token],
    })),
  })

  const {
    data: remaining,
    refetch: refetchRemaining,
    isLoading: isLoadingRemaining,
  } = useReadContracts({
    contracts: tokens.map((token) => ({
      abi: IPWorldOwnerVaultABI as Abi,
      address: ownerVaultAddress as Address,
      functionName: "remaining",
      args: [token],
    })),
  })

  const {
    data: vestedAmount,
    refetch: refetchVestedAmount,
    isLoading: isLoadingVestedAmount,
  } = useReadContracts({
    contracts: tokens.map((token) => ({
      abi: IPWorldOwnerVaultABI as Abi,
      address: ownerVaultAddress as Address,
      functionName: "vestedAmount",
      args: [token, currentUnixTimestamp],
    })),
  })

  const {
    data: ownerVaultBalance,
    refetch: refetchOwnerVaultBalance,
    isLoading: isLoadingOwnerVaultBalance,
  } = useReadContracts({
    contracts: tokens.map((token) => ({
      address: token,
      abi: IPTokenABI as Abi,
      functionName: "balanceOf",
      args: [ownerVaultAddress],
    })),
  })

  const {
    data: ownerBalance,
    refetch: refetchOwnerBalance,
    isLoading: isLoadingOwnerBalance,
  } = useReadContracts({
    contracts: tokens.map((token) => ({
      address: token,
      abi: IPTokenABI as Abi,
      functionName: "balanceOf",
      args: [address],
    })),
  })

  const {
    data: vesting,
    refetch: refetchVesting,
    isLoading: isLoadingVesting,
  } = useReadContracts({
    contracts: tokens.map((token) => ({
      abi: IPWorldOwnerVaultABI as Abi,
      address: ownerVaultAddress as Address,
      functionName: "vesting",
      args: [token],
    })),
  })

  const result = useMemo(() => {
    const result = new Map<Address, RewardDataType>()

    tokens.forEach((token, index) => {
      const vestingData = vesting?.[index]?.result as { isSet: boolean }

      const harvested = (vestingData?.isSet ?? false) as boolean
      const releasedAmount = (released?.[index]?.result ?? BigInt(0)) as bigint
      const remainingAmount = (remaining?.[index]?.result ?? BigInt(0)) as bigint
      const ownerVaultBalanceAmount = (ownerVaultBalance?.[index]?.result ?? BigInt(0)) as bigint
      const ownerBalanceAmount = (ownerBalance?.[index]?.result ?? BigInt(0)) as bigint
      const vestedAmountValue = (vestedAmount?.[index]?.result ?? BigInt(0)) as bigint

      const claimableAmount = ownerVaultBalanceAmount + vestedAmountValue - releasedAmount - remainingAmount

      result.set(token, {
        harvested,
        vested: bigNumberToFloat(releasedAmount, 18),
        total: bigNumberToFloat(releasedAmount, 18) + bigNumberToFloat(remainingAmount, 18),
        balance: bigNumberToFloat(ownerBalanceAmount, 18),
        claimable: bigNumberToFloat(claimableAmount, 18),
      })
    })

    return result
  }, [tokens, vesting, released, remaining, ownerVaultBalance, ownerBalance, vestedAmount])

  const refetch = useCallback(() => {
    setCurrentUnixTimestamp(Math.floor(Date.now() / 1000))

    setTimeout(() => {
      refetchReleased()
      refetchRemaining()
      refetchOwnerVaultBalance()
      refetchOwnerBalance()
      refetchVestedAmount()
      refetchVesting()
    }, 0)
  }, [
    refetchReleased,
    refetchRemaining,
    refetchOwnerVaultBalance,
    refetchOwnerBalance,
    refetchVestedAmount,
    refetchVesting,
  ])

  return {
    data: result,
    refetch,
    isLoading:
      isLoadingOwnerVaultAddress ||
      isLoadingReleased ||
      isLoadingRemaining ||
      isLoadingVestedAmount ||
      isLoadingOwnerVaultBalance ||
      isLoadingOwnerBalance ||
      isLoadingVesting,
  }
}

export default useGetIpRewardsData
