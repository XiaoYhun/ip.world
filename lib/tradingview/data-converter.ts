import { Bar } from "./types"

/**
 * Convert database rows to TradingView bars
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function convertRowsToBars(rows: any[], multiplier: number = 1): Bar[] {
  // Pre-allocate array for better performance
  const bars: Bar[] = []

  for (let i = 0; i < rows.length; i++) {
    const bar = convertRowToBar(rows[i], multiplier)
    if (bar.time > 0) {
      bars.push(bar)
    }
  }

  // Sort in place for better performance
  return bars.sort((a, b) => a.time - b.time)
}

/**
 * Convert a single database row to a TradingView bar
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function convertRowToBar(row: any, multiplier: number = 1): Bar {
  const m = Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1
  // Always use USD prices regardless of token position
  const openPrice = parseFloat(row.open_price_usd || 0) * m
  const highPrice = parseFloat(row.high_price_usd || 0) * m
  const lowPrice = parseFloat(row.low_price_usd || 0) * m
  const closePrice = parseFloat(row.close_price_usd || 0) * m

  // Always use USD volume as-is to keep values correct
  const volume = parseFloat(row.volume_usd || 0)

  // Create a copy of the data to prevent mutability issues
  return {
    time: new Date(row.interval_start).getTime(),
    open: openPrice,
    high: highPrice,
    low: lowPrice,
    close: closePrice,
    volume: volume,
  }
}

/**
 * Build a standardized WHERE clause for the query
 */
export function buildStandardizedWhereClause(
  standardizedFrom: string,
  standardizedTo: string,
  tokenAddress: string
): string {
  // Build standardized WHERE clause for symbol and time range
  let whereClause = `interval_start >= '${standardizedFrom}' AND interval_start <= '${standardizedTo}'`
  whereClause += ` AND (token_0 = '${tokenAddress.toLowerCase()}' OR token_1 = '${tokenAddress.toLowerCase()}')`

  return whereClause
}

/**
 * Extract token address from symbol string
 */
export function extractTokenAddress(symbol: string): string | undefined {
  const parts = symbol.split("/")
  return parts.length > 1 ? parts[1] : undefined
}
