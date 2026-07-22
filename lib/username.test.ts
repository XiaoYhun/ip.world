import {
  getUsernameValidationError,
  isUsernameValid,
  normalizeUsernameInput,
  sanitizeUsernameInput,
} from "./username"

describe("username helpers", () => {
  it("trims outer whitespace for comparison", () => {
    expect(normalizeUsernameInput("  Cosmic-Lemon.Crest  ")).toBe("Cosmic-Lemon.Crest")
  })

  it("accepts backend-aligned usernames", () => {
    expect(isUsernameValid("Cosmic-Lemon.Crest")).toBe(true)
    expect(isUsernameValid("Red_Dog")).toBe(true)
    expect(isUsernameValid("1Cosmic")).toBe(true)
    expect(isUsernameValid("_ghost")).toBe(true)
    expect(isUsernameValid(".dotstart")).toBe(true)
  })

  it("rejects usernames shorter than the minimum", () => {
    expect(isUsernameValid("..")).toBe(false)
    expect(getUsernameValidationError("..")).toContain("3-30")
  })

  it("rejects spaces and unsupported punctuation", () => {
    expect(isUsernameValid("Cosmic Lemon")).toBe(false)
    expect(getUsernameValidationError("Cosmic Lemon")).toContain("letters, numbers, dots, hyphens, or underscores")
  })

  it("sanitizes input to the allowed visible characters", () => {
    expect(sanitizeUsernameInput(" Cosmic Lemon!?-._ ")).toBe("CosmicLemon-._")
  })
})
