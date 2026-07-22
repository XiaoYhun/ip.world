import {
  extractHandle,
  formatDaysAgo,
  formatTimeAgo,
  formatTimeAgoShort,
  isWalletAddress,
  pluralize,
  stripLeadingSlash,
  truncateAddress,
  truncateUsername,
  validateUrl,
  validateUsername,
} from "./strings"

describe("stripLeadingSlash", () => {
  it("removes a single leading slash", () => {
    expect(stripLeadingSlash("/foo")).toBe("foo")
    expect(stripLeadingSlash("foo")).toBe("foo")
  })
})

describe("extractHandle", () => {
  it("extracts a handle from full and bare URLs", () => {
    expect(extractHandle("https://x.com/goku")).toBe("goku")
    expect(extractHandle("x.com/goku")).toBe("goku")
    expect(extractHandle("https://x.com/goku/")).toBe("goku")
  })

  it("strips a leading @ and passes through bare handles", () => {
    expect(extractHandle("@goku")).toBe("goku")
    expect(extractHandle("goku")).toBe("goku")
  })
})

describe("truncateAddress", () => {
  it("keeps the configured head and tail around an ellipsis", () => {
    expect(truncateAddress("0x1234567890abcdef")).toBe("0x1234...cdef")
    expect(truncateAddress("0x1234567890abcdef", 4, 2)).toBe("0x12...ef")
  })
})

describe("pluralize", () => {
  it("uses the plural only when value is greater than one", () => {
    expect(pluralize(1, "cat")).toBe("cat")
    expect(pluralize(0, "cat")).toBe("cat")
    expect(pluralize(2, "cat")).toBe("cats")
    expect(pluralize(3, "box", "boxes")).toBe("boxes")
  })
})

describe("isWalletAddress", () => {
  it("accepts 0x + 40 hex chars and rejects everything else", () => {
    expect(isWalletAddress("0x" + "a".repeat(40))).toBe(true)
    expect(isWalletAddress("0x" + "a".repeat(39))).toBe(false)
    expect(isWalletAddress("not-an-address")).toBe(false)
  })
})

describe("truncateUsername", () => {
  it("prefixes @ and truncates past the max length", () => {
    expect(truncateUsername("alice")).toBe("@alice")
    expect(truncateUsername("a".repeat(20), 15)).toBe("@" + "a".repeat(15) + "...")
  })
})

describe("validateUsername", () => {
  it("accepts empty input and valid X/TikTok profile URLs", () => {
    expect(validateUsername("")).toBe(true)
    expect(validateUsername("https://x.com/goku")).toBe(true)
    expect(validateUsername("https://tiktok.com/@goku")).toBe(true)
  })

  it("returns an error message for non-profile input", () => {
    expect(typeof validateUsername("just text")).toBe("string")
  })
})

describe("validateUrl", () => {
  it("accepts domain-like strings", () => {
    expect(validateUrl("https://example.com")).toBe(true)
    expect(validateUrl("example.com")).toBe(true)
  })

  it("rejects input with spaces", () => {
    expect(typeof validateUrl("not a url")).toBe("string")
  })
})

describe("relative-time formatters", () => {
  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"))
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  it("formatTimeAgo composes weeks/days/hours/minutes", () => {
    expect(formatTimeAgo("2026-01-01T10:00:00.000Z")).toBe("2h")
    expect(formatTimeAgo("2026-01-01T10:30:00.000Z")).toBe("1h 30m")
  })

  it("formatTimeAgoShort returns only the largest unit", () => {
    expect(formatTimeAgoShort("2026-01-01T10:30:00.000Z")).toBe("1h")
  })

  it("formatDaysAgo returns whole days", () => {
    expect(formatDaysAgo("2025-12-30T12:00:00.000Z")).toBe("2d")
  })
})
