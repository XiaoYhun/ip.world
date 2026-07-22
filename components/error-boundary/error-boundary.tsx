"use client"

import { AlertTriangle } from "lucide-react"
import React from "react"
import { errorReporter } from "@/lib/error-reporting"
import ErrorAction from "./error-action"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error, errorInfo)
    }

    // Report error to monitoring service
    errorReporter.reportError(error, {
      component: "ErrorBoundary",
      action: "ComponentError",
      severity: "high",
      errorInfo: errorInfo.componentStack,
    })

    // Call the onError callback if provided
    this.props.onError?.(error, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback component
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />
      }

      // Default fallback UI
      return <DefaultErrorFallback error={this.state.error} resetError={this.resetError} />
    }

    return this.props.children
  }
}

// Default error fallback component
const DefaultErrorFallback: React.FC<{
  error?: Error
  resetError: () => void
}> = ({ error, resetError }) => {
  const handleRetry = () => {
    resetError()
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="bg-card w-full max-w-md rounded-[10px] border p-6 text-center shadow-lg">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <h1 className="text-foreground mb-2 text-xl font-semibold">Something went wrong</h1>

        <p className="text-muted-foreground mb-6 text-sm">
          We encountered an unexpected error. Please try again or go back to the home page.
        </p>

        {process.env.NODE_ENV === "development" && error && (
          <details className="mb-4 text-left">
            <summary className="text-muted-foreground cursor-pointer text-sm font-medium">
              Error Details (Development)
            </summary>
            <pre className="bg-muted text-muted-foreground mt-2 rounded p-2 text-xs">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}

        <ErrorAction reset={handleRetry} />
      </div>
    </div>
  )
}

export default ErrorBoundary
