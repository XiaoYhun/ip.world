import { SOCIAL_TYPE } from "@/components/socials"
import { Ip, Tag } from "./ip"

export type Remix = {
  chain: string
  created_at: string
  creator: string
  creator_username?: string
  creator_fee: number
  daily_tx_count?: number
  daily_volume: number
  daily_volume_change: number
  decimals: number
  default_remix?: boolean
  description: string
  holdings_amount?: string
  holdings_value_usd?: string
  graduation_progress?: number
  id: string
  image: string
  ip?: Ip | null
  ip_id?: string
  ip_link_status?: string
  is_endorsed?: boolean
  is_featured?: boolean
  is_graduated?: boolean
  is_liked?: boolean
  is_spam?: boolean
  is_verified?: boolean
  market_cap: number
  market_cap_change: number
  name: string
  number_of_comments: number
  number_of_holders: number
  owner_endorsement?: "none" | "official" | "liked" | "flagged"
  pool_size: number
  pool_size_change: number
  price_usd: number
  price_usd_change: number
  socials?: Record<SOCIAL_TYPE, string>
  symbol: string
  reward_chest_usd?: number
  tags?: Tag[]
  snapshot_space_id?: string
  token_address: string
  token_created_at: string
  total_volume_usd?: number
  total_volume_usd_change?: number
  total_tokens_burned?: number
  total_tokens_burned_usd?: number
  total_weth_to_ip_owner?: number
  total_weth_to_ip_owner_usd?: number
  updated_at: string
  social_stats?: {
    total_views: number
    total_likes: number
    total_post_count: number
    x_post_count: number
    tiktok_post_count: number
    number_of_holders: number
  }
  trading_metrics?: {
    [interval in "5m" | "1h" | "6h" | "24h" | "7d"]?: {
      tx_count: number
      buy_count: number
      sell_count: number
      volume: number
      buy_volume: number
      sell_volume: number
      price_change: number
      tx_count_change: number
      volume_change: number
    }
  }
  price_7d?: Array<{
    close_price_usd: string
    timestamp: string
  }>
}

export type RemixFormData = {
  image: string
  name: string
  symbol: string
  anti_snipe: boolean
  allocation: number
  description: string
  creator_address: string
  token_address?: string
  ip_id?: string
  socials?: {
    twitter?: string
    instagram?: string
    tiktok?: string
    website?: string
  }
}
