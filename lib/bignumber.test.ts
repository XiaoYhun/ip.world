import { bigNumberToFloat, floatToBigNumber, formatBigNumber } from "./bignumber"

describe("bigNumberToFloat", () => {
  it("shifts raw integer amounts down by the given decimals", () => {
    expect(bigNumberToFloat(1000000n, 6)).toBe(1)
    expect(bigNumberToFloat("1500000", 6)).toBe(1.5)
    expect(bigNumberToFloat(123456789n, 8)).toBe(1.23456789)
  })

  it("treats a zero/empty value as 0", () => {
    expect(bigNumberToFloat(0n, 6)).toBe(0)
  })

  it("handles 18-decimal (wei-scale) values", () => {
    expect(bigNumberToFloat("1000000000000000000", 18)).toBe(1)
    expect(bigNumberToFloat("2500000000000000000", 18)).toBe(2.5)
  })
})

describe("floatToBigNumber", () => {
  it("scales a float up by the given decimals", () => {
    expect(floatToBigNumber(1.5, 6).toString()).toBe("1500000")
    expect(floatToBigNumber("2", 18).toString()).toBe("2000000000000000000")
  })
})

describe("formatBigNumber", () => {
  it("keeps short decimals as-is", () => {
    expect(formatBigNumber("1500000", 6)).toBe("1.5")
    expect(formatBigNumber(1000000n, 6)).toBe("1")
  })

  it("truncates to 3 decimals without rounding up", () => {
    expect(formatBigNumber("1234567", 6)).toBe("1.234")
  })
})
