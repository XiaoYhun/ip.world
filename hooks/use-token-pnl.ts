"use client"

import { useCallback, useMemo } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { fetchJSONWithAuth } from "@/lib/client/fetcher"
import { useAccount } from "@/hooks/use-account"
import { useIsLoggedIn } from "@/lib/dynamic"
import { getAPIRootUrl } from "@/lib/utils"
import type { SwapRow } from "@/hooks/use-token-swaps"

const WRAPPED_IP = "0x1514000000000000000000000000000000000000"

export type TokenPnlResponse = {
  token_address: string
  total_quantity: string
  total_quantity_bought: string
  total_quantity_sold: string
  average_buy_price_ip: string
  average_sell_price_ip: string
  current_price_ip: number
  total_bought_usd: string
  total_sold_usd: string
  open_cost_basis_usd: string
  total_holding_usd: string
  held_since: string | null
  realized_pnl_ip: string
  realized_pnl_usd: string
  unrealized_pnl_ip: string
  unrealized_pnl_usd: string
  total_pnl_ip: string
  pnl_usd: string
  pnl_percentage: string
}

/**
 * PnL for the logged-in user on a specific token.
 *
 * 1. Fetch baseline from /pnl endpoint on page load.
 * 2. Accumulate user's new swaps from the 24h Electric shape on top.
 * 3. Recompute holdings value from live price so PnL reflects price movement.
 *
 * Pass the full swaps array from the shape — this hook filters to user's
 * swaps and only counts ones newer than the endpoint snapshot.
 */
export function useTokenPnl(tokenAddress?: string, swaps?: SwapRow[], livePriceUsd?: number) {
  const { address } = useAccount()
  const queryClient = useQueryClient()
  const isLoggedIn = useIsLoggedIn()
  const normalizedTokenAddress = tokenAddress?.toLowerCase()
  const normalizedAddress = address?.toLowerCase()
  const queryKey = useMemo(
    () => ["token-pnl", normalizedTokenAddress, normalizedAddress] as const,
    [normalizedTokenAddress, normalizedAddress]
  )

  const { data, isLoading, dataUpdatedAt } = useQuery<TokenPnlResponse>({
    queryKey,
    queryFn: () =>
      fetchJSONWithAuth(`${getAPIRootUrl()}/users/tokens/${tokenAddress}/pnl`),
    enabled: !!tokenAddress && !!address && isLoggedIn,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: 2,
  })

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey })
  }, [queryClient, queryKey])

  // Baseline from endpoint + overlay user's swaps from shape that arrived after fetch.
  // The endpoint returns lifetime totals from user_token_position.
  const pnl = useMemo(() => {
    if (!data) return null

    let totalBoughtUsd = parseFloat(data.total_bought_usd) || 0
    let totalSoldUsd = parseFloat(data.total_sold_usd) || 0
    let quantity = parseFloat(data.total_quantity) || 0

    // Layer on user's swaps from the 24h shape that arrived AFTER the endpoint fetch
    if (swaps && address) {
      const userAddr = address.toLowerCase()
      const fetchTime = dataUpdatedAt / 1000 // epoch seconds

      for (const swap of swaps) {
        if (swap.origin.toLowerCase() !== userAddr) continue
        const swapTime = Number(swap.timestamp)
        // Only count swaps newer than endpoint fetch (with 5s buffer for clock drift)
        if (swapTime <= fetchTime - 5) continue

        const usd = Math.abs(Number(swap.amount_usd) || 0)
        const isBuy = swap.is_buy === true || swap.is_buy === "true"

        // Determine token quantity from the swap
        const isToken0IP = swap.token_0.toLowerCase() === WRAPPED_IP
        const tokenAmount = Math.abs(Number(isToken0IP ? swap.amount_1 : swap.amount_0) || 0)

        if (isBuy) {
          totalBoughtUsd += usd
          quantity += tokenAmount
        } else {
          totalSoldUsd += usd
          quantity = Math.max(0, quantity - tokenAmount)
        }
      }
    }

    // Holdings = current quantity × live price (falls back to endpoint snapshot)
    const holdingValueUsd = livePriceUsd && livePriceUsd > 0
      ? quantity * livePriceUsd
      : parseFloat(data.total_holding_usd) || 0

    // PnL = sold + current holdings - bought
    const netPnlUsd = totalSoldUsd + holdingValueUsd - totalBoughtUsd
    const pnlPercent = totalBoughtUsd > 0 ? (netPnlUsd / totalBoughtUsd) * 100 : 0

    if (totalBoughtUsd === 0 && totalSoldUsd === 0) return null

    return {
      totalBoughtUsd,
      totalSoldUsd,
      holdingValueUsd,
      currentQuantityTokens: quantity,
      netPnlUsd,
      pnlPercent,
      openedAt: data.held_since,
      swapCount: 1,
      boughtQtyTokens: parseFloat(data.total_quantity_bought) || 0,
      soldQtyTokens: parseFloat(data.total_quantity_sold) || 0,
    }
  }, [data, dataUpdatedAt, swaps, address, livePriceUsd])

  return { pnl, isLoading, invalidate }
}
