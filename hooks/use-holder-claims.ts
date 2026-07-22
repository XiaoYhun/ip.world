"use client"

import { useQuery } from "@tanstack/react-query"
import { getAuthToken } from "@/lib/dynamic"
import { getAPIRootUrl } from "@/lib/utils"
import { type UgcPayout } from "@/app/(dApp)/token/[tokenAddress]/components/TotalUgcPayoutsCard"
import { formatNumberWithSuffix } from "@/lib/number"

function formatTokenAmount(value: number): string {
  if (value === 0) return "0"
  return formatNumberWithSuffix(value)
}

export type HolderClaimItem = {
  id: string
  wallet: string
  token: string
  holder_meme_token_claimed: string
  holder_meme_token_claimed_usd: string
  holder_wip_claimed: string
  holder_wip_claimed_usd: string
  block_number: string
  claimed_timestamp: string
  transaction_hash: `0x${string}`
}

export type HolderClaimsResponse = {
  items: HolderClaimItem[]
  limit: number
  offset: number
  has_more: boolean
  total_holder_meme_token_claimed: string
  total_holder_wip_claimed: string
  total_claimed_usd: string
  total_holder_meme_token_claimed_usd: string
  total_holder_wip_claimed_usd: string
  total_claim_count: number
}

function emptyHolderClaimsResponse(limit: number): HolderClaimsResponse {
  return {
    items: [],
    limit,
    offset: 0,
    has_more: false,
    total_holder_meme_token_claimed: "0",
    total_holder_wip_claimed: "0",
    total_claimed_usd: "0",
    total_holder_meme_token_claimed_usd: "0",
    total_holder_wip_claimed_usd: "0",
    total_claim_count: 0,
  }
}

function formatTimestamp(ts: string): string {
  const date = new Date(Number(ts) * 1000)
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function mapToUgcPayout(item: HolderClaimItem, tokenSymbol: string): UgcPayout {
  const memeUsd = parseFloat(item.holder_meme_token_claimed_usd) || 0
  const wipUsd = parseFloat(item.holder_wip_claimed_usd) || 0
  return {
    id: item.id,
    amountUsd: memeUsd + wipUsd,
    tokenAmount: `${formatTokenAmount(parseFloat(item.holder_meme_token_claimed))} $${tokenSymbol}`,
    ipAmount: "",
    rangeLabel: formatTimestamp(item.claimed_timestamp),
    txHash: item.transaction_hash,
  }
}

async function fetchHolderClaims(
  tokenAddress: string,
  wallet: string,
  tokenSymbol: string,
  limit: number
): Promise<{ payouts: UgcPayout[]; totalPayoutUsd: number; raw: HolderClaimsResponse }> {
  const token = getAuthToken()
  const headers: HeadersInit = {}
  if (token) {
    headers["X-Authorization"] = `Bearer ${token}`
  }
  const res = await fetch(`${getAPIRootUrl()}/rewards/${tokenAddress}/holder-claims?wallet=${wallet}&limit=${limit}`, {
    headers,
    cache: "no-store",
  })
  if (!res.ok) {
    return { payouts: [], totalPayoutUsd: 0, raw: emptyHolderClaimsResponse(limit) }
  }
  const data: HolderClaimsResponse = await res.json()
  return {
    payouts: (data.items ?? []).map((item) => mapToUgcPayout(item, tokenSymbol)),
    totalPayoutUsd: parseFloat(data.total_claimed_usd) || 0,
    raw: data,
  }
}

export function useHolderClaims(
  tokenAddress: string | undefined,
  wallet: string | undefined,
  tokenSymbol = "",
  limit = 12
) {
  return useQuery({
    queryKey: ["holder-claims", tokenAddress, wallet, tokenSymbol, limit],
    queryFn: () => fetchHolderClaims(tokenAddress!, wallet!, tokenSymbol, limit),
    enabled: !!tokenAddress && !!wallet,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}
