"use client"

import { useCallback, useMemo } from "react"
import { Abi, Address } from "viem"
import { useReadContracts } from "wagmi"
import { useAccount } from "@/hooks/use-account"
import IPOwnerVaultABI from "@/config/IPOwnerVault.abi.json"
import { useProfile } from "@/hooks/use-profile"
import { useIpPrice } from "@/context/token-metrics-context"
import { useGetOwnerRemixDetails } from "@/hooks/use-get-owner-remix-details"
import { useAllRemixes } from "@/hooks/use-remixes"
import { bigNumberToFloat } from "@/lib/bignumber"
import { getContractAddress } from "@/lib/contracts/addresses"

export const useIpTotalLockedValue = (ipId: string, isClaimed: boolean) => {
  const { address } = useAccount()
  const { user } = useProfile()
  const ipPrice = useIpPrice()

  // Get user address from either wallet connection or profile
  const userAddress = (address || user?.wallet_address) as Address

  // Fetch all remixes for this IP (no pagination)
  const { remixes, isLoading: isLoadingRemixes } = useAllRemixes(ipId, "market_cap", "desc", 80)

  // Get owner vault address
  const ownerVaultAddress = getContractAddress("IPOwnerVault")

  // Fetch remaining amounts for each remix token (only if claimed)
  const {
    data: remainingAmounts,
    refetch: refetchRemainingAmounts,
    isLoading: isLoadingRemaining,
  } = useReadContracts({
    contracts: remixes.map((remix) => ({
      abi: IPOwnerVaultABI as Abi,
      address: ownerVaultAddress as Address,
      functionName: "remaining",
      args: [remix.token_address],
    })),
    query: {
      enabled: !!ownerVaultAddress && remixes.length > 0 && isClaimed,
      refetchInterval: 0, // No refresh
    },
    multicallAddress: "0xcA11bde05977b3631167028862bE2a173976CA11",
  })

  // Fetch owdAmount for each remix token (for IP locked value calculation)
  const {
    data: owdAmounts,
    refetch: refetchOwdAmounts,
    isLoading: isLoadingOwdAmounts,
  } = useReadContracts({
    contracts: remixes.map((remix) => ({
      abi: IPOwnerVaultABI as Abi,
      address: ownerVaultAddress as Address,
      functionName: "owdAmount",
      args: [remix.token_address],
    })),
    query: {
      enabled: !!ownerVaultAddress && remixes.length > 0,
      refetchInterval: 0, // No refresh
    },
    multicallAddress: "0xcA11bde05977b3631167028862bE2a173976CA11",
  })

  // Fetch owner remix details for shared data (maintaining compatibility with manage IP dialog)
  const {
    ownerRemixDetails,
    refetch: refetchOwnerRemixDetails,
    isLoading: isLoadingRemixDetails,
  } = useGetOwnerRemixDetails(userAddress, remixes)

  // Combined refetch function for all data
  const refetchAll = useCallback(async () => {
    await Promise.all([refetchRemainingAmounts(), refetchOwdAmounts(), refetchOwnerRemixDetails()])
  }, [refetchRemainingAmounts, refetchOwdAmounts, refetchOwnerRemixDetails])

  // Calculate total locked value
  const totalLockedValueUSD = useMemo(() => {
    if (!remixes.length) return 0

    // NOT CLAIMED: Use 30M for remaining amounts, but still use contract owdAmounts
    if (!isClaimed) {
      if (!owdAmounts) return 0 // Wait for owdAmounts to load

      const remixLockedValue = remixes.reduce((total, remix) => {
        const tokenPrice = remix.price_usd || 0
        return total + 30_000_000 * tokenPrice
      }, 0)

      const ipLockedValue = remixes.reduce((total, remix, index) => {
        const owdAmount = (owdAmounts[index]?.result as bigint) || BigInt(0)
        const owdAmountFormatted = bigNumberToFloat(owdAmount, remix.decimals)
        return total + owdAmountFormatted * (ipPrice || 0)
      }, 0)

      return remixLockedValue + ipLockedValue
    }

    // CLAIMED: Use contract data (return 0 if still loading)
    if (!remainingAmounts || !owdAmounts) return 0

    // Calculate total from remix tokens (remaining * token_price)
    const remixLockedValue = remixes.reduce((total, remix, index) => {
      const tokenPrice = remix.price_usd || 0
      const remainingAmount = (remainingAmounts[index]?.result as bigint) || BigInt(0)
      const remainingFormatted = bigNumberToFloat(remainingAmount, remix.decimals)
      return total + remainingFormatted * tokenPrice
    }, 0)

    // Calculate total from IP tokens (owdAmount * ip_price)
    const ipLockedValue = remixes.reduce((total, remix, index) => {
      const owdAmount = (owdAmounts[index]?.result as bigint) || BigInt(0)
      const owdAmountFormatted = bigNumberToFloat(owdAmount, remix.decimals)
      return total + owdAmountFormatted * (ipPrice || 0)
    }, 0)

    return remixLockedValue + ipLockedValue
  }, [remainingAmounts, owdAmounts, remixes, ipPrice, isClaimed])

  const isLoading =
    isLoadingRemixes || isLoadingRemixDetails || isLoadingOwdAmounts || (isClaimed && isLoadingRemaining)

  return {
    totalLockedValueUSD,
    remixes,
    ownerRemixDetails,
    owdAmounts,
    remainingAmounts,
    isLoading,
    refetchAll,
  }
}
