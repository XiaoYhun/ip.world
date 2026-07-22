import {
  ABOUT_TO_GRADUATE_CANDIDATE_POOL,
  buildAboutToGraduateQuery,
  buildTrendingTiktokQuery,
  buildTrendingTokensQuery,
  pickTopAboutToGraduateRemixes,
} from "./homepage-shelf-queries"
import type { Remix } from "@/types/remix"

describe("homepage shelf queries", () => {
  it("requests trending coins by selected timeframe", () => {
    expect(buildTrendingTokensQuery("6h").toString()).toBe(
      "sort_by=trending_score_6h&sort_order=desc&limit=10&offset=0"
    )
  })

  it("requests recent non-graduated tokens as candidates for about-to-graduate shelf", () => {
    expect(buildAboutToGraduateQuery().toString()).toBe(
      `is_graduated=false&sort_by=token_created_at&sort_order=desc&limit=${ABOUT_TO_GRADUATE_CANDIDATE_POOL}&offset=0`
    )
  })

  it("picks top graduation progress from recent candidate pool", () => {
    const remix = (id: string, graduation_progress: number, daily_volume = 0): Remix =>
      ({
        id,
        graduation_progress,
        daily_volume,
        token_created_at: "2026-01-01T00:00:00.000Z",
        created_at: "2026-01-01T00:00:00.000Z",
      }) as Remix

    expect(pickTopAboutToGraduateRemixes([remix("a", 10), remix("b", 90), remix("c", 50)]).map((r) => r.id)).toEqual([
      "b",
      "c",
      "a",
    ])
  })

  it("requests TikTok tokens by daily volume", () => {
    expect(buildTrendingTiktokQuery().toString()).toBe(
      "is_tiktok=true&sort_by=daily_volume&sort_order=desc&limit=10&offset=0"
    )
  })
})
