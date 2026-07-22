export type Feed = {
  id: string
  ip_id: string
  uid: string
  kind: string
  body_text: string
  body_urls: string
  author_id: string
  author_handle: string
  author_name: string
  author_avatar: string
  author_verified: boolean
  likes_count: number
  quotes_count: number
  replies_count: number
  retweets_count: number
  views_count: number
  bookmark_count: number
  symbols?: string[]
  token_ids?: string[]
  deleted: boolean
  label_ids?: string[]
  timestamp: 1745776916
  subtweet?: string[]
  created_at: string
  updated_at: string
  media?: {
    images?: string[]
    videos?: string[]
  }
  type?: string
  dynamic_cover_url?: string
  play_count?: number
  digg_count?: number
  comment_count?: number
  share_count?: number
  keywords?: string[]
  description?: string
  ugc_payout?: {
    summary: {
      total_payout_ip: number
      total_payout_token: number
      total_payout_ip_usd: number
      total_payout_token_usd: number
      total_payout_usd: number
      windows_count: number
      last_window_id: string
      last_window_end_at: string
    }
    latest_window: {
      window_id: string
      window_start_at: string
      window_end_at: string
      payout_amount_ip: number
      payout_amount_token: number
      payout_amount_ip_usd: number
      payout_amount_token_usd: number
      payout_amount_usd: number
    }
  }
}
