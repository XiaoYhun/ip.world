"use client"

import { useCallback, useEffect, useLayoutEffect, useRef } from "react"
import { usePaymentCurrency } from "@/context/payment-currency-context"
import { useIpPrice } from "@/context/token-metrics-context"
import useGetSolPrice from "@/hooks/use-get-sol-price"
import { useAccount } from "@/hooks/use-account"
import { useEmbeddedWallets } from "@/hooks/use-embedded-wallets"
import { useNavAssetBalances } from "@/hooks/use-nav-asset-balances"
import { useRefreshAllBalances } from "@/hooks/use-refresh-all-balances"
import {
  detectBalanceInflow,
  type RawBalanceSnapshot,
} from "@/lib/detect-balance-inflow"

const AMBIENT_POLL_MS = 75_000

/**
 * On window focus, tab visibility, and a slow interval: detect single-asset balance
 * increases and align payment currency + refresh balances (conservative vs swaps).
 */
export function BalanceInflowWatcher() {
  const { setPaymentCurrency } = usePaymentCurrency()
  const ipPriceUsd = useIpPrice()
  const { data: solPriceUsd } = useGetSolPrice()
  const { address } = useAccount()
  const { evmAddress, solanaAddress } = useEmbeddedWallets()
  const { fetchFreshSnapshot } = useNavAssetBalances()
  const { refreshAllBalances } = useRefreshAllBalances()

  const lastRef = useRef<RawBalanceSnapshot | null>(null)
  const hasWallet = !!(address || evmAddress || solanaAddress)
  const pricesRef = useRef({ ip: ipPriceUsd, sol: solPriceUsd })

  useLayoutEffect(() => {
    pricesRef.current = { ip: ipPriceUsd, sol: solPriceUsd }
  }, [ipPriceUsd, solPriceUsd])

  const runCheck = useCallback(async () => {
    if (!hasWallet) return
    if (typeof document !== "undefined" && document.hidden) return

    let next: RawBalanceSnapshot
    try {
      next = await fetchFreshSnapshot()
    } catch {
      return
    }

    const prev = lastRef.current
    lastRef.current = next
    if (prev === null) return

    const { ip, sol } = pricesRef.current
    const currency = detectBalanceInflow(prev, next, {
      mode: "ambient",
      ipPriceUsd: ip > 0 ? ip : undefined,
      solPriceUsd: sol > 0 ? sol : undefined,
    })

    if (currency) {
      setPaymentCurrency(currency)
      void refreshAllBalances()
    }
  }, [fetchFreshSnapshot, hasWallet, refreshAllBalances, setPaymentCurrency])

  useEffect(() => {
    if (!hasWallet) {
      lastRef.current = null
      return
    }

    let cancelled = false
    const prime = async () => {
      try {
        const snap = await fetchFreshSnapshot()
        if (!cancelled) lastRef.current = snap
      } catch {
        /* noop */
      }
    }
    void prime()

    const onVisible = () => {
      if (document.visibilityState === "visible") void runCheck()
    }
    const onFocus = () => void runCheck()

    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onVisible)
    const interval = setInterval(() => {
      if (!document.hidden) void runCheck()
    }, AMBIENT_POLL_MS)

    return () => {
      cancelled = true
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onVisible)
      clearInterval(interval)
    }
  }, [hasWallet, fetchFreshSnapshot, runCheck])

  return null
}
