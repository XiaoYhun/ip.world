"use client"

import { useCallback, useState } from "react"

interface ErrorBoundaryHook {
  error: Error | null
  hasError: boolean
  resetError: () => void
  throwError: (error: Error) => void
}

export const useErrorBoundary = (): ErrorBoundaryHook => {
  const [error, setError] = useState<Error | null>(null)
  const [hasError, setHasError] = useState(false)

  const resetError = useCallback(() => {
    setError(null)
    setHasError(false)
  }, [])

  const throwError = useCallback((error: Error) => {
    setError(error)
    setHasError(true)

    // Log error in development
    if (process.env.NODE_ENV === "development") {
      console.error("useErrorBoundary caught an error:", error)
    }
  }, [])

  return {
    error,
    hasError,
    resetError,
    throwError,
  }
}

// Higher-order component to wrap components with error boundary functionality
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>
) => {
  const WrappedComponent = (props: P) => {
    const { error, hasError, resetError, throwError } = useErrorBoundary()

    if (hasError) {
      if (fallback) {
        const FallbackComponent = fallback
        return <FallbackComponent error={error || undefined} resetError={resetError} />
      }

      // Default fallback
      return (
        <div className="bg-background flex min-h-screen items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-[10px] border p-6 text-center shadow-lg">
            <h1 className="text-foreground mb-2 text-xl font-semibold">Something went wrong</h1>
            <p className="text-muted-foreground mb-4 text-sm">We encountered an unexpected error.</p>
            <button
              onClick={resetError}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded px-4 py-2"
            >
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return <Component {...props} throwError={throwError} />
  }

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  return WrappedComponent
}
