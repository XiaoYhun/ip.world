import { composeSafeSocialUrl, safeExternalHref, safeImageSrc } from "./safe-url"

describe("safe-url", () => {
  it("allows only https and mailto external hrefs", () => {
    expect(safeExternalHref("https://example.com/path")).toBe("https://example.com/path")
    expect(safeExternalHref("http://example.com/path")).toBe("https://example.com/path")
    expect(safeExternalHref("mailto:test@example.com")).toBe("mailto:test@example.com")
    expect(safeExternalHref("javascript:alert(1)")).toBeUndefined()
    expect(safeExternalHref("data:text/html,<script>alert(1)</script>")).toBeUndefined()
  })

  it("allows local and https images only", () => {
    expect(safeImageSrc("/svg/placeholder.svg")).toBe("/svg/placeholder.svg")
    expect(safeImageSrc("https://cdn.ip.world/remix.png")).toBe("https://cdn.ip.world/remix.png")
    expect(safeImageSrc("javascript:alert(1)")).toBe("/svg/placeholder.svg")
    expect(safeImageSrc("data:text/html,<script>alert(1)</script>")).toBe("/svg/placeholder.svg")
  })

  it("composes social handles without preserving unsafe full URLs", () => {
    expect(composeSafeSocialUrl("twitter", "alice")).toBe("https://x.com/alice")
    expect(composeSafeSocialUrl("twitter", "@alice")).toBe("https://x.com/alice")
    expect(composeSafeSocialUrl("twitter", "x.com/alice")).toBe("https://x.com/alice")
    expect(composeSafeSocialUrl("twitter", "twitter.com/alice")).toBe("https://twitter.com/alice")
    expect(composeSafeSocialUrl("twitter", "http://twitter.com/alice")).toBe("https://twitter.com/alice")
    expect(composeSafeSocialUrl("tiktok", "tiktok.com/@creator")).toBe("https://tiktok.com/@creator")
    expect(composeSafeSocialUrl("telegram", "t.me/ipworld")).toBe("https://t.me/ipworld")
    expect(composeSafeSocialUrl("website", "example.com")).toBe("https://example.com/")
    expect(composeSafeSocialUrl("website", "http://example.com")).toBe("https://example.com/")
    expect(composeSafeSocialUrl("website", "javascript:alert(1)")).toBeUndefined()
  })
})
