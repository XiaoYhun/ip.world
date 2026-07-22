export interface TikTokVerificationRequest {
  tiktok_username: string
}

export interface TikTokVerificationResponse {
  id: string
  username: string
  tiktok_username: string
  code: string
  verified: string // 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

export interface TikTokVerificationStatus {
  has_verification: boolean
  verification?: TikTokVerificationResponse
  can_retry: boolean
}
