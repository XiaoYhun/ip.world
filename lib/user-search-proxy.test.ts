import { hasControlCharacter, isLeaderboardSearchPayload } from "./user-search-proxy"

describe("user search proxy helpers", () => {
  it("detects control characters in search input", () => {
    expect(hasControlCharacter("alice")).toBe(false)
    expect(hasControlCharacter("\u0000")).toBe(true)
    expect(hasControlCharacter("alice\u007fbob")).toBe(true)
  })

  it("accepts only leaderboard result payloads", () => {
    expect(isLeaderboardSearchPayload({ results: [], total: 0 })).toBe(true)
    expect(
      isLeaderboardSearchPayload({
        message: "failed to get leaderboard",
        trace_id: "trace",
        request_id: "request",
      })
    ).toBe(false)
  })
})
