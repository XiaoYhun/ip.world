// Error reporting utility for monitoring and tracking errors

interface ErrorContext {
  component?: string
  action?: string
  userId?: string
  url?: string
  userAgent?: string
  timestamp: number
  [key: string]: unknown
}

interface ErrorReport {
  error: Error
  context: ErrorContext
  severity: "low" | "medium" | "high" | "critical"
}

class ErrorReporter {
  private static instance: ErrorReporter
  private isInitialized = false

  private constructor() {}

  static getInstance(): ErrorReporter {
    if (!ErrorReporter.instance) {
      ErrorReporter.instance = new ErrorReporter()
    }
    return ErrorReporter.instance
  }

  /**
   * Initialize error reporting (call this once in your app)
   */
  init(options?: { enableConsoleLogging?: boolean; enableRemoteReporting?: boolean; remoteEndpoint?: string }) {
    if (this.isInitialized) return

    this.isInitialized = true

    // Set up global error handlers
    if (typeof window !== "undefined") {
      // Handle unhandled promise rejections
      window.addEventListener("unhandledrejection", (event) => {
        this.reportError(new Error(event.reason), {
          component: "Global",
          action: "UnhandledPromiseRejection",
          severity: "high",
        })
      })

      // Handle global errors
      window.addEventListener("error", (event) => {
        this.reportError(event.error || new Error(event.message), {
          component: "Global",
          action: "GlobalError",
          severity: "high",
        })
      })
    }

    // Log initialization
    if (options?.enableConsoleLogging !== false) {
      console.log("Error reporting initialized")
    }
  }

  /**
   * Report an error with context
   */
  reportError(
    error: Error,
    context: Partial<ErrorContext> & { severity?: "low" | "medium" | "high" | "critical" } = {}
  ) {
    const errorReport: ErrorReport = {
      error,
      context: {
        component: context.component || "Unknown",
        action: context.action || "Unknown",
        userId: context.userId,
        url: typeof window !== "undefined" ? window.location.href : undefined,
        userAgent: typeof window !== "undefined" ? window.navigator.userAgent : undefined,
        timestamp: Date.now(),
        ...context,
      },
      severity: context.severity || "medium",
    }

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.group("🚨 Error Report")
      console.error("Error:", error)
      console.error("Context:", errorReport.context)
      console.error("Severity:", errorReport.severity)
      console.groupEnd()
    }

    // Send to remote service if configured
    this.sendToRemoteService(errorReport)

    // You can add more error reporting services here
    // Example: Sentry, LogRocket, etc.
  }

  /**
   * Send error to remote service
   */
  private async sendToRemoteService(errorReport: ErrorReport) {
    // This is where you would integrate with your error reporting service
    // Example implementations:

    // Sentry
    // if (window.Sentry) {
    //   window.Sentry.captureException(errorReport.error, {
    //     extra: errorReport.context,
    //     level: errorReport.severity,
    //   })
    // }

    // Custom endpoint
    // try {
    //   await fetch('/api/error-reporting', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(errorReport),
    //   })
    // } catch (err) {
    //   console.error('Failed to send error report:', err)
    // }

    // For now, just log to console
    if (process.env.NODE_ENV === "production") {
      console.error("Error report (production):", errorReport)
    }
  }

  /**
   * Create a context for a specific component or action
   */
  createContext(component: string, action?: string): ErrorContext {
    return {
      component,
      action,
      timestamp: Date.now(),
    }
  }

  /**
   * Wrap a function with error reporting
   */
  wrapFunction<T extends (...args: unknown[]) => unknown>(
    fn: T,
    context: Partial<ErrorContext> & { severity?: "low" | "medium" | "high" | "critical" }
  ): T {
    return ((...args: Parameters<T>) => {
      try {
        return fn(...args)
      } catch (error) {
        this.reportError(error as Error, context)
        throw error
      }
    }) as T
  }

  /**
   * Wrap an async function with error reporting
   */
  wrapAsyncFunction<T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T,
    context: Partial<ErrorContext> & { severity?: "low" | "medium" | "high" | "critical" }
  ): T {
    return (async (...args: Parameters<T>) => {
      try {
        return await fn(...args)
      } catch (error) {
        this.reportError(error as Error, context)
        throw error
      }
    }) as T
  }
}

// Export singleton instance
export const errorReporter = ErrorReporter.getInstance()

// Export types for use in components
export type { ErrorContext, ErrorReport }
