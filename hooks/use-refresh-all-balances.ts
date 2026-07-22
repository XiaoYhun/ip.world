"use client"

import { useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useNavAssetBalances } from "@/hooks/use-nav-asset-balances"

/**
 * Centralized hook to refresh ALL balance-related data across the app.
 *
 * - Invalidates wagmi + API queries with `refetchType: "all"` so inactive observers
 *   (e.g. navbar `useBalance` while focus is on the trade panel) still refetch.
 * - Calls `useNavAssetBalances().refetch()` so the exact IP + SOL + Story USDC pipeline
 *   used by the nav bar runs immediately (same as explicit per-hook refetch).
 * - API token holdings ("token-balances") and profile holdings ("profile-holdings").
 *
 * Call this after ANY transaction that moves value:
 *  deposits, exchanges, withdrawals, trades, relay trades, IP creation, claims, etc.
 */
export function useRefreshAllBalances() {
  const queryClient = useQueryClient()
  const { refetch: refetchNavAssetBalances } = useNavAssetBalances()

  const refreshAllBalances = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["balance"], refetchType: "all" }),
      queryClient.invalidateQueries({ queryKey: ["readContract"], refetchType: "all" }),
      queryClient.invalidateQueries({ queryKey: ["readContracts"], refetchType: "all" }),
      queryClient.invalidateQueries({ queryKey: ["token-balances"], refetchType: "all" }),
      queryClient.invalidateQueries({ queryKey: ["profile-holdings"], refetchType: "all" }),
      refetchNavAssetBalances(),
    ])
    // Solana public RPCs often return the previous balance on the first poll right after a tx.
    void (async () => {
      await new Promise((r) => setTimeout(r, 500))
      await refetchNavAssetBalances()
    })()
  }, [queryClient, refetchNavAssetBalances])

  return { refreshAllBalances }
}
