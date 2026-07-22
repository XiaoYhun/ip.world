export type Leaderboard = {
  avatar_url: string
  display_name: string
  rank: number
  referral_amount: number
  referral_points: number
  socials?: Socials | null
  tier: string
  total_points: number
  trading_points: number
  trading_volume: number
  username: string
  wallet_address: string
  joined_at: string
}

type Socials = {
  twitter: string
  instagram: string
  tiktok: string
  telegram: string
  facebook: string
  reddit: string
  linkedin: string
  website: string
  youtube: string
}

type ReferredUser = {
  username: string
  wallet_address: string
  display_name: string
  avatar_url: string
  socials: Socials
  points_earned: number
  joined_at: string
}

type OnboardingQuests = {
  link_x: boolean
  link_tiktok: boolean
  add_username: boolean
  first_trade: boolean
  first_ip: boolean
  first_remix: boolean
}

export type UserStatsResponse = {
  current_rank: number
  total_points: number
  tier: string
  referral_count: number
  trading_volume: number
  points_change_1d: number
  points_change_7d: number
  points_change_30d: number
  points_change_90d: number
  points_change_all: number
  referral_change_1d: number
  referral_change_7d: number
  referral_change_30d: number
  referral_change_90d: number
  referral_change_all: number
  volume_change_1d: number
  volume_change_7d: number
  volume_change_30d: number
  volume_change_90d: number
  volume_change_all: number
  onboarding_quests: OnboardingQuests
  referred_users: ReferredUser[] | null
  remixes_created: number
  ips_created: number
  favorites_count: number
  total_points_earned_from_referrals: number
}
