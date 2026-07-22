"use client"

import { Loader2 } from "lucide-react"
import { lazy, Suspense } from "react"

// Lazy load the TradingView chart component
const TradingViewAdvancedChart = lazy(() => import("./tradingview-advanced-chart"))

interface LazyChartWrapperProps {
  displaySymbol: string
  symbol: string
  interval?: string
  theme?: "light" | "dark"
  electricConfig?: {
    url: string
  }
  hideLeftToolbar?: boolean
  priceMultiplier?: number
}

function ChartLoadingFallback() {
  return (
    <div className="bg-background flex h-full items-center justify-center">
      <div className="text-center">
        <Loader2 className="text-primary mx-auto mb-2 h-8 w-8 animate-spin" />
        <p className="text-muted-foreground text-sm">Loading chart...</p>
      </div>
    </div>
  )
}

export default function LazyChartWrapper(props: LazyChartWrapperProps) {
  return (
    <Suspense fallback={<ChartLoadingFallback />}>
      <TradingViewAdvancedChart {...props} />
    </Suspense>
  )
}
