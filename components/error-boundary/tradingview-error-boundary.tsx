"use client"

import { BarChart3, RefreshCw } from "lucide-react"
import React from "react"
import { Button } from "@/components/ui/button"

interface TradingViewErrorFallbackProps {
  error?: Error
  resetError: () => void
}

const TradingViewErrorFallback: React.FC<TradingViewErrorFallbackProps> = ({ error, resetError }) => {
  return (
    <div className="bg-background flex h-full w-full items-center justify-center p-4">
      <div className="bg-card w-full max-w-sm rounded-[10px] border p-4 text-center shadow-lg">
        <div className="mb-3 flex justify-center">
          <div className="rounded-full bg-orange-100 p-2 dark:bg-orange-900/20">
            <BarChart3 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
        </div>

        <h3 className="text-foreground mb-2 text-sm font-medium">Chart Loading Error</h3>

        <p className="text-muted-foreground mb-4 text-xs">
          Unable to load the trading chart. This might be due to network issues or temporary service problems.
        </p>

        {process.env.NODE_ENV === "development" && error && (
          <details className="mb-3 text-left">
            <summary className="text-muted-foreground cursor-pointer text-xs font-medium">Error Details</summary>
            <pre className="bg-muted text-muted-foreground mt-1 rounded p-2 text-xs">{error.message}</pre>
          </details>
        )}

        <div className="flex justify-center">
          <Button onClick={resetError} size="sm" variant="outline" className="flex items-center gap-1">
            <RefreshCw className="h-3 w-3" />
            Retry
          </Button>
        </div>
      </div>
    </div>
  )
}

interface TradingViewErrorBoundaryProps {
  children: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

class TradingViewErrorBoundary extends React.Component<
  TradingViewErrorBoundaryProps,
  { hasError: boolean; error?: Error }
> {
  constructor(props: TradingViewErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (process.env.NODE_ENV === "development") {
      console.error("TradingView ErrorBoundary caught an error:", error, errorInfo)
    }

    this.props.onError?.(error, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      return <TradingViewErrorFallback error={this.state.error} resetError={this.resetError} />
    }

    return this.props.children
  }
}

export default TradingViewErrorBoundary
