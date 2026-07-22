"use client"

import { useQuery } from "@tanstack/react-query"
import { useAccount } from "@/hooks/use-account"
import { getAuthToken } from "@/lib/dynamic"
import { getAPIRootUrl } from "@/lib/utils"
import type { RewardStatsPoolRewards } from "./use-ugc-token-stats"

type HolderRewardStatsMe = {
  holder_address: string
  rank?: number
  is_eligible?: boolean
  estimated_payout_ip: number
  estimated_payout_token: number
  estimated_payout_usd: number
  total_earned_ip: number
  total_earned_token: number
  total_earned_usd: number
}

export type HolderRewardStats = {
  token_id: string
  window_id: string
  window_start_at: string
  window_end_at: string
  payout_status: string
  payout_stage: string
  current_pool_usd: number
  current_pool_ip: number
  current_pool_token: number
  pool_rewards?: RewardStatsPoolRewards
  historical_paid_out_ip: number
  historical_paid_out_token: number
  total_rewards_earned_usd: number
  tracked_holders: number
  eligible_holders: number
  last_refreshed_at: string
  is_stale: boolean
  me?: HolderRewardStatsMe
}

async function fetchHolderRewardStats(tokenAddress: string): Promise<HolderRewardStats> {
  const token = getAuthToken()
  const headers: HeadersInit = {}
  if (token) {
    headers["X-Authorization"] = `Bearer ${token}`
  }
  const res = await fetch(`${getAPIRootUrl()}/remixes/${tokenAddress}/holder-rewards/stats`, {
    headers,
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`Failed to fetch holder reward stats: ${res.status}`)
  return res.json()
}

export function useHolderRewardStats(tokenAddress: string | undefined) {
  const { address } = useAccount()

  return useQuery({
    queryKey: ["holder-reward-stats", tokenAddress, address],
    queryFn: () => fetchHolderRewardStats(tokenAddress!),
    enabled: !!tokenAddress,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}
