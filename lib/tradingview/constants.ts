// Type for time interval mapping
export type TimeIntervalMap = Record<string, string>

export const OHLCV_COLUMNS = [
  "id",
  "token_0",
  "token_1",
  "interval_start",
  "open_price",
  "high_price",
  "low_price",
  "close_price",
  "open_price_usd",
  "high_price_usd",
  "low_price_usd",
  "close_price_usd",
  "volume_token_0",
  "volume_token_1",
  "volume_usd",
  "token0_decimal",
  "token1_decimal",
  "interval_type",
]

export const TIME_INTERVAL_MAP: TimeIntervalMap = {
  "30S": "30s",
  "1": "1min",
  "5": "5min",
  "15": "15min",
  "30": "30min",
  "60": "60min",
  "240": "240min",
  "720": "720min",
  "1D": "1d",
  "1W": "7d",
}

export const SUPPORTED_RESOLUTIONS = ["30S", "1", "5", "15", "30", "60", "240", "720", "1D", "1W"] as const

export const INTERVAL_MS_MAP: Record<string, number> = {
  "30S": 30 * 1000,
  "1": 60 * 1000,
  "5": 5 * 60 * 1000,
  "15": 15 * 60 * 1000,
  "30": 30 * 60 * 1000,
  "60": 60 * 60 * 1000,
  "240": 4 * 60 * 60 * 1000,
  "720": 12 * 60 * 60 * 1000,
  "1D": 24 * 60 * 60 * 1000,
  "1W": 7 * 24 * 60 * 60 * 1000,
}
