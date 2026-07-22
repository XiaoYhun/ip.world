import { buildHomepageRemixesQuery } from "./homepage-remixes-query"

describe("buildHomepageRemixesQuery", () => {
  it("defaults homepage remixes to trending_score_24h desc", () => {
    const params = buildHomepageRemixesQuery()

    expect(params.toString()).toBe("sort_by=trending_score_24h&sort_order=desc&limit=20")
  })
})
