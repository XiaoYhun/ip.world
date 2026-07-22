import { tiktokTagSlug, truncateTagForDisplay } from "./tiktok-tag"

describe("tiktokTagSlug", () => {
  it("returns an empty string for blank input", () => {
    expect(tiktokTagSlug("")).toBe("")
    expect(tiktokTagSlug("   ")).toBe("")
  })

  it("lowercases a single word and strips non-alphanumerics", () => {
    expect(tiktokTagSlug("Hello")).toBe("hello")
    expect(tiktokTagSlug("hello-world")).toBe("helloworld")
  })

  it("PascalCases multi-word names", () => {
    expect(tiktokTagSlug("hello world")).toBe("HelloWorld")
    expect(tiktokTagSlug("  multi  word  name ")).toBe("MultiWordName")
  })
})

describe("truncateTagForDisplay", () => {
  it("leaves short tags untouched", () => {
    expect(truncateTagForDisplay("short")).toBe("short")
  })

  it("truncates long tags with a tail ellipsis", () => {
    expect(truncateTagForDisplay("AbcdefghijklmnopqrstuvwxyzABC")).toBe("Abcdefghijklmnopqrs…")
  })

  it("preserves a trailing シ after the ellipsis", () => {
    expect(truncateTagForDisplay("HelloWorldThisIsLongシ")).toBe("HelloWorldThisIsLo…シ")
  })
})
