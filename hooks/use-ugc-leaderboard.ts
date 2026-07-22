"use client"

import { useQuery } from "@tanstack/react-query"
import { getAuthToken } from "@/lib/dynamic"
import { getAPIRootUrl } from "@/lib/utils"

export type UGCLeaderboardEntry = {
  creator_id: string
  username?: string
  rank: number
  points: number
  ugc_earnings_usd: number
  impressions: number
  post_count: number
  joined_at?: string
  referral_count: number
}

type UGCLeaderboardResponse = {
  items: UGCLeaderboardEntry[]
}

async function fetchUGCLeaderboard(tokenAddress: string, limit: number): Promise<UGCLeaderboardEntry[]> {
  const token = getAuthToken()
  const headers: HeadersInit = {}
  if (token) {
    headers["X-Authorization"] = `Bearer ${token}`
  }
  const res = await fetch(
    `${getAPIRootUrl()}/remixes/${tokenAddress}/ugc/leaderboard?limit=${limit}`,
    { headers, cache: "no-store" }
  )
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
  const data: UGCLeaderboardResponse = await res.json()
  return data.items ?? []
}

export function useUGCLeaderboard(tokenAddress: string | undefined, limit = 7) {
  return useQuery<UGCLeaderboardEntry[]>({
    queryKey: ["ugc-leaderboard", tokenAddress, limit],
    queryFn: () => fetchUGCLeaderboard(tokenAddress!, limit),
    enabled: !!tokenAddress,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}
