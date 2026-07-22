export type Vote = {
  is_valid: boolean
  user_address: string
  metadata: {
    reason: string
    suggested_social_media: string
    metadata: Record<string, object>
  }
}
