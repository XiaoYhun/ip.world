"use client"

import { useEffect } from "react"
import { errorReporter } from "@/lib/error-reporting"

export function ErrorReporterInit() {
  useEffect(() => {
    // Delay error reporter initialization to prevent blocking initial render
    const timer = setTimeout(() => {
      // Initialize error reporting
      errorReporter.init({
        enableConsoleLogging: process.env.NODE_ENV === "development",
        enableRemoteReporting: true,
      })
    }, 1000) // 1 second delay

    return () => clearTimeout(timer)
  }, [])

  return null
}
