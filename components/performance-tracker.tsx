"use client"

import { useEffect } from "react"
import { trackClientPerformance } from "@/lib/performance-monitor"

export default function PerformanceTracker() {
  useEffect(() => {
    // Initialize client-side performance tracking
    trackClientPerformance()
  }, [])

  return null // This component doesn't render anything
}
