import { useMemo } from "react"
import { Remix } from "@/types/remix"
import { formatNumberWithSuffix } from "@/lib/number"
import { useTokenMetricsLive } from "@/hooks/use-token-metrics"

/**
 * Returns live market_cap, volume_24h, liquidity, graduation_progress, and market_cap_change_24h for a specific token.
 * Uses useTokenMetricsLive which subscribes to the shared Electric stream with a narrow per-token
 * selector — this component only re-renders when THIS token's data changes, not on every
 * Electric tick for any token.
 *
 * All financial data comes from token_metrics (seeded at deployment, updated by hot/warm paths).
 * Fallback chain: Electric live value → REST remix endpoint (which JOINs token_metrics).
 */
export function useTokenMetricsForAddress(remix: Remix) {
  const liveMetrics = useTokenMetricsLive(remix.token_address)

  return useMemo(() => {
    if (!liveMetrics)
      return {
        market_cap: formatNumberWithSuffix(remix.market_cap || 0),
        volume_24h: formatNumberWithSuffix(remix.daily_volume || 0),
        liquidity: formatNumberWithSuffix(remix.pool_size || 0),
        graduation_progress: remix.graduation_progress || 0,
        market_cap_change_24h: remix.market_cap_change || 0,
        price_change_24h: remix.price_usd_change || 0,
        reward_chest_usd: remix.reward_chest_usd || 0,
      }

    const total_market_cap_usd_num = parseFloat(liveMetrics.total_market_cap_usd || "0")
    const volume_24h_usd_num = parseFloat(liveMetrics.volume_24h_usd || "0")

    return {
      market_cap: formatNumberWithSuffix(total_market_cap_usd_num || remix.market_cap || 0),
      volume_24h: formatNumberWithSuffix(volume_24h_usd_num || 0),
      liquidity: liveMetrics.total_value_locked_usd
        ? formatNumberWithSuffix(parseFloat(liveMetrics.total_value_locked_usd))
        : formatNumberWithSuffix(remix.pool_size || 0),
      graduation_progress: liveMetrics.graduation_progress || remix.graduation_progress || 0,
      market_cap_change_24h: liveMetrics.market_cap_change_24h || 0,
      price_change_24h: liveMetrics.price_change_24h || 0,
      reward_chest_usd: liveMetrics.reward_chest_usd || 0,
    }
  }, [liveMetrics, remix])
}
