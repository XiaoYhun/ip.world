import {
  detectSocialMediaType,
  extractTikTokUsername,
  extractTwitterUsername,
  isValidOwnerLink,
} from "./username-extractors"

describe("extractTwitterUsername", () => {
  it("pulls the handle out of x.com / twitter.com URLs", () => {
    expect(extractTwitterUsername("https://x.com/@jack")).toBe("jack")
    expect(extractTwitterUsername("https://twitter.com/jack")).toBe("jack")
    expect(extractTwitterUsername("https://x.com/jack?ref=1")).toBe("jack")
  })

  it("accepts bare handles with or without @", () => {
    expect(extractTwitterUsername("@jack")).toBe("jack")
    expect(extractTwitterUsername("jack")).toBe("jack")
  })

  it("returns empty string for empty input", () => {
    expect(extractTwitterUsername("")).toBe("")
  })
})

describe("extractTikTokUsername", () => {
  it("pulls the handle out of a tiktok URL", () => {
    expect(extractTikTokUsername("https://www.tiktok.com/@charlidamelio")).toBe("charlidamelio")
  })

  it("accepts dotted handles", () => {
    expect(extractTikTokUsername("@user.name")).toBe("user.name")
  })
})

describe("detectSocialMediaType", () => {
  it("classifies known platform URLs", () => {
    expect(detectSocialMediaType("https://x.com/jack")).toBe("twitter")
    expect(detectSocialMediaType("https://www.tiktok.com/@user")).toBe("tiktok")
    expect(detectSocialMediaType("https://instagram.com/user")).toBe("instagram")
    expect(detectSocialMediaType("https://youtube.com/@chan")).toBe("youtube")
    expect(detectSocialMediaType("https://facebook.com/page")).toBe("facebook")
  })

  it("returns null for non-profile text", () => {
    expect(detectSocialMediaType("just some text")).toBeNull()
    expect(detectSocialMediaType("")).toBeNull()
  })
})

describe("isValidOwnerLink", () => {
  it("treats empty input as valid (optional field)", () => {
    expect(isValidOwnerLink("")).toBe(true)
    expect(isValidOwnerLink("   ")).toBe(true)
  })

  it("accepts valid profile links", () => {
    expect(isValidOwnerLink("https://x.com/jack")).toBe(true)
  })

  it("returns an error message for invalid links", () => {
    expect(typeof isValidOwnerLink("not a url")).toBe("string")
  })
})
