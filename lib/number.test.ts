import {
  formatCompactUSD,
  formatNumber,
  formatNumberWithHTMLSuperscript,
  formatNumberWithSuffix,
  formatNumberWithSuperscriptZeros,
  formatTradingViewPriceLabel,
  formatUSD,
  formatUsdParts,
  roundUpNumber,
} from "./number"

describe("formatCompactUSD", () => {
  it("abbreviates large magnitudes", () => {
    expect(formatCompactUSD(1_500_000_000_000)).toBe("1.5T")
    expect(formatCompactUSD(2_500_000_000)).toBe("2.5B")
    expect(formatCompactUSD(3_400_000)).toBe("3.4M")
    expect(formatCompactUSD(1_500)).toBe("1K")
  })

  it("renders sub-thousand values as rounded integers", () => {
    expect(formatCompactUSD(999)).toBe("999")
    expect(formatCompactUSD(0)).toBe("0")
  })
})

describe("formatNumberWithSuffix", () => {
  it("uses one decimal place by default", () => {
    expect(formatNumberWithSuffix(1_500_000)).toBe("1.5M")
    expect(formatNumberWithSuffix(2_500)).toBe("2.5K")
  })

  it("falls back to plain formatting below 1K", () => {
    expect(formatNumberWithSuffix(999)).toBe("999")
  })
})

describe("formatNumber", () => {
  it("truncates (does not round) beyond the fixed decimals", () => {
    expect(formatNumber(1.23456, 2)).toBe("1.23")
  })

  it("keeps values with few decimals as-is", () => {
    expect(formatNumber(1.5, 2)).toBe("1.5")
  })

  it("adds thousands separators when comma is enabled", () => {
    expect(formatNumber(1234.5678, 2, true)).toBe("1,234.56")
    expect(formatNumber(1000, 2, true)).toBe("1,000")
  })
})

describe("roundUpNumber", () => {
  it("leaves integers unchanged", () => {
    expect(roundUpNumber(5)).toBe(5)
  })

  it("rounds floats to the given precision", () => {
    expect(roundUpNumber(5.26, 1)).toBe(5.3)
  })
})

describe("formatUSD", () => {
  it("formats standard currency amounts", () => {
    expect(formatUSD(1234.5)).toBe("$1,234.50")
  })

  it("returns the original input when it is not a number", () => {
    expect(formatUSD("abc")).toBe("abc")
  })
})

describe("formatUsdParts", () => {
  it("splits a positive amount into dollars and cents", () => {
    expect(formatUsdParts(1234.5)).toEqual({ dollars: "$1,234", cents: ".50" })
  })

  it("prefixes a minus sign for negatives", () => {
    expect(formatUsdParts(-5)).toEqual({ dollars: "-$5", cents: ".00" })
  })

  it("has no sign for zero", () => {
    expect(formatUsdParts(0)).toEqual({ dollars: "$0", cents: ".00" })
  })
})

describe("superscript-zero formatting", () => {
  it("collapses leading decimal zeros with a unicode superscript", () => {
    expect(formatNumberWithSuperscriptZeros(0.00021)).toBe("0.0²21")
  })

  it("wraps the zero run in <sup> tags for the HTML variant", () => {
    expect(formatNumberWithHTMLSuperscript(0.00021)).toBe("$0.0<sup>2</sup>21")
    expect(formatNumberWithHTMLSuperscript(0)).toBe("$0")
  })
})

describe("formatTradingViewPriceLabel", () => {
  it("renders placeholders for non-finite values", () => {
    expect(formatTradingViewPriceLabel(NaN)).toBe("—")
    expect(formatTradingViewPriceLabel(Infinity)).toBe("—")
  })

  it("renders exact zero as '0'", () => {
    expect(formatTradingViewPriceLabel(0)).toBe("0")
  })

  it("keeps a simple decimal price intact", () => {
    expect(formatTradingViewPriceLabel(1234.5)).toBe("1234.5")
  })
})
