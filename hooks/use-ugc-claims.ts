"use client"

import { useQuery } from "@tanstack/react-query"
import { getAPIRootUrl } from "@/lib/utils"
import { formatNumberWithSuffix } from "@/lib/number"
import { UgcPayout } from "@/app/(dApp)/token/[tokenAddress]/components/TotalUgcPayoutsCard"

type UgcClaimItem = {
  id: string
  wallet: string
  token: string
  ugc_meme_token_claimed: string
  ugc_meme_token_claimed_usd: string
  ugc_wip_claimed: string
  ugc_wip_claimed_usd: string
  block_number: string
  claimed_timestamp: string
  transaction_hash?: `0x${string}`
}

type UgcClaimsResponse = {
  items: UgcClaimItem[]
  limit: number
  offset: number
  has_more: boolean
  total_ugc_meme_token_claimed: string
  total_ugc_wip_claimed: string
  total_claimed_usd: string
  total_ugc_meme_token_claimed_usd: string
  total_ugc_wip_claimed_usd: string
}

function formatTimestamp(unixSeconds: string): string {
  return new Date(Number(unixSeconds) * 1000)
    .toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
    .toUpperCase()
}

function mapToUgcPayout(item: UgcClaimItem, tokenSymbol: string): UgcPayout {
  const tokenAmount = Number(item.ugc_meme_token_claimed)
  const wipAmount = Number(item.ugc_wip_claimed)
  const totalUsd = Number(item.ugc_meme_token_claimed_usd) + Number(item.ugc_wip_claimed_usd)

  return {
    id: item.id,
    amountUsd: totalUsd,
    tokenAmount: `${formatNumberWithSuffix(tokenAmount)} $${tokenSymbol}`,
    ipAmount: `${formatNumberWithSuffix(wipAmount)} $IP`,
    rangeLabel: formatTimestamp(item.claimed_timestamp),
    txHash: item.transaction_hash,
  }
}

export function useUgcClaims(
  tokenAddress: string | undefined,
  walletAddress: string | undefined,
  tokenSymbol = "TOKEN",
  limit = 20
) {
  const { data, isLoading, isError, refetch } = useQuery<{
    payouts: UgcPayout[]
    totalUsd: number
    totalTokenClaimed: string
    totalWipClaimed: string
    hasMore: boolean
  } | null>({
    queryKey: ["ugc-claims", tokenAddress, walletAddress, limit],
    queryFn: async () => {
      const res = await fetch(
        `${getAPIRootUrl()}/rewards/${tokenAddress}/ugc-claims?wallet=${walletAddress}&limit=${limit}`
      )
      if (!res.ok) return null
      const json: UgcClaimsResponse = await res.json()
      return {
        payouts: (json.items ?? []).map((item) => mapToUgcPayout(item, tokenSymbol)),
        totalUsd: Number(json.total_claimed_usd),
        totalTokenClaimed: json.total_ugc_meme_token_claimed,
        totalWipClaimed: json.total_ugc_wip_claimed,
        hasMore: json.has_more,
      }
    },
    enabled: !!tokenAddress && !!walletAddress,
    staleTime: 60_000,
  })

  return {
    payouts: data?.payouts ?? null,
    totalUsd: data?.totalUsd ?? null,
    totalTokenClaimed: data?.totalTokenClaimed ?? "0",
    totalWipClaimed: data?.totalWipClaimed ?? "0",
    hasMore: data?.hasMore ?? false,
    isLoading,
    isError,
    refetch,
  }
}
