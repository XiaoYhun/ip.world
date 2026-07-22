import { Bar } from "./types"

export class BarCache {
  private lastBarsCache: Map<string, Bar> = new Map()
  private lastBar: Bar | null = null

  /**
   * Cache the last bar for a specific symbol
   */
  setLastBar(symbol: string, bar: Bar): void {
    this.lastBarsCache.set(symbol, { ...bar })
    this.lastBar = bar
  }

  /**
   * Get the last cached bar for a specific symbol
   */
  getLastBarForSymbol(symbol: string): Bar | undefined {
    return this.lastBarsCache.get(symbol)
  }

  /**
   * Get the most recent last bar (across all symbols)
   */
  getLastBar(): Bar | null {
    return this.lastBar
  }

  /**
   * Remove duplicate timestamps from bars array
   */
  removeDuplicateTimestamps(bars: Bar[]): Bar[] {
    return bars.filter((bar, index, self) => index === 0 || bar.time !== self[index - 1].time)
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.lastBarsCache.clear()
    this.lastBar = null
  }

  /**
   * Get cache size for debugging
   */
  getCacheSize(): number {
    return this.lastBarsCache.size
  }
}
