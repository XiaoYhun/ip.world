import { Shape, ShapeStream } from "@electric-sql/client"
import { OHLCV_COLUMNS, TIME_INTERVAL_MAP } from "./constants"
import { convertRowToBar } from "./data-converter"
import { getIntervalMs } from "./time-utils"
import { Bar, SubscribeBarsCallback } from "./types"

export class RealtimeManager {
  private shape: Shape | null = null
  private subscribers: Map<string, SubscribeBarsCallback> = new Map()
  private currentBar: Bar | null = null
  private currentBarStartTime: number = 0
  private isInitialized = false
  private debug: boolean
  private currentInterval: string = "15"
  private priceMultiplier: number

  private boundOptimisticHandler: ((e: Event) => void) | null = null

  constructor(debug: boolean = false, priceMultiplier: number = 1) {
    this.debug = debug
    this.priceMultiplier = Number.isFinite(priceMultiplier) && priceMultiplier > 0 ? priceMultiplier : 1
  }

  /**
   * Initialize ElectricSQL shape for real-time updates
   */
  async initializeShape(electricUrl: string, interval: string, tokenAddress: string | undefined): Promise<void> {
    this.currentInterval = interval
    const tableName = TIME_INTERVAL_MAP[interval]
    if (!tableName) {
      console.error(`Unsupported interval: ${interval}`)
      return
    }

    try {
      // Clean up existing shape by setting to null
      this.shape = null

      // Reset current bar state when changing intervals
      this.currentBar = null
      this.currentBarStartTime = 0

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const params: { [key: string]: any } = {
        table: "ohlcv_" + tableName,
        columns: OHLCV_COLUMNS,
        // experimental_compaction: true,
      }

      if (tokenAddress) {
        params.where = `(token_0 = '${tokenAddress.toLowerCase()}' OR token_1 = '${tokenAddress.toLowerCase()}')`
      }

      const stream = new ShapeStream({
        url: electricUrl,
        params,
      })

      this.shape = new Shape(stream)

      // Subscribe to real-time updates
      this.shape.subscribe(({ rows }) => {
        this.onDataUpdate(rows)
      })

      this.isInitialized = true

      // Listen for optimistic price updates from swaps
      if (this.boundOptimisticHandler) {
        window.removeEventListener("optimistic-price-update", this.boundOptimisticHandler)
      }
      this.boundOptimisticHandler = (e: Event) => {
        const detail = (e as CustomEvent).detail
        if (detail?.tokenAddress?.toLowerCase() === tokenAddress?.toLowerCase()) {
          this.injectOptimisticPrice(detail.priceUsd, detail.volume)
        }
      }
      window.addEventListener("optimistic-price-update", this.boundOptimisticHandler)
    } catch (error) {
      console.error(`Failed to initialize Electric SQL shape for interval ${interval}:`, error)
      this.isInitialized = false
    }
  }

  /**
   * Inject an optimistic price into the current bar (from user's own swap).
   * When Electric delivers the real OHLCV row, onDataUpdate overwrites this.
   */
  private injectOptimisticPrice(priceUsd: number, volume?: number): void {
    if (!priceUsd || priceUsd <= 0) return
    const px = priceUsd * this.priceMultiplier

    const intervalMs = getIntervalMs(this.getCurrentInterval())
    const now = Date.now()
    const barStartTime = Math.floor(now / intervalMs) * intervalMs

    if (this.currentBar && barStartTime === this.currentBarStartTime) {
      // Update existing current bar
      this.currentBar = {
        ...this.currentBar,
        high: Math.max(this.currentBar.high, px),
        low: Math.min(this.currentBar.low, px),
        close: px,
        volume: volume != null ? Math.max(this.currentBar.volume || 0, volume) : this.currentBar.volume,
      }
    } else {
      // New bar period — create with optimistic price
      const prevClose = this.currentBar?.close ?? px
      this.currentBar = {
        time: barStartTime,
        open: prevClose,
        high: Math.max(prevClose, px),
        low: Math.min(prevClose, px),
        close: px,
        volume: volume ?? 0,
      }
      this.currentBarStartTime = barStartTime
    }

    // Notify TradingView subscribers
    if (this.currentBar) {
      this.subscribers.forEach((callback, key) => {
        if (!key.endsWith("_health")) {
          setTimeout(() => callback(this.currentBar!), 0)
        }
      })
    }

    if (this.debug) {
      console.log(`[RT] Optimistic price injected: $${priceUsd.toFixed(8)}`)
    }
  }

  /**
   * Handle real-time data updates from ElectricSQL
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private onDataUpdate(rows: any[]): void {
    if (rows.length === 0) return

    // Ensure we use the newest row by timestamp
    const latestRow = rows.reduce((latest, row) => {
      const rowTime = new Date((row as { interval_start: string }).interval_start).getTime()
      const latestTime = new Date((latest as { interval_start: string }).interval_start).getTime()
      return rowTime > latestTime ? row : latest
    }, rows[0])

    const newBar = convertRowToBar(latestRow, this.priceMultiplier)

    // Validate bar data
    if (newBar.time <= 0 || isNaN(newBar.time)) {
      console.warn("Invalid bar time received:", newBar.time)
      return
    }

    // Check if this is a new bar or an update to the current bar
    const intervalMs = getIntervalMs(this.getCurrentInterval())
    const barStartTime = Math.floor(newBar.time / intervalMs) * intervalMs

    if (this.currentBar && barStartTime === this.currentBarStartTime) {
      // Update current bar with new data
      this.currentBar = {
        time: this.currentBarStartTime,
        open: this.currentBar.open,
        high: Math.max(this.currentBar.high, newBar.high),
        low: Math.min(this.currentBar.low, newBar.low),
        close: newBar.close,
        volume: Math.max(this.currentBar.volume || 0, newBar.volume || 0),
      }
    } else {
      // This is a new bar
      this.currentBar = {
        time: barStartTime,
        open: newBar.open,
        high: newBar.high,
        low: newBar.low,
        close: newBar.close,
        volume: newBar.volume,
      }
      this.currentBarStartTime = barStartTime
    }

    // Notify all subscribers with the current bar
    if (this.currentBar) {
      this.subscribers.forEach((callback) => {
        setTimeout(() => callback(this.currentBar!), 0)
      })
    }
  }

  /**
   * Subscribe to real-time bar updates
   */
  subscribeBars(listenerGuid: string, onTick: SubscribeBarsCallback, onResetCacheNeededCallback: () => void): void {
    this.subscribers.set(listenerGuid, onTick)

    // Send current real-time bar if available
    if (this.currentBar) {
      setTimeout(() => {
        onTick(this.currentBar!)
      }, 0)
    }

    // Handle connection issues by calling onResetCacheNeededCallback if needed
    if (!this.isInitialized || !this.shape) {
      setTimeout(() => {
        onResetCacheNeededCallback()
      }, 0)
    }

    // Set up periodic health check for connection issues
    const healthCheck = setInterval(() => {
      if (!this.isInitialized || !this.shape) {
        onResetCacheNeededCallback()
        clearInterval(healthCheck)
      }
    }, 30000) // Check every 30 seconds

    // Store the interval for cleanup
    this.subscribers.set(`${listenerGuid}_health`, () => clearInterval(healthCheck))
  }

  /**
   * Unsubscribe from real-time bar updates
   */
  unsubscribeBars(listenerGuid: string): void {
    this.subscribers.delete(listenerGuid)
  }

  /**
   * Get current bar for caching
   */
  getCurrentBar(): Bar | null {
    return this.currentBar
  }

  /**
   * Set current bar (used for initialization from historical data)
   */
  setCurrentBar(bar: Bar | null): void {
    this.currentBar = bar
    if (bar) {
      const intervalMs = getIntervalMs(this.getCurrentInterval())
      this.currentBarStartTime = Math.floor(bar.time / intervalMs) * intervalMs
    }
  }

  /**
   * Check if real-time system is initialized
   */
  isReady(): boolean {
    return this.isInitialized
  }

  /**
   * Get current interval
   */
  private getCurrentInterval(): string {
    return this.currentInterval
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.boundOptimisticHandler) {
      window.removeEventListener("optimistic-price-update", this.boundOptimisticHandler)
      this.boundOptimisticHandler = null
    }
    this.shape = null
    this.subscribers.clear()
    this.currentBar = null
    this.currentBarStartTime = 0
    this.isInitialized = false
  }
}
