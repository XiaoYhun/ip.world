vi.mock("@/config", () => ({
  env: {
    NEXT_PUBLIC_API_BASE_URL: "https://dev-api.ip.world/api/v1",
  },
}))

vi.mock("@/lib/constants", () => ({
  HIDDEN_TRENDING_REMIXES: [],
}))

import { fetchRemixesClient } from "./client-actions"

describe("fetchRemixesClient", () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [],
        total: 0,
        limit: 12,
        offset: 20,
      }),
    })
    global.fetch = fetchMock as unknown as typeof fetch
  })

  it("uses the Next.js proxy for browser-side remix pagination", async () => {
    await fetchRemixesClient({
      query: "",
      sort: "trending_score_24h",
      sort_order: "desc",
      limit: 12,
      offset: 20,
      licensed: false,
      community: false,
      verified: false,
      socials: false,
      claimed: false,
      category: "",
    })

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/proxy/remixes?sort_by=trending_score_24h&sort_order=desc&category=&limit=12&offset=20"
    )
  })

  it("passes hide_spam=false when spam is visible", async () => {
    await fetchRemixesClient({
      query: "",
      sort: "trending_score_24h",
      sort_order: "desc",
      limit: 12,
      offset: 20,
      licensed: false,
      community: false,
      verified: false,
      socials: false,
      claimed: false,
      category: "",
      hide_spam: false,
    })

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/proxy/remixes?sort_by=trending_score_24h&sort_order=desc&category=&hide_spam=false&limit=12&offset=20"
    )
  })
})
