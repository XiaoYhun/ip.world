/**
 * Calculate the start time of the interval containing the given time
 * All calculations are done in UTC to ensure consistency
 */
export function calculateIntervalStart(date: Date, resolution: string): Date {
  // The input date is already in UTC (milliseconds since epoch)
  // No timezone conversion needed
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth()
  const day = date.getUTCDate()
  const hour = date.getUTCHours()
  const minute = date.getUTCMinutes()
  const second = date.getUTCSeconds()

  switch (resolution) {
    case "30S":
      return new Date(Date.UTC(year, month, day, hour, minute, Math.floor(second / 30) * 30))

    case "1":
      return new Date(Date.UTC(year, month, day, hour, minute, 0))

    case "5":
      return new Date(Date.UTC(year, month, day, hour, Math.floor(minute / 5) * 5, 0))

    case "15":
      return new Date(Date.UTC(year, month, day, hour, Math.floor(minute / 15) * 15, 0))

    case "30":
      return new Date(Date.UTC(year, month, day, hour, Math.floor(minute / 30) * 30, 0))

    case "60":
      return new Date(Date.UTC(year, month, day, hour, 0, 0))

    case "240":
      return new Date(Date.UTC(year, month, day, Math.floor(hour / 4) * 4, 0, 0))

    case "720":
      return new Date(Date.UTC(year, month, day, Math.floor(hour / 12) * 12, 0, 0))

    case "1D":
      return new Date(Date.UTC(year, month, day, 0, 0, 0))

    case "1W":
      // Start of week (Monday) in UTC
      const weekday = date.getUTCDay()
      const daysToSubtract = weekday === 0 ? 6 : weekday - 1 // Sunday = 0, Monday = 1
      return new Date(Date.UTC(year, month, day - daysToSubtract, 0, 0, 0))

    default:
      return new Date(Date.UTC(year, month, day, hour, minute, 0))
  }
}

/**
 * Standardize time ranges by rounding to interval boundaries for better caching
 * This ensures queries align with natural time-series intervals
 */
export function standardizeTimeRange(
  from: number,
  to: number,
  resolution: string
): { standardizedFrom: string; standardizedTo: string } {
  // Round 'from' to the start of the interval containing it
  const standardizedFrom = calculateIntervalStart(new Date(from), resolution)

  // Round 'to' to the start of the next interval after it
  const standardizedTo = calculateIntervalStart(new Date(to + 1), resolution)

  return {
    standardizedFrom: standardizedFrom.toISOString(),
    standardizedTo: standardizedTo.toISOString(),
  }
}

/**
 * Get interval duration in milliseconds for a given resolution
 */
export function getIntervalMs(resolution: string): number {
  const intervalMap: Record<string, number> = {
    "30S": 30 * 1000,
    "1": 60 * 1000,
    "5": 5 * 60 * 1000,
    "15": 15 * 60 * 1000,
    "30": 30 * 60 * 1000,
    "60": 60 * 60 * 1000,
    "240": 4 * 60 * 60 * 1000,
    "720": 12 * 60 * 60 * 1000,
    "1D": 24 * 60 * 60 * 1000,
    "1W": 7 * 24 * 60 * 60 * 1000,
  }
  return intervalMap[resolution] || 60 * 1000
}
