import { formatNumber, formatNumberWithSuffix } from "./number"

export function formatTopEarnerUSD(value: number): string {
  if (value > 0 && value < 1) {
    return formatNumber(value, 2, true)
  }

  return formatNumberWithSuffix(value)
}

export function formatTopEarnerPostCount(postCount?: number): string | null {
  if (!postCount || postCount <= 0) return null

  return `${postCount} ${postCount === 1 ? "post" : "posts"}`
}

export function formatPayoutCountdownDisplay(
  countdown: string | undefined,
  isLate: boolean
): { label: string; value: string } {
  if (isLate) {
    return { label: "Payout", value: "Late" }
  }

  return { label: "Payout in", value: countdown && countdown !== "--" ? countdown : "--" }
}
