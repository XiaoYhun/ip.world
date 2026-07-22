import { SOCIAL_TYPE } from "@/components/socials"

export type UserStats = {
  remixes_created: number
  ips_created: number
  favorites_count: number
  portfolio_value: number
  total_points: number
  rank: number
  tier: string
}

export type User = {
  wallet_address: string
  embedded_wallet_address?: string
  username: string
  referral_code: string
  created_at: string
  updated_at: string
  trading_volume: number
  display_name: string
  bio: string
  avatar_url: string
  socials: Record<SOCIAL_TYPE, string>
}

export type UgcStats = {
  total_earning_usd: number
  total_impressions: number
}

export type UserProfile = {
  stats: UserStats
  user: User
  ugc?: UgcStats
}
