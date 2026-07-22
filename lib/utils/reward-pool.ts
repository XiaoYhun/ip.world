type RewardPoolSelection = {
  draftedPoolUsd?: number | null
  computedCurrentPoolUsd?: number | null
  fallbackTotalPoolUsd?: number | null
}

function isFiniteNonNegative(value: number | null | undefined): value is number {
  return value != null && Number.isFinite(value) && value >= 0
}

export function resolveRewardPoolUsd({
  draftedPoolUsd,
  computedCurrentPoolUsd,
  fallbackTotalPoolUsd,
}: RewardPoolSelection): number | undefined {
  if (isFiniteNonNegative(draftedPoolUsd)) return draftedPoolUsd
  if (isFiniteNonNegative(computedCurrentPoolUsd)) return computedCurrentPoolUsd
  if (isFiniteNonNegative(fallbackTotalPoolUsd)) return fallbackTotalPoolUsd
  return undefined
}
