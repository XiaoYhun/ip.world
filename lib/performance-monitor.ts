// Performance monitoring utility for static generation

export interface PerformanceMetrics {
  pageLoadTime: number
  timeToFirstByte: number
  timeToInteractive: number
  staticGenerationTime?: number
  cacheHitRate?: number
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, PerformanceMetrics> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  // Track page load performance
  trackPageLoad(page: string, metrics: PerformanceMetrics) {
    this.metrics.set(page, metrics)

    // Log performance data in development
    if (process.env.NODE_ENV === "development") {
      console.log(`📊 Performance for ${page}:`, metrics)
    }
  }

  // Track static generation performance
  trackStaticGeneration(page: string, generationTime: number) {
    const existing = this.metrics.get(page) || {
      pageLoadTime: 0,
      timeToFirstByte: 0,
      timeToInteractive: 0,
    }

    this.metrics.set(page, {
      ...existing,
      staticGenerationTime: generationTime,
    })
  }

  // Track cache hit rate
  trackCacheHit(page: string, hit: boolean) {
    const existing = this.metrics.get(page) || {
      pageLoadTime: 0,
      timeToFirstByte: 0,
      timeToInteractive: 0,
    }

    const currentHitRate = existing.cacheHitRate || 0
    const newHitRate = hit ? (currentHitRate + 1) / 2 : currentHitRate / 2

    this.metrics.set(page, {
      ...existing,
      cacheHitRate: newHitRate,
    })
  }

  // Get performance report
  getReport(): Record<string, PerformanceMetrics> {
    return Object.fromEntries(this.metrics)
  }

  // Calculate average performance metrics
  getAverageMetrics(): PerformanceMetrics {
    const pages = Array.from(this.metrics.values())

    if (pages.length === 0) {
      return {
        pageLoadTime: 0,
        timeToFirstByte: 0,
        timeToInteractive: 0,
      }
    }

    const totals = pages.reduce(
      (acc, page) => ({
        pageLoadTime: acc.pageLoadTime + page.pageLoadTime,
        timeToFirstByte: acc.timeToFirstByte + page.timeToFirstByte,
        timeToInteractive: acc.timeToInteractive + page.timeToInteractive,
        staticGenerationTime: (acc.staticGenerationTime || 0) + (page.staticGenerationTime || 0),
        cacheHitRate: (acc.cacheHitRate || 0) + (page.cacheHitRate || 0),
      }),
      {
        pageLoadTime: 0,
        timeToFirstByte: 0,
        timeToInteractive: 0,
        staticGenerationTime: 0,
        cacheHitRate: 0,
      }
    )

    return {
      pageLoadTime: totals.pageLoadTime / pages.length,
      timeToFirstByte: totals.timeToFirstByte / pages.length,
      timeToInteractive: totals.timeToInteractive / pages.length,
      staticGenerationTime: (totals.staticGenerationTime || 0) / pages.length,
      cacheHitRate: (totals.cacheHitRate || 0) / pages.length,
    }
  }

  // Clear all metrics
  clear() {
    this.metrics.clear()
    console.log("🧹 Performance metrics cleared")
  }

  // Get metrics for a specific page
  getPageMetrics(page: string): PerformanceMetrics | undefined {
    return this.metrics.get(page)
  }

  // Get total number of tracked pages
  getPageCount(): number {
    return this.metrics.size
  }
}

// Global instance for browser debugging
declare global {
  interface Window {
    performanceMonitor: PerformanceMonitor
    debugPerformance: () => void
  }
}

// Make it globally accessible in browser
if (typeof window !== "undefined") {
  window.performanceMonitor = PerformanceMonitor.getInstance()

  // Add a convenient debug function
  window.debugPerformance = () => {
    const monitor = PerformanceMonitor.getInstance()
    console.group("🚀 Performance Monitor Debug")
    console.log("📊 All Metrics:", monitor.getReport())
    console.log("📈 Average Metrics:", monitor.getAverageMetrics())
    console.log("📄 Page Count:", monitor.getPageCount())
    console.log("💡 Usage: window.performanceMonitor.getReport()")
    console.groupEnd()
  }
}

// Client-side performance tracking
export function trackClientPerformance() {
  if (typeof window === "undefined") return

  const monitor = PerformanceMonitor.getInstance()

  // Track page load time
  window.addEventListener("load", () => {
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming

    if (navigation) {
      const metrics: PerformanceMetrics = {
        pageLoadTime: navigation.loadEventEnd - navigation.loadEventStart,
        timeToFirstByte: navigation.responseStart - navigation.requestStart,
        timeToInteractive: navigation.domInteractive - navigation.fetchStart,
      }

      monitor.trackPageLoad(window.location.pathname, metrics)
    }
  })
}

// Server-side performance tracking
export function trackServerPerformance(page: string, startTime: number) {
  const monitor = PerformanceMonitor.getInstance()
  const generationTime = Date.now() - startTime

  monitor.trackStaticGeneration(page, generationTime)
}
