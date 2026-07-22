"use client"

import { useMemo } from "react"
import type { SwapRow } from "@/hooks/use-token-swaps"

const WRAPPED_IP = (process.env.NEXT_PUBLIC_WRAPPED_IP_TOKEN_ADDRESS ?? "0x1514000000000000000000000000000000000000").toLowerCase()

type TimeframeMetrics = {
  buyCount: number
  sellCount: number
  buyVolumeUsd: number
  sellVolumeUsd: number
  priceChange: number | null
}

export type LiveTradingMetrics = {
  "5m": TimeframeMetrics
  "1h": TimeframeMetrics
  "6h": TimeframeMetrics
  "24h": TimeframeMetrics
}

function isBuy(swap: SwapRow): boolean {
  if (swap.token_0.toLowerCase() === WRAPPED_IP) {
    return parseFloat(swap.amount_0) > 0
  }
  if (swap.token_1.toLowerCase() === WRAPPED_IP) {
    return parseFloat(swap.amount_1) > 0
  }
  return false
}

/**
 * Derive token/IP price ratio from sqrt_price_x96.
 * Returns tokens-per-IP (IP price cancels out when computing % change).
 */
function swapPriceRatio(swap: SwapRow): number | null {
  if (!swap.sqrt_price_x96) return null
  try {
    const sqrtPriceX96 = BigInt(swap.sqrt_price_x96)
    if (sqrtPriceX96 === 0n) return null

    const Q192 = 1n << 192n
    const SCALE = 10n ** 18n
    const sqrtPriceSq = sqrtPriceX96 * sqrtPriceX96

    const isToken0IP = swap.token_0.toLowerCase() === WRAPPED_IP
    // tokensPerWIP: how many memecoins per 1 wrapped IP
    let tokensPerWIPScaled: bigint
    if (isToken0IP) {
      // token1 is memecoin, token0 is IP → ratio = sqrtPriceSq / Q192
      tokensPerWIPScaled = (sqrtPriceSq * SCALE) / Q192
    } else {
      // token0 is memecoin, token1 is IP → ratio = Q192 / sqrtPriceSq
      tokensPerWIPScaled = (Q192 * SCALE) / sqrtPriceSq
    }

    const ratio = Number(tokensPerWIPScaled) / 1e18
    // Price per token ∝ 1/ratio (fewer tokens per IP = higher token price)
    return ratio > 0 ? 1 / ratio : null
  } catch {
    return null
  }
}

function computeMetrics(swaps: SwapRow[], windowMs: number, now: number, fallbackBaselineRatio?: number | null): TimeframeMetrics {
  const cutoff = (now - windowMs) / 1000

  let buyCount = 0
  let sellCount = 0
  let buyVolumeUsd = 0
  let sellVolumeUsd = 0

  // Track prices: latest + earliest in window, and baseline (last swap before cutoff)
  let latestRatio: number | null = null
  let latestTs = -Infinity
  let earliestRatio: number | null = null
  let earliestTs = Infinity
  let baselineRatio: number | null = null
  let baselineTs = -Infinity

  for (const swap of swaps) {
    const ts = Number(swap.timestamp)

    if (ts >= cutoff) {
      // Inside the window — count volumes
      const usd = Math.abs(parseFloat(swap.amount_usd || "0"))
      if (isBuy(swap)) {
        buyCount++
        buyVolumeUsd += usd
      } else {
        sellCount++
        sellVolumeUsd += usd
      }

      const ratio = swapPriceRatio(swap)
      if (ratio !== null) {
        if (ts >= latestTs) {
          latestTs = ts
          latestRatio = ratio
        }
        if (ts <= earliestTs) {
          earliestTs = ts
          earliestRatio = ratio
        }
      }
    } else {
      // Before the window — find the most recent swap as baseline
      const ratio = swapPriceRatio(swap)
      if (ratio !== null && ts >= baselineTs) {
        baselineTs = ts
        baselineRatio = ratio
      }
    }
  }

  // Prefer: 1) swap before window, 2) fallback from token_metrics/start_tick, 3) earliest swap in window
  const referenceRatio = baselineRatio ?? (fallbackBaselineRatio && fallbackBaselineRatio > 0 ? fallbackBaselineRatio : null) ?? earliestRatio
  let priceChange: number | null = null
  if (latestRatio !== null && referenceRatio !== null && referenceRatio > 0 && latestRatio !== referenceRatio) {
    priceChange = ((latestRatio - referenceRatio) / referenceRatio) * 100
  }

  return { buyCount, sellCount, buyVolumeUsd, sellVolumeUsd, priceChange }
}

/**
 * Compute live trading metrics from a shared swaps stream.
 * Buckets swaps into 5m/1h/6h/24h timeframes client-side.
 * Expects swaps from useTokenSwaps() — one shared shape per token.
 * 
 * @param fallbackBaselineRatio Optional price ratio (1/tokensPerIP) to use as baseline
 *   when no swap exists before the window (e.g. starting pool price from token_metrics).
 */
export function useLiveTradingMetrics(swaps: SwapRow[], fallbackBaselineRatio?: number | null): LiveTradingMetrics | null {
  return useMemo(() => {
    if (swaps.length === 0) return null

    const now = Date.now()
    return {
      "5m": computeMetrics(swaps, 5 * 60 * 1000, now, fallbackBaselineRatio),
      "1h": computeMetrics(swaps, 60 * 60 * 1000, now, fallbackBaselineRatio),
      "6h": computeMetrics(swaps, 6 * 60 * 60 * 1000, now, fallbackBaselineRatio),
      "24h": computeMetrics(swaps, 24 * 60 * 60 * 1000, now, fallbackBaselineRatio),
    }
  }, [swaps, fallbackBaselineRatio])
}
