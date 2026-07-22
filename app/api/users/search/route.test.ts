/**
 * @vitest-environment node
 */

import { NextRequest } from "next/server"
import { GET } from "./route"

vi.mock("@/config", () => ({
  env: {
    NEXT_PUBLIC_API_BASE_URL: "https://prod.api.ip.world/api/v1",
  },
}))

describe("GET /api/users/search", () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    global.fetch = fetchMock as unknown as typeof fetch
  })

  it("rejects control characters before proxying to leaderboard", async () => {
    const response = await GET(new NextRequest("https://ip.world/api/users/search?q=%00"))

    expect(response.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toEqual({ error: "invalid search query" })
  })

  it("does not relay upstream service error bodies", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        message: "failed to get leaderboard",
        trace_id: "trace",
        request_id: "request",
      }),
    } as Response)

    const response = await GET(new NextRequest("https://ip.world/api/users/search?q=alice"))

    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toEqual({ results: [], total: 0 })
  })
})
