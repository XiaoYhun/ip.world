import { Address } from "viem"
import { SOCIAL_TYPE } from "@/components/socials"
import { Remix } from "./remix"

export type Ip = {
  id: string
  title: string
  description: string
  allocation: number
  alias: string
  creator?: string | null
  image: string
  socials: Record<string, string> | null
  created_at: string
  updated_at: string
  daily_volume: number
  is_verified: boolean
  is_claimed: boolean
  handle: string
  moderator_verification_status: number
  moderator_verification_metadata: {
    reason: string
    metadata: Record<string, object> | null
  }
  moderator_verification_timestamp: string
  market_cap: number
  remixes_count: number
  is_licensed: boolean
  owner_account: string
  owner_account_type?: SOCIAL_TYPE
  owner_account_suggestion_id: string
  status: IP_STATUS
  ipa_hash: string
  remixes: Remix[] | null
  type: "creator" | "community"
  total_income: number
  verification: {
    status: boolean
    age: number
    age_status: boolean
    holders_status: boolean
    market_cap_status: boolean
    total_income: number
    required_market_cap: number
    required_age: number
    required_holders: number
    holders: number
  }
  total_holder_count: number
  total_impressions: number
  total_impressions_changes?: number
  total_likes: number
  total_likes_changes: number
  total_shares: number
  total_shares_changes: number

  ipa_id?: Address
  tags?: Tag[] | null
  owner_address?: Address | null
  category?: string
  viral_score?: number
  tiktok_score?: number
  twitter_score?: number
  sentiment_score?: number
  market_score?: number
  take_info?: {
    total_count: number
    average_rating: number
  }
  trending_rank_category?: number
  trending_rank_category_changes?: number
  viral_rank?: number
  viral_rank_changes?: number
  safe_address?: string
  snapshot_space_id?: string
  relevance_profile?: string
  ai_summary?: string
  owner_rewards_usd?: number
}

export type Tag = {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export enum IP_STATUS {
  DRAFT = "draft",
  PRE_REGISTERED = "pre_registered",
  REGISTERED = "registered",
  CLAIMED = "claimed",
}

export type IpFormData = {
  image: string
  name: string
  description: string
  allocation: number
  creator_address: string
  socials?: {
    twitter?: string
    instagram?: string
    tiktok?: string
    website?: string
  }
}

export type Comment = {
  id: string
  token_address: string
  author_address: string
  votes_count: number
  rating: number
  content: string
  created_at: string
  updated_at: string
  author: {
    wallet_address: string
    username: string
    referral_code: string
    created_at: string | null
    updated_at: string | null
    trading_volume: number
    display_name: string
    bio: string
    avatar_url: string
  }
  ip: Ip
}

export type Explore = {
  total_remixes: number
  total_user_rewards: number
  viral_ips: {
    total: number
    limit: number
    offset: number
    results: Ip[]
  }
  top_takes: Comment[]
}
