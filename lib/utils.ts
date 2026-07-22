import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { SocialLink } from "@/app/(dApp)/create/_components/SocialLinks"
import { env } from "@/config"
import { Ip } from "@/types/ip"
import { CATEGORIES } from "./constants"
import { SOCIAL_TYPE } from "@/components/socials"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getServerApiUrl() {
  const protocol = env.NEXT_PUBLIC_ENVIRONMENT === "development" ? "http://" : "https://"

  return typeof window !== `undefined`
    ? new URL(`/api`, window?.location.origin).href
    : `${protocol}${env.NEXT_PUBLIC_VERCEL_URL}/api`
}

/** Do not use this function on server side as it purpose is to proxy requests to the API to bypass CORS issues or to protect some sensitive API endpoints */
export function getAPIRootUrl() {
  if (typeof window !== "undefined") {
    return "/api/proxy"
  }
  return `${env.NEXT_PUBLIC_API_BASE_URL}`
}

export function generateMetadataFromIp(ip: Ip) {
  return [
    `${env.NEXT_PUBLIC_API_BASE_URL}/ipas/${ip.id}/metadata`, //ipaMetadataUri
    ip.ipa_hash, //ipaMetadataHash
    `${env.NEXT_PUBLIC_API_BASE_URL}/ipas/${ip.id}/nft/metadata`, //nftMetadataUri
    ip.ipa_hash, //nftMetadataHash
  ]
}

export const isCreator = (ip: Partial<Ip>) => {
  return ip.type === "creator"
}

export const isVerified = (ip: Ip) => {
  return ip.is_verified === true
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getErrorClassName = (error: any) =>
  cn("border transition-all duration-300", Boolean(error) && " border-red-500! border-solid!")

export const parseSocials = (socials: SocialLink[]) => {
  const result: Record<string, string> = {}

  socials.forEach((social) => {
    if (social.type === "twitter") {
      result.twitter = social.url
    } else if (social.type === "tiktok") {
      result.tiktok = social.url
    } else if (social.type === "website") {
      result.website = social.url
    }
  })

  return result
}

export const getCategory = (category: string) => {
  return CATEGORIES.find((c) => c.key === category)?.label ?? ""
}

export const getSearchShortcut = () => {
  if (typeof window === "undefined") {
    return "⌘K"
  }

  const userAgent = window.navigator.userAgent.toLowerCase()

  if ("userAgentData" in window.navigator) {
    const userAgentData = (window.navigator as Navigator & { userAgentData: { platform: string } }).userAgentData
    const platform = userAgentData.platform.toLowerCase()
    if (platform === "macos") {
      return "⌘K"
    }
    if (platform === "windows" || platform === "linux") {
      return "Ctrl+K"
    }
  }

  if (userAgent.includes("mac")) {
    return "⌘K"
  }
  if (userAgent.includes("windows") || userAgent.includes("linux")) {
    return "Ctrl+K"
  }

  return "⌘K"
}

/**
 * Removes duplicates from an array based on a key function.
 * @param {Array} arr - The input array.
 * @param {Function} keyFn - A function that returns the value used for uniqueness.
 * @returns {Array} A new array with unique items.
 */
export function uniqueBy<T>(arr: T[], keyFn: (item: T) => T[keyof T]) {
  const seen = new Set()
  return arr.filter((item) => {
    const key = keyFn(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function getSocialUrl(type: SOCIAL_TYPE, account: string) {
  const username = account.startsWith("@") ? account.slice(1) : account
  switch (type) {
    case SOCIAL_TYPE.TWITTER:
      return `https://twitter.com/${username}`
    case SOCIAL_TYPE.INSTAGRAM:
      return `https://instagram.com/${username}`
    case SOCIAL_TYPE.TIKTOK:
      return `https://tiktok.com/@${username}`
    default:
      return null
  }
}
