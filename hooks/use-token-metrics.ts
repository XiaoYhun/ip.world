"use client"

import { useShape } from "@electric-sql/react"
import { useMemo } from "react"

import { env } from "@/config"
import {
  metricsColumns,
  homepageColumns,
  selectTokenMetricsSchema,
  TokenMetrics,
} from "@/lib/schema/token-metrics-schema"

const allColumns = metricsColumns as unknown as string[]
const leanColumns = homepageColumns as unknown as string[]

const SHARED_SHAPE_PARAMS = {
  url: env.NEXT_PUBLIC_METRICS_SYNC_CLOUDFLARE_URL,
  params: {
    table: "token_metrics",
    columns: leanColumns,
    where: "volume_24h_usd IS NOT NULL AND volume_24h_usd > 0",
  },
} as const

function extractRows(result: unknown): unknown[] {
  return Array.isArray(result) ? result : ((result as any)?.data ?? [])
}

export function useWatchTokenMetrics() {
  // Streams the entire token_metrics table as a single shared shape.
  // Electric SQL deduplicates this stream across all useShape callers
  // with identical URL+params, so there is only one HTTP connection.
  const tokenMetrics = useShape({
    ...SHARED_SHAPE_PARAMS,
    selector: (result) => extractRows(result),
  })
  const validatedData = useMemo(() => {
    return (tokenMetrics as unknown[])
      ?.map((row) => {
        const parsed = selectTokenMetricsSchema.safeParse(row)
        return parsed.success ? parsed.data : null
      })
      .filter((row): row is TokenMetrics => row !== null)
  }, [tokenMetrics])
  return validatedData as TokenMetrics[]
}

/**
 * Returns live metrics for a single token address from the shared all-tokens stream.
 * Electric SQL's selector deep-equality check ensures this component only re-renders
 * when THIS specific token's data changes, even though the underlying stream carries
 * all tokens.
 */
export function useTokenMetricsLive(tokenAddress: string): TokenMetrics | undefined {
  const addr = tokenAddress.toLowerCase()
  return useShape({
    ...SHARED_SHAPE_PARAMS,
    selector: (result) => {
      const row = extractRows(result).find((r: any) => r.token_address?.toLowerCase() === addr)
      if (!row) return undefined
      const parsed = selectTokenMetricsSchema.safeParse(row)
      return parsed.success ? parsed.data : undefined
    },
  }) as TokenMetrics | undefined
}

/**
 * Returns metrics for a specific token address using direct Electric SQL
 */
export function useWatchTokenMetricsByAddress(tokenAddress: string): {
  data?: TokenMetrics
  isLoading: boolean
  isError: boolean
} {
  const {
    data: tokenMetrics,
    isLoading,
    error,
  } = useShape({
    url: env.NEXT_PUBLIC_METRICS_SYNC_CLOUDFLARE_URL,
    params: {
      table: "token_metrics",
      columns: allColumns,
      where: `token_address = '${tokenAddress.toLowerCase()}'`,
    },
  })

  const validatedData = useMemo(() => {
    const row = tokenMetrics?.[0]
    if (!row) return undefined
    const parsed = selectTokenMetricsSchema.safeParse(row)
    return parsed.success ? parsed.data : undefined
  }, [tokenMetrics])

  return {
    data: validatedData,
    isLoading,
    isError: !!error,
  }
}

/**
 * Hook to get refresh function for token metrics
 * Note: Electric SQL handles real-time updates automatically, so refresh is not needed
 */
export function useRefreshTokenMetrics() {
  // Electric SQL automatically syncs in real-time, so we return a no-op function
  return () => {
    console.log("Electric SQL handles real-time updates automatically")
  }
}
