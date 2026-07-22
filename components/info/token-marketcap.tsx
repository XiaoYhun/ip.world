"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { Address } from "viem"
import { useTokenMetricsLive } from "@/hooks/use-token-metrics"
import { formatNumber } from "@/lib/number"

const VisualizedDelta = dynamic(() => import("../visualized-delta"))

const TokenMarketcap = ({ tokenAddress }: { tokenAddress: Address }) => {
  const [isMounted, setIsMounted] = useState(false)
  const tokenMetrics = useTokenMetricsLive(tokenAddress)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted || !tokenMetrics) {
    return <TokenMarketcapFallback /> // Return nothing during SSR and initial hydration
  }

  return (
    <div className="flex items-center">
      <VisualizedDelta scramble dollar>
        {formatNumber(Number(tokenMetrics.total_market_cap_usd), 2, true)}
      </VisualizedDelta>
    </div>
  )
}

export const TokenMarketcapFallback = () => {
  return <p className="text-primary/50 animate-pulse text-xs">...loading mcap</p>
}

export default TokenMarketcap
