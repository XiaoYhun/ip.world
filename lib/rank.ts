const TIERS = [
  { name: "Normie", min: 0, max: 500, next: "Casual", nextThreshold: 500 },
  { name: "Casual", min: 500, max: 2000, next: "Degen", nextThreshold: 2000 },
  { name: "Degen", min: 2000, max: 6000, next: "Trencher", nextThreshold: 6000 },
  { name: "Trencher", min: 6000, max: 15000, next: "Legend", nextThreshold: 15000 },
] as const

export function getRankProgress(totalPoints: number) {
  const points = Math.max(0, Number(totalPoints) || 0)
  const currentTier = TIERS.find((tier) => points < tier.max) ?? null

  if (!currentTier) {
    // Already Legend (max tier)
    return { nextRank: "Legend", pointsToGo: 0, progressPercent: 100 }
  }

  const tierSpan = Math.max(1, currentTier.max - currentTier.min)
  const progressPercent = Math.min(100, Math.max(0, ((points - currentTier.min) / tierSpan) * 100))
  const pointsToGo = Math.max(0, currentTier.nextThreshold - points)

  return { nextRank: currentTier.next, pointsToGo, progressPercent }
}
