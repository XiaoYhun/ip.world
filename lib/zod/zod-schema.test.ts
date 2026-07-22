import { ip_schema, token_schema } from "./zod-schema"

const validIp = {
  name: "My IP",
  image: "https://cdn.ip.world/image.png",
  description: "A description",
  twitter: "https://x.com/myip",
}

describe("ip_schema", () => {
  it("accepts a valid IP with at least one social link", () => {
    expect(ip_schema.safeParse(validIp).success).toBe(true)
  })

  it("requires at least one social link or website", () => {
    const result = ip_schema.safeParse({ ...validIp, twitter: undefined })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("social"))).toBe(true)
    }
  })

  it("rejects a non-URL image", () => {
    const result = ip_schema.safeParse({ ...validIp, image: "not-a-url" })
    expect(result.success).toBe(false)
  })

  it("rejects an empty name", () => {
    const result = ip_schema.safeParse({ ...validIp, name: "  " })
    expect(result.success).toBe(false)
  })
})

const validToken = {
  name: "My Token",
  symbol: "MTK",
  description: "A token",
  image: "https://cdn.ip.world/token.png",
  allocation: 10,
}

describe("token_schema", () => {
  it("accepts a valid token within the allocation bounds", () => {
    expect(token_schema.safeParse(validToken).success).toBe(true)
  })

  it("rejects an allocation below 3%", () => {
    expect(token_schema.safeParse({ ...validToken, allocation: 2 }).success).toBe(false)
  })

  it("rejects an allocation above 15%", () => {
    expect(token_schema.safeParse({ ...validToken, allocation: 16 }).success).toBe(false)
  })

  it("accepts the allocation boundaries (3 and 15)", () => {
    expect(token_schema.safeParse({ ...validToken, allocation: 3 }).success).toBe(true)
    expect(token_schema.safeParse({ ...validToken, allocation: 15 }).success).toBe(true)
  })
})
