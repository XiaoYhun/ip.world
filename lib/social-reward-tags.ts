import { tiktokTagSlug } from "./tiktok-tag"

const SHI_SUFFIX = "\u30b7"

export interface TokenSocialTagInput {
  tokenName?: string | null
  tokenSymbol?: string | null
  ipName?: string | null
  category?: string | null
}

function cleanXSymbol(raw?: string | null): string {
  return (raw ?? "").trim().replace(/^[#$]+/, "").replace(/[^a-z0-9]/gi, "").toUpperCase()
}

function addTikTokFirstCreateTags(tags: string[], seen: Set<string>, raw?: string | null) {
  const slug = tiktokTagSlug(raw ?? "")
  if (!slug) return

  for (const tag of [`#${slug}`, `#${slug}${SHI_SUFFIX}`]) {
    if (seen.has(tag)) continue
    seen.add(tag)
    tags.push(tag)
  }
}

export function buildTokenSocialRewardTags(input: TokenSocialTagInput) {
  const tiktokSlug = tiktokTagSlug(input.tokenName || input.ipName || "token")
  const symbol = cleanXSymbol(input.tokenSymbol)

  return {
    tiktokTag: `#${tiktokSlug}${SHI_SUFFIX}`,
    xTag: symbol ? `$${symbol}` : "",
  }
}

export function buildFeedIndexingTagPool(input: TokenSocialTagInput): string[] {
  const tags: string[] = []
  const seen = new Set<string>()

  addTikTokFirstCreateTags(tags, seen, input.ipName)
  addTikTokFirstCreateTags(tags, seen, input.tokenName)

  const symbol = cleanXSymbol(input.tokenSymbol)
  if (symbol) tags.push(`$${symbol}`)

  return tags
}
