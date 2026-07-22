"use server"

import { env } from "@/config"
import { Leaderboard, UserStatsResponse } from "@/types/leaderboard"
import { ListResponse } from "@/types/response"

export const fetchLeaderboard = async ({
  query,
  limit,
  offset,
}: {
  query: string
  limit: number
  offset: number
}): Promise<ListResponse<Leaderboard>> => {
  const response = await fetch(
    `${env.NEXT_PUBLIC_API_BASE_URL}/leaderboard${query ? `?search=${query}` : "?"}` +
      `&limit=${limit}&offset=${offset}`
  )

  if (!response.ok) {
    return {
      results: [],
      total: 0,
      limit,
      offset,
    }
  }

  const data = (await response.json()) as ListResponse<Leaderboard>

  return data
}

export type UGCLeaderboardEntry = {
  creator_id: string
  username: string
  rank: number
  points: number
  ugc_earnings_usd: number
  impressions: number
  post_count: number
  joined_at: string
  referral_count: number
  avatar_url?: string
  display_name?: string
}

export const fetchUGCLeaderboard = async ({
  limit,
  offset,
}: {
  limit: number
  offset: number
}): Promise<{ items: UGCLeaderboardEntry[] }> => {
  const response = await fetch(
    `${env.NEXT_PUBLIC_API_BASE_URL}/ugc/leaderboard?limit=${limit}&offset=${offset}`
  )

  if (!response.ok) {
    return { items: [] }
  }

  const data = (await response.json()) as { items: UGCLeaderboardEntry[] }
  return data
}

export const fetchUserStats = async (userAddress: string): Promise<UserStatsResponse> => {
  const response = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/users/${userAddress}/rewards`)

  if (!response.ok) {
    return {
      current_rank: 0,
      total_points: 0,
      tier: "",
      referral_count: 0,
      trading_volume: 0,
      points_change_1d: 0,
      points_change_7d: 0,
      points_change_30d: 0,
      points_change_90d: 0,
      points_change_all: 0,
      referral_change_1d: 0,
      referral_change_7d: 0,
      referral_change_30d: 0,
      referral_change_90d: 0,
      referral_change_all: 0,
      volume_change_1d: 0,
      volume_change_7d: 0,
      volume_change_30d: 0,
      volume_change_90d: 0,
      volume_change_all: 0,
      onboarding_quests: {
        link_x: false,
        link_tiktok: false,
        add_username: false,
        first_trade: false,
        first_ip: false,
        first_remix: false,
      },
      referred_users: null,
      remixes_created: 0,
      ips_created: 0,
      favorites_count: 0,
      total_points_earned_from_referrals: 0,
    }
  }

  const data = (await response.json()) as UserStatsResponse
  return data
}
