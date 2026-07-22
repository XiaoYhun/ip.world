import { HIDDEN_TRENDING_REMIXES } from "@/lib/constants"
import type { Remix } from "@/types/remix"

export function parseHiddenFilteredRemixResults(data: unknown): Remix[] {
  const d = data as { results?: Remix[] }
  return d?.results?.filter((token: Remix) => !HIDDEN_TRENDING_REMIXES.includes(token.id)) ?? []
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function remixListNeedsSparklineHeal(remixes: Remix[]) {
  return remixes.some((r) => !r.price_7d?.length)
}

/**
 * Remix list payloads sometimes ship with empty price_7d while GET /ohlcv still has
 * candles (cold or inconsistent OHLCV read-cache vs populatePrice7d). Warming
 * /ohlcv for affected tokens then refetching the list usually aligns them.
 *
 * Runs only when at least one row is missing price_7d; uses short bounded backoff
 * so typical requests pay no extra latency.
 */
export async function fetchRemixListThenHealSparklinesIfNeeded(
  apiBaseUrl: string,
  listFetchUrl: string,
  parse: (json: unknown) => Remix[],
  initialInit?: RequestInit
): Promise<Remix[]> {
  const base = apiBaseUrl.replace(/\/+$/, "")
  const res = await fetch(listFetchUrl, initialInit ?? { next: { revalidate: 30 } })
  const first = parse(await res.json())
  if (!remixListNeedsSparklineHeal(first)) return first

  const need = first.filter((r) => !r.price_7d?.length)
  await Promise.all(
    need.map((r) =>
      fetch(
        `${base}/ohlcv?token_address=${encodeURIComponent(r.token_address)}&interval_type=240min&limit=42`,
        { cache: "no-store" }
      ).catch(() => null)
    )
  )

  const refetch = async () => {
    const r = await fetch(listFetchUrl, { cache: "no-store" })
    return parse(await r.json())
  }

  const delaysMs = [120, 280, 550]
  for (const ms of delaysMs) {
    await sleep(ms)
    const retry = await refetch()
    if (!remixListNeedsSparklineHeal(retry)) return retry
  }

  return refetch()
}
