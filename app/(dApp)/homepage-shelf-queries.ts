import type { Remix } from "@/types/remix"

export type TrendingTimeframeKey = "24h" | "6h" | "1h" | "5m"

export const TRENDING_SCORE_SORT_BY: Record<TrendingTimeframeKey, string> = {
  "24h": "trending_score_24h",
  "6h": "trending_score_6h",
  "1h": "trending_score_1h",
  "5m": "trending_score_5m",
}

export function buildTrendingTokensQuery(timeframe: TrendingTimeframeKey = "24h", limit = 10) {
  const params = new URLSearchParams()
  params.set("sort_by", TRENDING_SCORE_SORT_BY[timeframe])
  params.set("sort_order", "desc")
  params.set("limit", String(limit))
  params.set("offset", "0")
  return params
}

/** Non-graduated tokens fetched by recency before client re-rank by graduation progress. */
export const ABOUT_TO_GRADUATE_CANDIDATE_POOL = 100
export const ABOUT_TO_GRADUATE_DISPLAY_LIMIT = 5

export function buildAboutToGraduateQuery(candidatePool = ABOUT_TO_GRADUATE_CANDIDATE_POOL) {
  const params = new URLSearchParams()
  params.set("is_graduated", "false")
  params.set("sort_by", "token_created_at")
  params.set("sort_order", "desc")
  params.set("limit", String(candidatePool))
  params.set("offset", "0")
  return params
}

export function pickTopAboutToGraduateRemixes(
  remixes: Remix[],
  limit = ABOUT_TO_GRADUATE_DISPLAY_LIMIT
): Remix[] {
  return [...remixes]
    .sort((a, b) => {
      const progressDelta = (b.graduation_progress ?? 0) - (a.graduation_progress ?? 0)
      if (progressDelta !== 0) return progressDelta
      const volumeDelta = (b.daily_volume ?? 0) - (a.daily_volume ?? 0)
      if (volumeDelta !== 0) return volumeDelta
      return new Date(b.token_created_at || b.created_at).getTime() - new Date(a.token_created_at || a.created_at).getTime()
    })
    .slice(0, limit)
}

export function buildTrendingTiktokQuery(limit = 10) {
  const params = new URLSearchParams()
  params.set("is_tiktok", "true")
  params.set("sort_by", "daily_volume")
  params.set("sort_order", "desc")
  params.set("limit", String(limit))
  params.set("offset", "0")
  return params
}
