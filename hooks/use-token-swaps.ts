"use client"

import { useMemo } from "react"
import { useShape } from "@electric-sql/react"

import { env } from "@/config"

const WRAPPED_IP = "0x1514000000000000000000000000000000000000"

/** Only the columns needed by PnL + trading metrics consumers (id required as PK by Electric) */
const swapColumns = [
  "id",
  "amount_0",
  "amount_1",
  "amount_usd",
  "is_buy",
  "origin",
  "timestamp",
  "token_0",
  "token_1",
  "created_at",
  "sqrt_price_x96",
  "tick",
  "transaction",
] as const

export type SwapRow = {
  id: string
  amount_0: string
  amount_1: string
  amount_usd: string
  is_buy: boolean | string
  origin: string
  timestamp: string
  token_0: string
  token_1: string
  created_at: string
  sqrt_price_x96: string
  tick: string
  transaction: string
}

/**
 * Single shared shape for ALL swaps of a given token.
 * Shared across all viewers of the same token page.
 *
 * Uniswap V3 pool ordering is alphanumeric on address,
 * so we determine which column (token_0 or token_1) the
 * memecoin lives in and filter on that single column.
 *
 * Consumer hooks (PnL, trading metrics) filter client-side.
 */
/** Cutoff for the shape: only sync swaps from the last 24 hours. */
const SHAPE_WINDOW_MS = 24 * 60 * 60 * 1000

export function useTokenSwaps(tokenAddress?: string) {
  const addr = tokenAddress?.toLowerCase() ?? ""

  // Determine which column the token is in based on alphanumeric ordering
  const isToken0 = addr < WRAPPED_IP
  const column = isToken0 ? "token_0" : "token_1"

  // Stable cutoff: recompute only every 5 minutes so the shape key doesn't
  // churn on every render (Electric treats different where clauses as
  // different shapes).
  const cutoffEpoch = useMemo(() => {
    const bucket = Math.floor(Date.now() / (5 * 60 * 1000))
    return Math.floor((bucket * 5 * 60 * 1000 - SHAPE_WINDOW_MS) / 1000)
  }, [])

  const hasParams = !!addr
  const { data, isLoading } = useShape<SwapRow>({
    url: env.NEXT_PUBLIC_METRICS_SYNC_CLOUDFLARE_URL,
    params: {
      table: "swaps",
      columns: swapColumns as unknown as string[],
      where: `${column} = '${addr}' AND timestamp > '${cutoffEpoch}'`,
    },
    ...(!hasParams ? { signal: AbortSignal.abort() } : {}),
  })

  return { swaps: data ?? [], isLoading }
}
