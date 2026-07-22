/** Human-readable text from Relay `errorCode` when `message` is missing. */
function humanizeRelayErrorCode(code: string): string {
  const map: Record<string, string> = {
    AMOUNT_TOO_LOW: "Amount is too small to be swapped.",
    AMOUNT_TOO_HIGH: "Amount is too large to be swapped.",
    INSUFFICIENT_LIQUIDITY: "Insufficient liquidity for this swap.",
    NO_ROUTE_FOUND: "No route found for this swap.",
  }
  if (map[code]) return map[code]
  return code.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Parse Relay JSON error body (raw HTTP response text).
 */
export function formatRelayHttpErrorBody(status: number, bodyText: string): string {
  const t = bodyText.trim()
  if (!t) return `Relay request failed (${status}).`
  try {
    const j = JSON.parse(t) as { message?: string; errorCode?: string }
    if (typeof j.message === "string" && j.message.length > 0) return j.message
    if (typeof j.errorCode === "string" && j.errorCode.length > 0) return humanizeRelayErrorCode(j.errorCode)
  } catch {
    /* not JSON */
  }
  if (t.length <= 200) return t
  return `Relay request failed (${status}).`
}

/**
 * Extract user-facing text from a thrown `Error.message` that may embed
 * Relay JSON (e.g. `[Relay] Quote failed (400): {...}`) or be a plain API message.
 */
export function relayUserMessageFromErrorMessage(raw: string): string {
  const trimmed = raw.trim()
  const first = trimmed.indexOf("{")
  const last = trimmed.lastIndexOf("}")
  if (first >= 0 && last > first) {
    try {
      const j = JSON.parse(trimmed.slice(first, last + 1)) as { message?: string; errorCode?: string }
      if (typeof j.message === "string" && j.message.length > 0) return j.message
      if (typeof j.errorCode === "string" && j.errorCode.length > 0) return humanizeRelayErrorCode(j.errorCode)
    } catch {
      /* invalid JSON segment */
    }
  }
  return trimmed
}
