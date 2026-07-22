import { formatPayoutCountdownDisplay, formatTopEarnerPostCount, formatTopEarnerUSD } from "./ugc-display"

describe("UGC display helpers", () => {
  describe("formatTopEarnerUSD", () => {
    it("shows cents for non-zero values below one dollar", () => {
      expect(formatTopEarnerUSD(0.0838155761712647)).toBe("0.08")
    })

    it("keeps compact formatting for values at one dollar and above", () => {
      expect(formatTopEarnerUSD(2.7373919574988497)).toBe("2.7")
      expect(formatTopEarnerUSD(6000)).toBe("6.0K")
    })
  })

  describe("formatTopEarnerPostCount", () => {
    it("shows post counts for any ranked earner with posts", () => {
      expect(formatTopEarnerPostCount(2)).toBe("2 posts")
      expect(formatTopEarnerPostCount(1)).toBe("1 post")
    })

    it("hides zero or missing post counts", () => {
      expect(formatTopEarnerPostCount(0)).toBeNull()
      expect(formatTopEarnerPostCount(undefined)).toBeNull()
    })
  })

  describe("formatPayoutCountdownDisplay", () => {
    it("shows late state for a missed unpaid payout window", () => {
      expect(formatPayoutCountdownDisplay("2d 4h", true)).toEqual({
        label: "Payout",
        value: "Late",
      })
    })

    it("keeps countdown state for normal payout windows", () => {
      expect(formatPayoutCountdownDisplay("2d 4h", false)).toEqual({
        label: "Payout in",
        value: "2d 4h",
      })
    })
  })
})
