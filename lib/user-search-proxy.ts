export function hasControlCharacter(value: string) {
  return /[\x00-\x1F\x7F]/.test(value)
}

export function isLeaderboardSearchPayload(value: unknown): value is { results: unknown[]; total?: number } {
  if (!value || typeof value !== "object") {
    return false
  }

  const payload = value as { results?: unknown }
  return Array.isArray(payload.results)
}
