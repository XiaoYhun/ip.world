"use client"

import { useMemo } from "react"
import { Abi, Address, getAddress, isAddress, zeroAddress } from "viem"
import { useReadContracts } from "wagmi"
import { env } from "@/config"
import StoryHuntV3FactoryABI from "@/config/StoryHuntV3Factory.abi.json"
import { getFeeTierOrder } from "@/lib/contracts/v3-fee"

export type PoolAndFeeResult = {
  poolAddress: Address | undefined
  fee: number | undefined
  isLoading: boolean
}

/**
 * Resolves the V3 pool address and fee tier for the pair (Wrapped IP, token).
 * Tries fee tiers in order: migrated tokens try 10000 first, others try 3000 first.
 */
export function usePoolAndFee(tokenAddress: Address | undefined): PoolAndFeeResult {
  const enabled = !!tokenAddress && isAddress(tokenAddress) && tokenAddress !== zeroAddress
  const feeOrder = useMemo(() => (tokenAddress ? getFeeTierOrder(tokenAddress) : [3000, 10000]), [tokenAddress])

  const contracts = useMemo(
    () =>
      enabled
        ? feeOrder.map((fee: number) => ({
            address: env.NEXT_PUBLIC_STORYHUNT_V3_FACTORY,
            abi: StoryHuntV3FactoryABI as Abi,
            functionName: "getPool" as const,
            args: [env.NEXT_PUBLIC_WRAPPED_IP_TOKEN_ADDRESS, getAddress(tokenAddress!), fee] as const,
          }))
        : [],
    [enabled, tokenAddress, feeOrder]
  )

  const { data, isLoading } = useReadContracts({
    contracts,
    query: {
      enabled,
      staleTime: Infinity,
      gcTime: Infinity,
    },
  })

  return useMemo(() => {
    if (!enabled || !data) {
      return {
        poolAddress: undefined,
        fee: undefined,
        isLoading,
      }
    }
    for (let i = 0; i < data.length; i++) {
      const result = data[i]?.result
      const poolAddress = result as Address | undefined
      if (poolAddress && poolAddress !== zeroAddress) {
        return {
          poolAddress,
          fee: feeOrder[i],
          isLoading,
        }
      }
    }
    return {
      poolAddress: zeroAddress,
      fee: undefined,
      isLoading,
    }
  }, [enabled, data, feeOrder, isLoading])
}
