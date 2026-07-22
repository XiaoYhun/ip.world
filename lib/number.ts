import BigNumber from "bignumber.js"

export function formatCompactUSD(number: number): string {
  if (number >= 1e12) return (number / 1e12).toFixed(1) + "T"
  if (number >= 1e9) return (number / 1e9).toFixed(1) + "B"
  if (number >= 1e6) return (number / 1e6).toFixed(1) + "M"
  if (number >= 1e3) return Math.floor(number / 1e3) + "K"
  return Math.round(number).toLocaleString()
}

export function formatNumberWithSuffix(number: number, fixed: number = 1): string {
  if (number >= 1e12) {
    return (number / 1e12).toFixed(fixed) + "T"
  } else if (number >= 1e9) {
    return (number / 1e9).toFixed(fixed) + "B"
  } else if (number >= 1e6) {
    return (number / 1e6).toFixed(fixed) + "M"
  } else if (number >= 1e3) {
    return (number / 1e3).toFixed(fixed) + "K"
  } else {
    return formatNumber(number, fixed, true)
  }
}

export function formatNumber(value: number | string, fixed = 2, comma = false): string {
  const bn = new BigNumber(value)
  const decimalPlaces = bn.dp() // Get decimal places

  if (decimalPlaces && decimalPlaces > fixed) {
    return comma
      ? new BigNumber(bn.toFixed(fixed, BigNumber.ROUND_DOWN)).toFormat()
      : bn.toFixed(fixed, BigNumber.ROUND_DOWN) // Cut to 3 decimals without rounding up
  }

  return comma ? bn.toFormat() : bn.toString() // Keep as is if decimal places are 3 or less
}

export function roundUpNumber(number: number, fixed = 1): number {
  return Number.isInteger(number) ? number : Number(number.toFixed(fixed))
}

export function formatUSD(amount: string | number) {
  const num = typeof amount === "string" ? Number.parseFloat(amount) : amount
  if (isNaN(num)) return amount

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: num >= 1000000 ? "compact" : "standard",
    maximumFractionDigits: 2,
  }).format(num)
}

/**
 * Formats a number by replacing consecutive zeros after the decimal point with a superscript count.
 * Example: 0.00021 becomes 0.0²21 (keeps first zero, shows additional zeros as superscript)
 *
 * @param value - The number to format (can be number, string, or BigNumber)
 * @returns Formatted string with superscript zero count
 */
export function formatNumberWithSuperscriptZeros(value: number | string | BigNumber, decimalPlaces = 2): string {
  // Convert to string for processing
  let strValue = typeof value === "string" ? value : value.toString()

  // Handle scientific notation
  if (strValue.includes("e") || strValue.includes("E")) {
    // Convert scientific notation to decimal form
    const numValue = typeof value === "string" ? parseFloat(value) : Number(value)
    // Use toFixed with enough decimal places to avoid scientific notation
    strValue = numValue.toFixed(20).replace(/\.?0+$/, "") // Remove trailing zeros
  }

  // Check if the number has a decimal point
  if (!strValue.includes(".")) {
    return strValue
  }

  // Split by decimal point
  const [integerPart, decimalPart] = strValue.split(".")

  // Find consecutive zeros at the beginning of the decimal part
  let zeroCount = 0
  let significantDigits = ""

  for (let i = 0; i < decimalPart.length; i++) {
    if (decimalPart[i] === "0") {
      zeroCount++
    } else {
      significantDigits = decimalPart.slice(i)
      break
    }
  }

  // If no consecutive zeros at the start, return original
  if (zeroCount === 0) {
    return strValue
  }

  // Format the result: keep first zero, show additional zeros as superscript
  const additionalZeros = zeroCount - 1
  const superscriptMap: { [key: number]: string } = {
    1: "¹",
    2: "²",
    3: "³",
    4: "⁴",
    5: "⁵",
    6: "⁶",
    7: "⁷",
    8: "⁸",
    9: "⁹",
  }

  const formattedDecimal =
    additionalZeros > 0
      ? `0${superscriptMap[additionalZeros] || `^${additionalZeros}`}${significantDigits}`
      : `0${significantDigits}`

  return `${integerPart}.${formattedDecimal.slice(0, decimalPlaces + 2)}`
}

const SUPERSCRIPT_DIGITS = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"] as const

function nonnegativeIntToSuperscript(n: number): string {
  return String(Math.max(0, Math.floor(n)))
    .split("")
    .map((ch) => SUPERSCRIPT_DIGITS[Number(ch)] ?? ch)
    .join("")
}

/**
 * Compact price strings for TradingView axes and legends: trims trailing fractional zeros,
 * limits significant digits, and uses Unicode superscripts for runs of zeros after the decimal
 * (same convention as {@link formatNumberWithSuperscriptZeros}).
 */
export function formatTradingViewPriceLabel(price: number, maxSignificantDigits = 8): string {
  const maxTailAfterCompact = 6
  /** Last-price / legend lines often have no leading-zero run; keep this tight so the scale column stays narrow. */
  const maxPlainFractionDigits = 6

  if (!Number.isFinite(price)) {
    return "—"
  }
  if (price === 0 || Object.is(price, -0)) {
    return "0"
  }

  const sign = price < 0 ? "-" : ""
  let s = new BigNumber(Math.abs(price)).precision(maxSignificantDigits, BigNumber.ROUND_HALF_UP).toFixed()
  if (s.includes("e") || s.includes("E")) {
    s = new BigNumber(Math.abs(price)).toExponential(maxSignificantDigits - 1)
    s = new BigNumber(s).toFixed(20).replace(/\.?0+$/, "")
  }
  if (s.includes(".")) {
    s = s.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "")
  }

  if (!s.includes(".")) {
    return sign + s
  }

  const [integerPart, decimalPart] = s.split(".")
  let zeroRun = 0
  for (; zeroRun < decimalPart.length && decimalPart[zeroRun] === "0"; zeroRun++) {}

  let frac = decimalPart.slice(zeroRun).replace(/0+$/, "")

  if (zeroRun === 0) {
    if (frac.length > maxPlainFractionDigits) {
      frac = frac.slice(0, maxPlainFractionDigits).replace(/0+$/, "")
    }
    const tail = frac.length ? `.${frac}` : ""
    return sign + integerPart + tail
  }

  if (frac.length > maxTailAfterCompact) {
    frac = frac.slice(0, maxTailAfterCompact).replace(/0+$/, "")
  }

  const additionalLeadingZeros = zeroRun - 1
  const sup = additionalLeadingZeros > 0 ? nonnegativeIntToSuperscript(additionalLeadingZeros) : ""
  const afterDot = additionalLeadingZeros > 0 ? `0${sup}${frac}` : `0${frac}`
  return sign + `${integerPart}.${afterDot}`
}

/**
 * Formats a number by replacing consecutive zeros after the decimal point with HTML superscript tags.
 * Example: 0.00021 becomes "0.0<sup>2</sup>21" (keeps first zero, shows additional zeros as superscript)
 * Limits significant digits after superscript to 2 digits maximum.
 *
 * @param value - The number to format (can be number, string, or BigNumber)
 * @returns Formatted string with HTML superscript tags
 */
export function formatNumberWithHTMLSuperscript(value: number | string | BigNumber): string {
  // Convert to number first to handle scientific notation, then to string
  let numValue: number
  if (typeof value === "string") {
    numValue = parseFloat(value)
  } else if (typeof value === "number") {
    numValue = value
  } else {
    numValue = parseFloat(value.toString())
  }

  // Handle invalid numbers
  if (isNaN(numValue) || numValue === 0) {
    return "$0"
  }

  // Convert to fixed decimal string to avoid scientific notation
  // Use toFixed with enough precision to capture very small numbers
  const strValue = numValue.toFixed(50).replace(/\.?0+$/, "")

  // Check if the number has a decimal point
  if (!strValue.includes(".")) {
    return `$${strValue}`
  }

  // Split by decimal point
  const [integerPart, decimalPart] = strValue.split(".")

  // Find consecutive zeros at the beginning of the decimal part
  let zeroCount = 0
  let significantDigits = ""

  for (let i = 0; i < decimalPart.length; i++) {
    if (decimalPart[i] === "0") {
      zeroCount++
    } else {
      significantDigits = decimalPart.slice(i)
      break
    }
  }

  // If no consecutive zeros at the start, return original
  if (zeroCount === 0) {
    return `$${strValue}`
  }

  // Limit significant digits to 2 digits maximum
  const limitedSignificantDigits = significantDigits.slice(0, 2)

  // Format the result: keep first zero, show additional zeros as HTML superscript
  const additionalZeros = zeroCount - 1
  const formattedDecimal =
    additionalZeros > 0 ? `0<sup>${additionalZeros}</sup>${limitedSignificantDigits}` : `0${limitedSignificantDigits}`

  return `$${integerPart}.${formattedDecimal}`
}

export function formatUsdParts(value: number | string, decimals = 2): { dollars: string; cents: string } {
  const num = Number(value)
  const sign = num > 0 ? "" : num === 0 || Object.is(num, -0) ? "" : "-"
  const formatted = Math.abs(Number(value)).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  const [whole, fraction] = formatted.split(".")
  return { dollars: `${sign}$${whole}`, cents: `.${fraction}` }
}
