const PLACEHOLDER_IMAGE = "/svg/placeholder.svg"

export function safeExternalHref(value?: string | null): string | undefined {
  const trimmed = value?.trim()
  if (!trimmed) return undefined

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol === "mailto:") return parsed.toString()
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      parsed.protocol = "https:"
      return parsed.toString()
    }
    return undefined
  } catch {
    return undefined
  }
}

export function safeImageSrc(value?: string | null, fallback = PLACEHOLDER_IMAGE): string {
  const trimmed = value?.trim()
  if (!trimmed) return fallback
  if (trimmed.startsWith("/")) return trimmed

  try {
    const parsed = new URL(trimmed)
    return parsed.protocol === "https:" ? parsed.toString() : fallback
  } catch {
    return fallback
  }
}

export function composeSafeSocialUrl(kind: string, value?: string | null): string | undefined {
  const trimmed = value?.trim()
  if (!trimmed) return undefined

  const direct = safeExternalHref(urlLikeInput(trimmed))
  if (direct) return direct

  const handle = trimmed.replace(/^@/, "")
  switch (kind) {
    case "telegram":
      return safeExternalHref(`https://t.me/${handle}`)
    case "twitter":
      return safeExternalHref(`https://x.com/${handle}`)
    case "instagram":
      return safeExternalHref(`https://instagram.com/${handle}`)
    case "tiktok":
      return safeExternalHref(`https://tiktok.com/@${handle}`)
    case "youtube":
      return safeExternalHref(`https://www.youtube.com/${handle}`)
    case "website":
      return safeExternalHref(`https://${trimmed}`)
    default:
      return undefined
  }
}

function urlLikeInput(value: string): string {
  if (value.includes("://")) return value
  const firstPart = value.split("/")[0]
  return firstPart.includes(".") ? `https://${value}` : value
}
