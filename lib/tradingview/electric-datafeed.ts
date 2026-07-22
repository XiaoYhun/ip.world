import { OHLCVAPIClient } from "./api-client"
import { BarCache } from "./bar-cache"
import { TIME_INTERVAL_MAP } from "./constants"
import { extractTokenAddress } from "./data-converter"
import { RealtimeManager } from "./realtime-manager"
import { getIntervalMs } from "./time-utils"
import {
  ElectricDatafeedConfig,
  ErrorCallback,
  HistoryCallback,
  IBasicDataFeed,
  LibrarySymbolInfo,
  OnReadyCallback,
  PeriodParams,
  ResolutionString,
  ResolveCallback,
  SearchSymbolsCallback,
  SubscribeBarsCallback,
} from "./types"

export class ElectricDatafeed implements IBasicDataFeed {
  private config: ElectricDatafeedConfig
  private currentTokenAddress: string | undefined
  private apiClient: OHLCVAPIClient
  private realtimeManager: RealtimeManager
  private barCache: BarCache

  constructor(config: ElectricDatafeedConfig) {
    this.config = config
    this.currentTokenAddress = extractTokenAddress(config.symbol)
    this.apiClient = new OHLCVAPIClient(config.debug)
    this.realtimeManager = new RealtimeManager(config.debug, config.priceMultiplier ?? 1)
    this.barCache = new BarCache()
    this.initializeShape()
  }

  private async initializeShape() {
    await this.initializeShapeForInterval(this.config.currentInterval)
  }

  private async initializeShapeForInterval(interval: string) {
    await this.realtimeManager.initializeShape(this.config.electricUrl, interval, this.currentTokenAddress)
  }

  onReady(callback: OnReadyCallback): void {
    setTimeout(() => {
      callback({
        exchanges: [],
        symbols_types: [],
        supported_resolutions: ["30S", "1", "5", "15", "30", "60", "240", "720", "1D", "1W"] as ResolutionString[],
        supports_marks: false,
        supports_search: false,
        supports_group_request: false,
        supports_timescale_marks: false,
        supports_time: true,
      })
    }, 0)
  }

  searchSymbols(userInput: string, exchange: string, symbolType: string, onResult: SearchSymbolsCallback): void {
    // For now, return empty results to avoid expensive database calls
    // This can be enhanced later with a lightweight symbol cache if needed
    setTimeout(() => onResult([]), 0)
  }

  resolveSymbol(
    symbolName: string,
    onResolve: ResolveCallback,
    onError: ErrorCallback,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    extension?: any
  ): void {
    // Validate symbol format without expensive database calls
    const tokenAddress = extractTokenAddress(symbolName)
    if (!tokenAddress) {
      setTimeout(() => onError("Invalid symbol format"), 0)
      return
    }

    // Always resolve the symbol since we're using a standardized approach
    // The actual data validation will happen during getBars calls
    // Micro-USD token price (default) vs dollar-scale FDV for MCap. Mixing micro pricescale
    // with FDV-sized OHLC breaks tick math and candles/volume often do not render.
    const mcapAxis = this.config.mcapAxis === true
    const pricescale = mcapAxis
      ? 10000
      : this.config.pairType === "USD"
        ? 1_000_000_000_000
        : 100_000_000

    const symbolInfo: LibrarySymbolInfo = {
      name: symbolName,
      description: this.config.displaySymbol || symbolName,
      type: "crypto",
      session: "24x7", // Crypto trades 24/7
      timezone: "Etc/UTC", // Use UTC for crypto
      ticker: this.config.displaySymbol || symbolName,
      exchange: "Crypto",
      minmov: 1,
      pricescale,
      has_intraday: true,
      has_daily: true,
      has_weekly_and_monthly: true,
      supported_resolutions: ["30S", "1", "5", "15", "30", "60", "240", "720", "1D", "1W"] as ResolutionString[],
      volume_precision: 2, // Use lower precision for better volume bar display
      data_status: "streaming",
      format: "price",
      listed_exchange: "Crypto",
    }

    setTimeout(() => onResolve(symbolInfo), 0)
  }

  getBars(
    symbolInfo: LibrarySymbolInfo,
    resolution: ResolutionString,
    periodParams: PeriodParams,
    onResult: HistoryCallback,
    onError: ErrorCallback
  ): void {
    const { from, to, countBack } = periodParams

    // Normalize timestamps: detect format and convert to milliseconds
    const fromTimestamp = from.toString().length < 12 ? from * 1000 : from
    const toTimestamp = to.toString().length < 12 ? to * 1000 : to

    // Check if we need to switch to a different interval table
    if (this.config.currentInterval !== resolution) {
      this.config.currentInterval = resolution
      this.initializeShapeForInterval(resolution)
        .then(() => {
          this.loadBarsForTimeRange(symbolInfo, resolution, fromTimestamp, toTimestamp, countBack, onResult, onError)
        })
        .catch((error) => {
          console.error("Failed to switch interval:", error)
          setTimeout(() => onError("Failed to switch interval"), 0)
        })
      return
    }

    this.loadBarsForTimeRange(symbolInfo, resolution, fromTimestamp, toTimestamp, countBack, onResult, onError)
  }

  private async loadBarsForTimeRange(
    symbolInfo: LibrarySymbolInfo,
    resolution: ResolutionString,
    from: number,
    to: number,
    countBack: number | undefined,
    onResult: HistoryCallback,
    onError: ErrorCallback
  ): Promise<void> {
    if (this.config.debug) {
      console.log(
        `[FEED] Requesting data: [${new Date(from).toISOString()} ... ${new Date(to).toISOString()}, ${countBack || "no countBack"} bars]`
      )
    }

    if (!this.currentTokenAddress) {
      setTimeout(() => onError("Invalid symbol format"), 0)
      return
    }

    const intervalType = TIME_INTERVAL_MAP[resolution]
    if (!intervalType) {
      setTimeout(() => onError("Unsupported interval"), 0)
      return
    }

    try {
      // According to TradingView docs, countBack is more important than exact time range
      // If we have countBack, we should prioritize getting that many bars
      const queryTo = new Date(to).toISOString()

      // Use countBack as the limit, or a reasonable default if not provided
      const limit = countBack && countBack > 0 ? countBack : 100

      if (this.config.debug) {
        console.log(`[FEED] countBack: ${countBack || "not specified"}, using limit: ${limit}`)
      }

      if (this.config.debug) {
        console.log(`[FEED] Original range: ${new Date(from).toISOString()} to ${new Date(to).toISOString()}`)
        console.log(`[FEED] API query: to=${queryTo}, limit=${limit}`)
      }

      // Fetch data from API
      const apiResponse = await this.apiClient.fetchOHLCVData(this.currentTokenAddress, intervalType, queryTo, limit)

      if (!apiResponse.data || apiResponse.data.length === 0) {
        if (this.config.debug) {
          console.log(`[FEED] No data found for range`)
        }
        setTimeout(() => onResult([], { noData: apiResponse.nodata }), 0)
        return
      }

      // Convert API response to bars
      const mult = this.config.priceMultiplier ?? 1
      const allBars = this.apiClient.convertAPIResponseToBars(apiResponse, mult)

      // Remove duplicate timestamps to prevent "data must have unique times" error
      const uniqueBars = this.barCache.removeDuplicateTimestamps(allBars)

      if (uniqueBars.length === 0) {
        if (this.config.debug) {
          console.log(`[FEED] No valid bars found after conversion`)
        }
        setTimeout(() => onResult([], { noData: apiResponse.nodata }), 0)
        return
      }

      // Cache the last bar for real-time updates
      if (uniqueBars.length > 0) {
        const lastBar = uniqueBars[uniqueBars.length - 1]
        this.barCache.setLastBar(symbolInfo.name, lastBar)

        // Initialize current bar for real-time updates
        const intervalMs = getIntervalMs(resolution)
        const barStartTime = Math.floor(lastBar.time / intervalMs) * intervalMs
        const currentBar = { ...lastBar, time: barStartTime }
        this.realtimeManager.setCurrentBar(currentBar)
      }

      // Return all unique bars we fetched
      if (this.config.debug) {
        console.log(
          `[FEED] Returning ${uniqueBars.length} bars in [${uniqueBars.length > 0 ? new Date(uniqueBars[0].time).toISOString() : "N/A"} ... ${uniqueBars.length > 0 ? new Date(uniqueBars[uniqueBars.length - 1].time).toISOString() : "N/A"}]`
        )
      }

      setTimeout(() => onResult(uniqueBars, { noData: apiResponse.nodata }), 0)
    } catch (error) {
      console.error("Failed to load data for time range:", error)
      setTimeout(() => onError(error instanceof Error ? error.message : String(error)), 0)
    }
  }

  subscribeBars(
    symbolInfo: LibrarySymbolInfo,
    resolution: ResolutionString,
    onTick: SubscribeBarsCallback,
    listenerGuid: string,
    onResetCacheNeededCallback: () => void
  ): void {
    // Send the last cached bar if available
    const lastCachedBar = this.barCache.getLastBarForSymbol(symbolInfo.name)
    if (lastCachedBar) {
      setTimeout(() => {
        onTick(lastCachedBar)
      }, 0)
    }

    // Send current real-time bar if available
    const currentBar = this.realtimeManager.getCurrentBar()
    if (currentBar) {
      setTimeout(() => {
        onTick(currentBar)
      }, 0)
    }

    // Delegate to realtime manager
    this.realtimeManager.subscribeBars(listenerGuid, onTick, onResetCacheNeededCallback)
  }

  unsubscribeBars(listenerGuid: string): void {
    this.realtimeManager.unsubscribeBars(listenerGuid)
  }

  getServerTime(callback: (time: number) => void): void {
    setTimeout(() => callback(Date.now()), 0)
  }

  // Cleanup method to be called when the datafeed is no longer needed
  destroy(): void {
    this.realtimeManager.destroy()
    this.barCache.clear()
  }
}
