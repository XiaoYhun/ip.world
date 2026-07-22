export interface CheckUsernameRequest {
  username: string
}

export interface CheckUsernameResponse {
  exists: boolean
}

export interface CheckUsernameVerificationStatus {
  has_verification: boolean
  verification?: CheckUsernameResponse
  can_retry: boolean
}
