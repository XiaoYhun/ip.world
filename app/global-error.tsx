"use client"

import { AlertTriangle } from "lucide-react"
import ErrorAction from "@/components/error-boundary/error-action"

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html>
      <body>
        <div className="bg-background flex min-h-screen items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-[10px] border p-6 text-center shadow-lg">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </div>

            <h1 className="text-foreground mb-2 text-xl font-semibold">Something went wrong</h1>

            <p className="text-muted-foreground mb-6 text-sm">
              We encountered an unexpected error. Please try refreshing the page or contact support if the problem
              persists.
            </p>

            {process.env.NODE_ENV === "development" && (
              <details className="mb-4 text-left">
                <summary className="text-muted-foreground cursor-pointer text-sm font-medium">
                  Error Details (Development)
                </summary>
                <pre
                  className="bg-muted text-muted-foreground mt-2 max-w-full overflow-auto rounded p-2 text-xs"
                  style={{ maxHeight: 240 }}
                >
                  {error.message}
                  {error.stack && `\n\n${error.stack}`}
                  {error.digest && `\n\nDigest: ${error.digest}`}
                </pre>
              </details>
            )}

            <ErrorAction reset={reset} />
          </div>
        </div>
      </body>
    </html>
  )
}
