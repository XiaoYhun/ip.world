"use client"

import { useEffect, useLayoutEffect, useRef } from "react"
import type { PaymentCurrency } from "@/config/relay-chains"
import {
  detectBalanceInflow,
  type BalanceInflowDetectMode,
  type RawBalanceSnapshot,
} from "@/lib/detect-balance-inflow"
import { useNavAssetBalances } from "@/hooks/use-nav-asset-balances"
import { useRefreshAllBalances } from "@/hooks/use-refresh-all-balances"

export interface UseBalanceInflowWatchOptions {
  enabled: boolean
  pollIntervalMs: number
  detectMode: BalanceInflowDetectMode
  onInflow: (currency: PaymentCurrency) => void
  ipPriceUsd?: number
  solPriceUsd?: number
  /** Delay before first baseline after `enabled` (ms). */
  baselineDelayMs?: number
}

export function useBalanceInflowWatch(options: UseBalanceInflowWatchOptions) {
  const { enabled, pollIntervalMs, detectMode, ipPriceUsd, solPriceUsd, baselineDelayMs = 400 } = options
  const { fetchFreshSnapshot } = useNavAssetBalances()
  const { refreshAllBalances } = useRefreshAllBalances()

  const baselineRef = useRef<RawBalanceSnapshot | null>(null)
  const onInflowRef = useRef(options.onInflow)
  const pricesRef = useRef({ ipPriceUsd, solPriceUsd })
  const detectModeRef = useRef(detectMode)

  useLayoutEffect(() => {
    onInflowRef.current = options.onInflow
    pricesRef.current = { ipPriceUsd, solPriceUsd }
    detectModeRef.current = detectMode
  }, [options.onInflow, ipPriceUsd, solPriceUsd, detectMode])

  useEffect(() => {
    if (!enabled) {
      baselineRef.current = null
      return
    }

    let cancelled = false
    let firstTickTimeout: ReturnType<typeof setTimeout> | null = null

    const tick = async () => {
      if (cancelled) return
      const base = baselineRef.current
      if (base === null) return

      let next: RawBalanceSnapshot
      try {
        next = await fetchFreshSnapshot()
      } catch {
        return
      }
      if (cancelled) return

      const { ipPriceUsd: ipP, solPriceUsd: solP } = pricesRef.current
      const currency = detectBalanceInflow(base, next, {
        mode: detectModeRef.current,
        ipPriceUsd: ipP,
        solPriceUsd: solP,
      })

      if (currency) {
        baselineRef.current = next
        onInflowRef.current(currency)
        void refreshAllBalances()
      }
    }

    const captureBaseline = async () => {
      if (baselineDelayMs > 0) {
        await new Promise((r) => setTimeout(r, baselineDelayMs))
      }
      if (cancelled) return
      baselineRef.current = await fetchFreshSnapshot()
      if (!cancelled) {
        firstTickTimeout = setTimeout(() => void tick(), 150)
      }
    }

    void captureBaseline()

    const id = setInterval(() => void tick(), pollIntervalMs)
    return () => {
      cancelled = true
      clearInterval(id)
      if (firstTickTimeout) clearTimeout(firstTickTimeout)
    }
  }, [enabled, pollIntervalMs, baselineDelayMs, fetchFreshSnapshot, refreshAllBalances])
}

