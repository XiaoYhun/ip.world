"use client"

import { useMemo } from "react"
import { Abi, Address } from "viem"
import { useReadContracts } from "wagmi"
import IPOwnerVaultABI from "@/config/IPOwnerVault.abi.json"
import IPTokenABI from "@/config/IPToken.abi.json"
import { bigNumberToFloat } from "@/lib/bignumber"
import { getContractAddress } from "@/lib/services"
import { Remix } from "@/types/remix"

export type OwnerRemixDetails = {
  remix: Remix
  releasable: bigint
  releasableFormatted: number
  released: bigint
  releasedFormatted: number
  currentBalance: bigint
  currentBalanceFormatted: number
  balancePercentage: number // (releasable + current balance) / total vested
  totalSupply: bigint
  totalSupplyFormatted: number
  remaining: bigint
  remainingFormatted: number
  owdAmountFormatted: number
  vestingPercentage: number
}

export const useGetOwnerRemixDetails = (userAddress?: Address, remixes?: Remix[]) => {
  // Get owner vault address from IPWorld contract
  const ownerVaultAddress = getContractAddress("IPOwnerVault")

  // Create all contract calls in a single multicall
  const contracts = useMemo(() => {
    if (!ownerVaultAddress || !userAddress || !remixes?.length) return []

    const calls: {
      abi: Abi
      address: Address
      functionName: string
      args: readonly unknown[]
    }[] = []

    // Add calls for each remix token
    remixes.forEach((remix) => {
      // 1. releasable(token) call
      calls.push({
        abi: IPOwnerVaultABI as Abi,
        address: ownerVaultAddress as Address,
        functionName: "releasable",
        args: [remix.token_address],
      })

      // 2. released(token) call
      calls.push({
        abi: IPOwnerVaultABI as Abi,
        address: ownerVaultAddress as Address,
        functionName: "released",
        args: [remix.token_address],
      })

      // 3. remaining(token) call
      calls.push({
        abi: IPOwnerVaultABI as Abi,
        address: ownerVaultAddress as Address,
        functionName: "remaining",
        args: [remix.token_address],
      })

      // 4. balanceOf(userAddress) call
      calls.push({
        address: remix.token_address as Address,
        abi: IPTokenABI as Abi,
        functionName: "balanceOf",
        args: [userAddress],
      })

      // 5. totalSupply(token) call
      calls.push({
        address: remix.token_address as Address,
        abi: IPTokenABI as Abi,
        functionName: "totalSupply",
        args: [],
      })

      // 6. owdAmount(token) call
      calls.push({
        address: ownerVaultAddress as Address,
        abi: IPOwnerVaultABI as Abi,
        functionName: "owdAmount",
        args: [remix.token_address],
      })
    })

    return calls
  }, [ownerVaultAddress, userAddress, remixes])

  // Single multicall for all contract calls
  const {
    data: multicallData,
    isLoading,
    refetch,
  } = useReadContracts({
    contracts,
    query: {
      enabled: !!ownerVaultAddress && !!userAddress && !!remixes?.length,
      refetchInterval: 30000, // Refresh every 30 seconds
    },
    multicallAddress: "0xcA11bde05977b3631167028862bE2a173976CA11",
  })

  // Transform the data into a structured format
  const ownerRemixDetails = useMemo(() => {
    if (!remixes?.length || !multicallData?.length) return []

    const processedDetails = remixes.map((remix, index) => {
      // Each remix has 5 consecutive calls: releasable, released, remaining, balanceOf, totalSupply
      const baseIndex = index * 6

      const releasableResult = multicallData[baseIndex]
      const releasedResult = multicallData[baseIndex + 1]
      const remainingResult = multicallData[baseIndex + 2]
      const balanceResult = multicallData[baseIndex + 3]
      const totalSupplyResult = multicallData[baseIndex + 4]
      const owdAmountResult = multicallData[baseIndex + 5]
      const totalSupply = (totalSupplyResult?.result as bigint) || BigInt(0)
      const totalSupplyFormatted = bigNumberToFloat(totalSupply, remix.decimals)
      const remaining = (remainingResult?.result as bigint) || BigInt(0)
      const releasable = (releasableResult?.result as bigint) || BigInt(0)
      const currentBalance = (balanceResult?.result as bigint) || BigInt(0)
      const released = (releasedResult?.result as bigint) || BigInt(0)
      const releasableFormatted = bigNumberToFloat(releasable, remix.decimals)
      const currentBalanceFormatted = bigNumberToFloat(currentBalance, remix.decimals)
      const releasedFormatted = bigNumberToFloat(released, remix.decimals)
      // const claimableTotal = released + remaining
      const remainingFormatted = bigNumberToFloat(remaining, remix.decimals)
      const totalClaimed = releasableFormatted + releasedFormatted
      const owdAmountFormatted = bigNumberToFloat(owdAmountResult?.result as bigint, remix.decimals)
      const balancePercentage = remainingFormatted === 0 ? 0 : (totalClaimed / remainingFormatted) * 100
      const vestingPercentage =
        remainingFormatted === 0 ? 0 : (remainingFormatted / (remainingFormatted + totalClaimed)) * 100

      return {
        remix,
        releasable,
        releasableFormatted,
        released,
        releasedFormatted,
        currentBalance,
        currentBalanceFormatted,
        balancePercentage,
        totalSupply,
        totalSupplyFormatted,
        remaining,
        remainingFormatted,
        owdAmountFormatted,
        vestingPercentage,
      }
    })

    return processedDetails
  }, [remixes, multicallData])

  const totalLoading = isLoading

  return {
    ownerRemixDetails,
    isLoading: totalLoading,
    refetch,
  }
}
