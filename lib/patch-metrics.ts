import { formatNumber, formatNumberWithSuffix } from "@/lib/number"
import { TokenMetrics, TokenMetricsPatched } from "@/lib/schema/token-metrics-schema"

const fallbackPrice = 2
const decimals = 8

export function patchSingleMetric(rawMetrics: TokenMetrics, priceData: number | undefined): TokenMetricsPatched {
  if (!priceData) {
    return {
      ...rawMetrics,
      price_usd: formatNumber(rawMetrics?.price_usd || "0", decimals),
      total_market_cap_usd_int: parseInt(rawMetrics?.total_market_cap_usd || "0", 10),
      total_market_cap_usd: formatNumberWithSuffix(parseInt(rawMetrics?.total_market_cap_usd || "0", 10)),
      total_value_locked_usd: formatNumberWithSuffix(parseInt(rawMetrics?.total_value_locked_usd || "0", 10)),
      volume_usd: formatNumberWithSuffix(parseInt(rawMetrics?.volume_usd || "0", 10)),
      volume_usd_int: parseInt(rawMetrics?.volume_usd || "0", 10),
      volume_24h_usd_int: parseInt(rawMetrics?.volume_24h_usd || "0", 10),
      price_change_5m_pct: rawMetrics?.price_change_5m ?? 0,
      price_change_1h_pct: rawMetrics?.price_change_1h ?? 0,
      price_change_6h_pct: rawMetrics?.price_change_6h ?? 0,
    } as TokenMetricsPatched
  }

  const displayPrice = priceData ?? fallbackPrice
  const marketCapUsdInt = parseInt(rawMetrics?.total_market_cap_ip ?? "0", 10) * displayPrice
  const volumeUsdInt = parseInt(rawMetrics?.volume_usd || "0", 10)

  return {
    ...rawMetrics,
    price_usd: formatNumber(parseFloat(rawMetrics?.price_ip ?? "0") * displayPrice, decimals),
    volume_usd: formatNumberWithSuffix(parseInt(rawMetrics?.volume_ip ?? "0", 10) * displayPrice),
    total_market_cap_usd_int: marketCapUsdInt,
    total_market_cap_usd: formatNumberWithSuffix(marketCapUsdInt),
    total_value_locked_usd: formatNumberWithSuffix(
      parseInt(rawMetrics?.total_value_locked_ip ?? "0", 10) * displayPrice
    ),
    volume_usd_int: volumeUsdInt,
    volume_24h_usd_int: parseInt(rawMetrics?.volume_24h_usd || "0", 10),
    price_change_5m_pct: rawMetrics?.price_change_5m ?? 0,
    price_change_1h_pct: rawMetrics?.price_change_1h ?? 0,
    price_change_6h_pct: rawMetrics?.price_change_6h ?? 0,
  } as TokenMetricsPatched
}
