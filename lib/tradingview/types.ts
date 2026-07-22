// TradingView types
export type ResolutionString = string

export interface DatafeedConfiguration {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  exchanges?: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  symbols_types?: any[]
  supported_resolutions?: ResolutionString[]
  supports_marks?: boolean
  supports_search?: boolean
  supports_group_request?: boolean
  supports_timescale_marks?: boolean
  supports_time?: boolean
}

export interface LibrarySymbolInfo {
  name: string
  description: string
  type: string
  session: string
  timezone: string
  ticker: string
  exchange: string
  minmov: number
  pricescale: number
  has_intraday?: boolean
  has_daily?: boolean
  has_weekly_and_monthly?: boolean
  supported_resolutions?: ResolutionString[]
  volume_precision?: number
  data_status?: string
  format?: string
  listed_exchange?: string
}

export interface Bar {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

export interface PeriodParams {
  from: number
  to: number
  firstDataRequest: boolean
  countBack?: number
}

export type ErrorCallback = (reason: string) => void
export type OnReadyCallback = (configuration: DatafeedConfiguration) => void
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SearchSymbolsCallback = (items: any[]) => void
export type ResolveCallback = (symbolInfo: LibrarySymbolInfo) => void
export type HistoryCallback = (bars: Bar[], meta?: { noData: boolean }) => void
export type SubscribeBarsCallback = (bar: Bar) => void

export interface IBasicDataFeed {
  onReady: (callback: OnReadyCallback) => void
  searchSymbols: (userInput: string, exchange: string, symbolType: string, onResult: SearchSymbolsCallback) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolveSymbol: (symbolName: string, onResolve: ResolveCallback, onError: ErrorCallback, extension?: any) => void
  getBars: (
    symbolInfo: LibrarySymbolInfo,
    resolution: ResolutionString,
    periodParams: PeriodParams,
    onResult: HistoryCallback,
    onError: ErrorCallback
  ) => void
  subscribeBars: (
    symbolInfo: LibrarySymbolInfo,
    resolution: ResolutionString,
    onTick: SubscribeBarsCallback,
    listenerGuid: string,
    onResetCacheNeededCallback: () => void
  ) => void
  unsubscribeBars: (listenerGuid: string) => void
  getServerTime?: (callback: (time: number) => void) => void
}

export interface ElectricDatafeedConfig {
  electricUrl: string
  currentInterval: string
  pairType?: "IP" | "USD"
  debug?: boolean
  displaySymbol?: string
  symbol: string
  /** Multiply OHLC by this (e.g. current total supply for MCap mode). Default 1. */
  priceMultiplier?: number
  /**
   * When true, OHLC are already USD FDV-sized (not micro-USD token prices).
   * Use a normal dollar pricescale; do not apply the micro-price scale used for sub-cent tokens.
   */
  mcapAxis?: boolean
}
