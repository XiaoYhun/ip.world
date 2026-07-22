"use client"

import dayjs from "dayjs"
import duration from "dayjs/plugin/duration"
import relativeTime from "dayjs/plugin/relativeTime"
import { useCallback, useEffect, useState } from "react"

dayjs.extend(relativeTime)
dayjs.extend(duration)

export default function Timer({ startTime, className }: { startTime: string; className?: string }) {
  // Enhanced validation for various edge cases
  const [isValidDate, setIsValidDate] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [retryCount, setRetryCount] = useState(0)
  const [showFallback, setShowFallback] = useState(false)

  // Validate startTime with multiple checks
  const validateStartTime = useCallback((time: string) => {
    if (!time || time === "" || time === "null" || time === "undefined") {
      return false
    }

    const parsed = dayjs(time)
    if (!parsed.isValid()) {
      return false
    }

    // Check if the date is reasonable (not in far future, not before 1970)
    const now = dayjs()
    const minDate = dayjs("1970-01-01")
    const maxDate = now.add(1, "year")

    return parsed.isAfter(minDate) && parsed.isBefore(maxDate)
  }, [])

  // Initialize and validate
  useEffect(() => {
    const isValid = validateStartTime(startTime)
    setIsValidDate(isValid)

    if (isValid) {
      const elapsed = dayjs().diff(dayjs(startTime), "seconds")
      setTimeElapsed(isNaN(elapsed) ? 0 : elapsed)
      setShowFallback(false)
      setRetryCount(0)
    } else {
      // If invalid, try to retry after a short delay (in case of temporary API issue)
      if (retryCount < 3) {
        const retryTimeout = setTimeout(
          () => {
            setRetryCount((prev) => prev + 1)
          },
          1000 * (retryCount + 1)
        ) // Exponential backoff: 1s, 2s, 3s

        return () => clearTimeout(retryTimeout)
      } else {
        // After 3 retries, show fallback
        setShowFallback(true)
      }
    }
  }, [startTime, validateStartTime, retryCount])

  useEffect(() => {
    if (!isValidDate) return

    const interval = setInterval(() => {
      const elapsed = dayjs().diff(dayjs(startTime), "seconds")
      if (!isNaN(elapsed)) {
        setTimeElapsed(elapsed)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime, isValidDate])

  // Handle invalid dates with retry indication
  if (!isValidDate) {
    if (showFallback) {
      return <span className={className}>--</span>
    }
    // Show loading state during retries
    return <span className={className}>...</span>
  }

  // Additional NaN check before displaying
  if (isNaN(timeElapsed)) {
    return <span className={className}>--</span>
  }

  // Determine the unit: seconds, minutes, hours, days, weeks, or years
  let displayTime
  if (timeElapsed < 0) {
    displayTime = "0s"
  } else if (timeElapsed < 60) {
    displayTime = `${timeElapsed}s`
  } else if (timeElapsed < 3600) {
    displayTime = `${Math.floor(timeElapsed / 60)}m`
  } else if (timeElapsed < 86400) {
    displayTime = `${Math.floor(timeElapsed / 3600)}h`
  } else if (timeElapsed < 604800) {
    displayTime = `${Math.floor(timeElapsed / 86400)}d`
  } else if (timeElapsed < 31536000) {
    displayTime = `${Math.floor(timeElapsed / 604800)}w`
  } else {
    displayTime = `${Math.floor(timeElapsed / 31536000)}y`
  }

  return <span className={className}>{displayTime}</span>
}
