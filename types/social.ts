import { ProviderEnum } from "@dynamic-labs/types"

export const socialProviderMap = {
  twitter: ProviderEnum.Twitter,
  tiktok: ProviderEnum.Tiktok,
} as const

export type SocialAccountType = keyof typeof socialProviderMap
