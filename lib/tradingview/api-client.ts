import { Bar } from "./types"

// API response type for OHLCV data
export interface OHLCVResponse {
  data: Array<{
    id: string
    token_0: string
    token_1: string
    interval_type: string
    interval_start: string
    open_price: string
    high_price: string
    low_price: string
    close_price: string
    open_price_usd: string
    high_price_usd: string
    low_price_usd: string
    close_price_usd: string
    volume_token_0: string
    volume_token_1: string
    volume_usd: string
    token0_decimal: number
    token1_decimal: number
    last_indexed_timestamp: string
    created_at: string
    updated_at: string
  }>
  nodata: boolean
  query: {
    interval_type: string
    limit: number
    to: string
    token_address: string
  }
}

export class OHLCVAPIClient {
  private debug: boolean

  constructor(debug: boolean = false) {
    this.debug = debug
  }

  /**
   * Fetch OHLCV data from the backend API
   */
  async fetchOHLCVData(tokenAddress: string, intervalType: string, to: string, limit: number): Promise<OHLCVResponse> {
    const url = `/api/ohlcv?token_address=${tokenAddress}&interval_type=${intervalType}&to=${to}&limit=${limit}`

    if (this.debug) {
      console.log(`[API] Request: ${url}`)
    }

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data as OHLCVResponse
  }

  /**
   * Convert API response data to TradingView bars
   */
  convertAPIResponseToBars(apiData: OHLCVResponse, multiplier: number = 1): Bar[] {
    const m = Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1
    const bars: Bar[] = []

    for (const item of apiData.data) {
      // Always use USD prices regardless of token position
      const openPrice = parseFloat(item.open_price_usd || "0") * m
      const highPrice = parseFloat(item.high_price_usd || "0") * m
      const lowPrice = parseFloat(item.low_price_usd || "0") * m
      const closePrice = parseFloat(item.close_price_usd || "0") * m

      // Always use USD volume as-is to keep values correct
      const volume = parseFloat(item.volume_usd || "0")

      const bar: Bar = {
        time: new Date(item.interval_start).getTime(),
        open: openPrice,
        high: highPrice,
        low: lowPrice,
        close: closePrice,
        volume: volume,
      }

      if (bar.time > 0) {
        bars.push(bar)
      }
    }

    // Sort by time for consistency
    return bars.sort((a, b) => a.time - b.time)
  }
}
