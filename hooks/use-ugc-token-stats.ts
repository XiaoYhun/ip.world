"use client"

import { useQuery } from "@tanstack/react-query"
import { useAccount } from "@/hooks/use-account"
import { getAuthToken } from "@/lib/dynamic"
import { getAPIRootUrl } from "@/lib/utils"

type UGCTokenCreatorMe = {
  current_window_estimated_payout_usd: number
  current_window_estimated_payout_ip?: number
  current_window_estimated_payout_token?: number
  current_window_estimated_payout_ip_usd?: number
  current_window_estimated_payout_token_usd?: number
  last_paid_out_usd: number
  historical_paid_out_usd: number
  current_window_rank?: number
  post_count: number
  total_impressions: number
}

export type RewardStatsPoolRewards = {
  label: string
  source: string
  use_up_to_percent: number
  amount_ip: number
  amount_token: number
  amount_usd: number
  locked: boolean
  plan_id?: string
  plan_status?: string
}

type UGCTopEarner = {
  creator_id: string
  total_earned_usd: number
  post_count: number
}

export type UGCTokenStats = {
  token_id: string
  total_pool_usd: number
  current_pool_amount_ip: number
  current_pool_amount_token: number
  historical_paid_out_ip: number
  historical_paid_out_token: number
  historical_paid_out_usd: number
  window_id: string | null
  window_start_at: string | null
  window_end_at: string | null
  next_payout_at: string | null
  payout_status: string
  payout_stage: string
  payout_window_is_late?: boolean
  pool_rewards?: RewardStatsPoolRewards
  total_eligible_creators: number
  top_earners: UGCTopEarner[]
  me?: UGCTokenCreatorMe
}

async function fetchUGCStats(remixId: string): Promise<UGCTokenStats> {
  const token = getAuthToken()
  const headers: HeadersInit = {}
  if (token) {
    headers["X-Authorization"] = `Bearer ${token}`
  }
  const res = await fetch(`${getAPIRootUrl()}/remixes/${remixId}/ugc/stats`, {
    headers,
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
  return res.json()
}

export function useUGCTokenStats(remixId: string | undefined) {
  const { address } = useAccount()

  const { data, isLoading, isError, refetch } = useQuery<UGCTokenStats>({
    queryKey: ["ugc-token-stats", remixId, address],
    queryFn: () => fetchUGCStats(remixId!),
    enabled: !!remixId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })

  return {
    data: data ?? null,
    isLoading,
    isError,
    refetch,
  }
}
