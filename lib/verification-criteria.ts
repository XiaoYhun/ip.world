/**
 * Verification eligibility criteria per IP category.
 * Used in both the Create page category selector and the Verification flow.
 */
export const VERIFICATION_CRITERIA: Record<string, string[]> = {
  pet: [
    "Demonstrates public attention through social media or community interest",
    "Clear attribution to a known real pet subject or fictional identity",
    "Maintains a consistent and recognizable cultural identity over time",
  ],
  person: [
    "Public individual with a notable or emerging online presence",
    "Identity and presence are clearly verifiable through public platforms",
    "Cultural relevance, influence, or recognition beyond a private audience",
  ],
  trend: [
    "Internet phenomenon with viral momentum or community-driven traction",
    "Clear cultural origin or early point of emergence that can be identified",
    "Sustained relevance beyond a single post or short-lived attention spike",
  ],
  game: [
    "Publicly available game, demo, or playable build",
    "Strong player adoption, active community, or sustained engagement",
    "Clear signs of ongoing development, updates, or support",
  ],
  technology: [
    "Clearly defined product, tool, or technical system",
    "Demonstrable real-world functionality (live product, demo, or active usage)",
    "Visible adoption, discussion, or relevance within its ecosystem",
  ],
  meme: [
    "Recognizable meme image, video, phrase, or concept",
    "Demonstrated viral spread or strong community-driven adoption",
    "Ongoing public reuse, reposts, or community-made variations",
  ],
  movement: [
    "Clearly articulated cause, idea, or collective identity",
    "Active participation from a visible community or audience",
    "Observable social, cultural, or internet-level impact",
  ],
  brand: [
    "Active brand, company, or collective with real products or services",
    "Consistent brand presence across public channels or community spaces",
    "Clear market traction through customers, users, or community adoption",
  ],
  character: [
    "Original character with a documented creation or origin story",
    "Presence in published media, recurring content, or active community usage",
    "Distinct visual, narrative, or personality identity with audience recognition",
  ],
  art: [
    "Original artwork or creative piece with a distinct visual or conceptual identity",
    "Clearly documented creation history and provenance",
    "Public release, exhibition, or meaningful audience engagement",
  ],
  misc: [
    "Clearly defined and describable intellectual property",
    "Verifiable proof establishing property origin or authorship",
    "Evidence of public visibility, recognition, or active community engagement",
  ],
}

/**
 * Normalize a raw IP category (e.g. "Mainstream_trend") to the base key
 * used by VERIFICATION_CRITERIA / CATEGORIES (e.g. "trend").
 */
export function normalizeCategoryKey(raw?: string): string {
  if (!raw) return "misc"
  const lower = raw.toLowerCase()
  if (VERIFICATION_CRITERIA[lower]) return lower
  const parts = lower.split("_")
  for (let i = parts.length - 1; i >= 0; i--) {
    if (VERIFICATION_CRITERIA[parts[i]]) return parts[i]
  }
  return lower
}
