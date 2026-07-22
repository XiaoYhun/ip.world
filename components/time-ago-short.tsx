"use client"

import { useEffect, useState } from "react"

function formatTimeAgoShortNative(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime()
  const diffSecs = Math.floor(diffMs / 1000)

  const weeks = Math.floor(diffSecs / (7 * 24 * 3600))
  if (weeks > 0) return `${weeks}w`

  const days = Math.floor(diffSecs / (24 * 3600))
  if (days > 0) return `${days}d`

  const hours = Math.floor(diffSecs / 3600)
  if (hours > 0) return `${hours}h`

  const minutes = Math.floor((diffSecs % 3600) / 60)
  if (minutes > 0) return `${minutes}m`

  return `${Math.max(0, diffSecs)}s`
}

const TimeAgoShort = ({ dateString }: { dateString: string }) => {
  const [label, setLabel] = useState(() => formatTimeAgoShortNative(dateString))

  useEffect(() => {
    setLabel(formatTimeAgoShortNative(dateString))
    const id = setInterval(() => setLabel(formatTimeAgoShortNative(dateString)), 30_000)
    return () => clearInterval(id)
  }, [dateString])

  return <>{label}</>
}

export default TimeAgoShort
