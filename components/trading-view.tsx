"use client"

import { memo } from "react"
import { env } from "@/config"
import TradingViewAdvancedChart from "./tradingview-advanced-chart"
import { useChartPriceUnit } from "@/hooks/use-chart-price-unit"

function TradingViewWidget({
  tokenAddress,
  tokenSymbol,
  hideLeftToolbar,
}: {
  tokenAddress: string
  tokenSymbol: string
  hideLeftToolbar?: boolean
}) {
  const { unit, setUnit, priceMultiplier, chartDisplayUnit } = useChartPriceUnit(tokenAddress, false)

  const ELECTRIC_CONFIG = {
    url: env.NEXT_PUBLIC_METRICS_SYNC_CLOUDFLARE_URL,
    // No sourceId, no sourceSecret
  }

  const displaySymbol =
    chartDisplayUnit === "mcap" ? `$${tokenSymbol} MCap` : `$${tokenSymbol}/USD`

  const wrappedIp = "0x1514000000000000000000000000000000000000"
  const token = String(tokenAddress).toLowerCase()
  // Distinct TV symbol when MCap vs price so saved chart state / pricescale cannot desync and hide series.
  const chartSymbol =
    chartDisplayUnit === "mcap" ? `${wrappedIp}_mcap/${token}` : `${wrappedIp}/${token}`

  return (
    <TradingViewAdvancedChart
      key={`${tokenAddress}-${chartDisplayUnit}-${priceMultiplier}`}
      displaySymbol={displaySymbol}
      symbol={chartSymbol}
      electricConfig={ELECTRIC_CONFIG}
      interval={"15"}
      hideLeftToolbar={hideLeftToolbar}
      priceMultiplier={priceMultiplier}
      chartUnit={unit}
      onChartUnitChange={setUnit}
    />
  )
}

export default memo(TradingViewWidget)
