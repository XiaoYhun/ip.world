// Helper functions to extract usernames from social media URLs or handles

const TWITTER_PROFILE_REGEX =
  /^(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/@?([A-Za-z0-9_]{1,15})(?:\/)?(?:\?.*)?$/i
const TIKTOK_PROFILE_REGEX =
  /^(?:https?:\/\/)?(?:www\.|m\.)?tiktok\.com\/@([A-Za-z0-9._]{2,24})(?:\/)?(?:\?.*)?$/i
const FACEBOOK_PROFILE_REGEX =
  /^(?:https?:\/\/)?(?:www\.)?(?:facebook\.com|fb\.com)\/[A-Za-z0-9\.]+(?:\/)?(?:\?.*)?$/i
const INSTAGRAM_PROFILE_REGEX =
  /^(?:https?:\/\/)?(?:www\.)?instagram\.com\/[A-Za-z0-9._]+(?:\/)?(?:\?.*)?$/i
const YOUTUBE_PROFILE_REGEX =
  /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:c\/|channel\/|@)?[A-Za-z0-9_\-]+|youtu\.be\/[A-Za-z0-9_\-]+)(?:\/)?(?:\?.*)?$/i
const TWITTER_HANDLE_REGEX = /^@?([A-Za-z0-9_]{1,15})$/
const TIKTOK_HANDLE_REGEX = /^@?([A-Za-z0-9._]{2,24})$/

export const extractTwitterUsername = (input: string): string => {
  if (!input) return ""
  const value = input.trim()

  const twitterUrlMatch = value.match(TWITTER_PROFILE_REGEX)
  if (twitterUrlMatch?.[1]) {
    return twitterUrlMatch[1]
  }

  const twitterHandleMatch = value.match(TWITTER_HANDLE_REGEX)
  if (twitterHandleMatch?.[1]) {
    return twitterHandleMatch[1]
  }

  return value.startsWith("@") ? value.slice(1) : value
}

export const extractTikTokUsername = (input: string): string => {
  if (!input) return ""
  const value = input.trim()

  const tiktokUrlMatch = value.match(TIKTOK_PROFILE_REGEX)
  if (tiktokUrlMatch?.[1]) {
    return tiktokUrlMatch[1]
  }

  const tiktokHandleMatch = value.match(TIKTOK_HANDLE_REGEX)
  if (tiktokHandleMatch?.[1]) {
    return tiktokHandleMatch[1]
  }

  return value.startsWith("@") ? value.slice(1) : value
}

// Helper function to detect social media platform from creator profile links or handles
export const detectSocialMediaType = (input: string): string | null => {
  if (!input) return null
  const value = input.trim()

  if (TWITTER_PROFILE_REGEX.test(value)) {
    return "twitter"
  }

  if (TIKTOK_PROFILE_REGEX.test(value)) {
    return "tiktok"
  }

  if (FACEBOOK_PROFILE_REGEX.test(value)) {
    return "facebook"
  }

  if (INSTAGRAM_PROFILE_REGEX.test(value)) {
    return "instagram"
  }

  if (YOUTUBE_PROFILE_REGEX.test(value)) {
    return "youtube"
  }

  return null
}

export const isValidOwnerLink = (value: string): boolean | string => {
  if (!value || !value.trim()) return true

  const v = value.trim()
  if (
    TWITTER_PROFILE_REGEX.test(v) ||
    TIKTOK_PROFILE_REGEX.test(v) ||
    FACEBOOK_PROFILE_REGEX.test(v) ||
    INSTAGRAM_PROFILE_REGEX.test(v) ||
    YOUTUBE_PROFILE_REGEX.test(v)
  ) {
    return true
  }

  return "Must be a valid creator profile link from X (twitter.com/x.com), TikTok (tiktok.com/@handle), Instagram, Facebook, or YouTube"
}
