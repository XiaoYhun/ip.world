"use client"

import { useMemo, useRef } from "react"
import { useAccount } from "@/hooks/use-account"
import type { SwapRow } from "@/hooks/use-token-swaps"

const WRAPPED_IP = "0x1514000000000000000000000000000000000000"

export type SwapsPnl = {
  totalBoughtUsd: number
  totalSoldUsd: number
  totalQuantityBought: number
  totalQuantitySold: number
  netQuantity: number
  swapCount: number
}

/**
 * Compute PnL from a shared swaps stream.
 * Filters by connected wallet client-side.
 * Expects swaps from useTokenSwaps() — one shared shape per token.
 */
export function useSwapsPnl(swaps: SwapRow[]) {
  const { address } = useAccount()

  const stickyAddress = useRef<string>("")
  if (address) {
    stickyAddress.current = address.toLowerCase()
  }
  const normalizedUser = stickyAddress.current

  const pnl = useMemo<SwapsPnl | null>(() => {
    if (!normalizedUser || swaps.length === 0) return null

    let totalBoughtUsd = 0
    let totalSoldUsd = 0
    let totalQuantityBought = 0
    let totalQuantitySold = 0
    let count = 0

    for (const swap of swaps) {
      if (swap.origin.toLowerCase() !== normalizedUser) continue

      const usd = Math.abs(Number(swap.amount_usd) || 0)
      const isBuy = swap.is_buy === true || swap.is_buy === "true"

      const token0Lower = swap.token_0.toLowerCase()
      const isToken0IP = token0Lower === WRAPPED_IP
      const tokenQty = Math.abs(Number(isToken0IP ? swap.amount_1 : swap.amount_0) || 0)

      if (isBuy) {
        totalBoughtUsd += usd
        totalQuantityBought += tokenQty
      } else {
        totalSoldUsd += usd
        totalQuantitySold += tokenQty
      }
      count++
    }

    if (count === 0) return null

    return {
      totalBoughtUsd,
      totalSoldUsd,
      totalQuantityBought,
      totalQuantitySold,
      netQuantity: totalQuantityBought - totalQuantitySold,
      swapCount: count,
    }
  }, [swaps, normalizedUser])

  return { pnl }
}
