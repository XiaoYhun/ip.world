import { SOCIAL_TYPE } from "@/components/socials"

export type Referral = {
  id: string
  username: string
  referrer_username: string
  referred_wallet_address: string
  referrer_wallet_address: string
  referral_code_used: string
  status: string // You might want to use a union type like "active" | "inactive" | etc. if there are specific possible values
  created_at: string // or Date if you'll parse it
  updated_at: string // or Date if you'll parse it
  display_name: string
  avatar_url: string
  bio: string
  total_points: number
  value_ip: number
  points_earned: number
  referral_date: string // or Date if you'll parse it
  rank: number
  tier: string // You might want to use a union type like "normie" | "pro" | etc. if there are specific tiers
  socials: Record<SOCIAL_TYPE, string>
}
