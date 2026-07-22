/**
 * Normalizes a raw name into a single TikTok hashtag body (no ASCII spaces).
 * Multi-word names use PascalCase (each word title-cased, then concatenated), e.g. "hello world" → "HelloWorld".
 * Single-word names stay all lowercase.
 */
function titleCaseSegment(word: string): string {
  const lower = word.toLowerCase().replace(/[^a-z0-9]/g, "")
  if (!lower) return ""
  return lower[0].toUpperCase() + lower.slice(1)
}

export function tiktokTagSlug(raw: string): string {
  const words = raw.trim().split(/\s+/).filter((w) => w.length > 0)
  if (words.length === 0) return ""
  if (words.length === 1) return words[0].toLowerCase().replace(/[^a-z0-9]/g, "")
  return words.map(titleCaseSegment).join("")
}

const DEFAULT_TAG_DISPLAY_MAX = 20

/**
 * Shortens a tag for narrow UI (prefix + "…", optional trailing シ preserved).
 * Uses tail ellipsis only so we never splice mid-word (middle truncation did e.g. `#Chines…randmaシ`).
 * Full string: title="" and clipboard.
 */
export function truncateTagForDisplay(tag: string, maxLen = DEFAULT_TAG_DISPLAY_MAX): string {
  if (tag.length <= maxLen) return tag

  const hasShi = tag.endsWith("シ")
  const base = hasShi ? tag.slice(0, -1) : tag
  const suffix = hasShi ? "シ" : ""

  const headBudget = maxLen - 1 - suffix.length
  if (headBudget < 2) {
    return `${tag.slice(0, Math.max(1, maxLen - 1))}…`
  }

  return `${base.slice(0, headBudget)}…${suffix}`
}
