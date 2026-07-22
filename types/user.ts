import { SocialLink } from "@/app/(dApp)/create/_components/SocialLinks"
import { Ip } from "./ip"
import { Remix } from "./remix"

export type User = {
  wallet_address: string
  embedded_wallet_address?: string
  username: string
  display_name: string
  bio: string
  avatar_url: string
  referral_code: string
  socials?: SocialLink[]
  created_at?: string
  updated_at?: string
}

// Favorite types based on actual API responses
export type IpFavorite = {
  user_address: string
  token_address: string
  ip_id: string
  created_at: string
  updated_at: string
  ip: Ip
}

export type TokenFavorite = {
  user_address: string
  token_address: string
  created_at: string
  updated_at: string
  remix: Remix
}

// Union type for favorites
export type Favorite = IpFavorite | TokenFavorite
