import dayjs from "dayjs"
import duration from 'dayjs/plugin/duration'
import {
  INSTAGRAM_USERNAME_REGEX,
  TELEGRAM_USERNAME_REGEX,
  TIKTOK_USERNAME_REGEX,
  URL_REGEX,
  X_USERNAME_REGEX,
  YOUTUBE_USERNAME_REGEX,
} from "./constants"

dayjs.extend(duration)

export const stripLeadingSlash = (str: string) => {
  return str.startsWith("/") ? str.slice(1) : str
}

/**
 * Extract a social handle from a value that might be a full URL.
 * e.g. "https://x.com/goku" → "goku", "x.com/goku" → "goku", "@goku" → "goku", "goku" → "goku"
 */
export function extractHandle(account: string): string {
  let handle = account.trim()
  try {
    const url = new URL(handle.startsWith("http") ? handle : `https://${handle}`)
    const path = url.pathname.replace(/^\//, "").replace(/\/$/, "")
    if (path) handle = path
  } catch {
    // not a URL, use as-is
  }
  return handle.startsWith("@") ? handle.slice(1) : handle
}

export const truncateAddress = (address: string, left = 6, right = 4) => {
  return `${address.slice(0, left)}...${address.slice(-right)}`
}

export const pluralize = (value: number, singular: string, plural?: string) => {
  plural = plural || `${singular}s`
  return value > 1 ? plural : singular
}

export const formatDate = (date: string, format: string = "h:mmA MM/DD/YY") => {
  return dayjs(date).format(format)
}

export const isWalletAddress = (str: string): boolean => {
  // Check if string is an Ethereum wallet address (0x + 40 hex chars)
  return /^0x[a-fA-F0-9]{40}$/.test(str)
}

export const truncateUsername = (username: string, maxLength: number = 15) => {
  if (username.length <= maxLength) {
    return `@${username}`
  }
  return `@${username.slice(0, maxLength)}...`
}

export const isXUsername = (username: string) => X_USERNAME_REGEX.test(username)

export const isTikTokUsername = (username: string) => TIKTOK_USERNAME_REGEX.test(username)

export const isInstagramUsername = (username: string) => INSTAGRAM_USERNAME_REGEX.test(username)

export const isTelegramUsername = (username: string) => TELEGRAM_USERNAME_REGEX.test(username)

export const isYoutubeUsername = (username: string) => YOUTUBE_USERNAME_REGEX.test(username)

export const validateUsername = (url: string): true | string => {
  if (!url) return true
  if (isXUsername(url)) return true
  if (isTikTokUsername(url)) return true
  return "Enter a valid X (Twitter) or TikTok profile URL"
}

export const validateUrl = (url: string): true | string => (URL_REGEX.test(url) ? true : "Enter a valid URL")

export function formatTimeAgo(dateString: string): string {
  const now = dayjs()
  const then = dayjs(dateString)
  const diff = dayjs.duration(now.diff(then))

  const weeks = Math.floor(diff.asWeeks())
  const days = Math.floor(diff.asDays()) % 7
  const hours = diff.hours()
  const minutes = diff.minutes()
  const seconds = diff.seconds()

  const parts: string[] = []

  if (weeks > 0) parts.push(`${weeks}w`)
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)

  // Only show seconds if under 1 minute
  if (parts.length === 0) parts.push(`${seconds}s`)

  return parts.join(" ")
}

export function formatTimeAgoShort(dateString: string): string {
  const now = dayjs()
  const then = dayjs(dateString)
  const diff = dayjs.duration(now.diff(then))

  const weeks = Math.floor(diff.asWeeks())
  if (weeks > 0) return `${weeks}w`

  const days = Math.floor(diff.asDays())
  if (days > 0) return `${days}d`

  const hours = diff.hours()
  if (hours > 0) return `${hours}h`

  const minutes = diff.minutes()
  if (minutes > 0) return `${minutes}m`

  const seconds = diff.seconds()
  return `${seconds}s`
}

export function formatDaysAgo(dateString: string): string {
  const now = dayjs()
  const then = dayjs(dateString)
  const daysAgo = Math.floor(now.diff(then, "days"))

  return `${daysAgo}d`
}

export const formatDateTiktok = (date: string) => {
  return dayjs(date).format("ddd MMM D, h:mm A")
}
