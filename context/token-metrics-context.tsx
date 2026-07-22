"use client"

import { createContext, ReactNode, useContext, useMemo } from "react"
import useGetPrice from "@/hooks/use-get-price"
import { useRefreshTokenMetrics, useWatchTokenMetrics, useWatchTokenMetricsByAddress } from "@/hooks/use-token-metrics"
import { patchSingleMetric } from "@/lib/patch-metrics"
import { TokenMetrics, type TokenMetricsPatched } from "@/lib/schema/token-metrics-schema"

type TokenMetricsContextType = {
  metrics: Map<string, TokenMetricsPatched>
  ipPrice: number
  mutateIpPrice: () => void
  refreshTokenMetrics: () => void
}

const TokenMetricsContext = createContext<TokenMetricsContextType | undefined>({
  metrics: new Map(),
  ipPrice: 0,
  mutateIpPrice: () => {},
  refreshTokenMetrics: () => {},
})

export function TokenMetricsProvider({ children }: { children: ReactNode }) {
  const rawMetrics = useWatchTokenMetrics()
  const { data: ipPrice, mutate: mutateIpPrice } = useGetPrice()
  const refreshTokenMetrics = useRefreshTokenMetrics()

  const patchedMetrics = useMemo(() => {
    const patchedMap = new Map<string, TokenMetricsPatched>()
    if (!rawMetrics) return patchedMap

    rawMetrics.forEach((metrics) => {
      const tokenMetrics = metrics as TokenMetrics
      patchedMap.set(tokenMetrics.token_address, patchSingleMetric(tokenMetrics, ipPrice))
    })
    return patchedMap
  }, [rawMetrics, ipPrice])

  return (
    <TokenMetricsContext.Provider
      value={{
        metrics: patchedMetrics,
        ipPrice,
        mutateIpPrice,
        refreshTokenMetrics,
      }}
    >
      {children}
    </TokenMetricsContext.Provider>
  )
}

export function useTokenMetrics() {
  const context = useContext(TokenMetricsContext)
  if (!context) throw new Error("useTokenMetrics must be used within a TokenMetricsProvider")
  return context.metrics
}

export function useIpPrice() {
  const context = useContext(TokenMetricsContext)
  if (!context) throw new Error("useIpPrice must be used within a TokenMetricsProvider")
  return context.ipPrice
}

export function useMutateIpPrice() {
  const context = useContext(TokenMetricsContext)
  if (!context) throw new Error("useMutateIpPrice must be used within a TokenMetricsProvider")
  return context.mutateIpPrice
}

export function useRefreshTokenMetricsContext() {
  const context = useContext(TokenMetricsContext)
  if (!context) throw new Error("useRefreshTokenMetricsContext must be used within a TokenMetricsProvider")
  return context.refreshTokenMetrics
}

type TokenMetricsByAddressContextType = {
  metrics: TokenMetricsPatched | undefined
  isLoading: boolean
  isError: boolean
}

const TokenMetricsByAddressContext = createContext<TokenMetricsByAddressContextType | undefined>({
  metrics: undefined,
  isLoading: false,
  isError: false,
})

export function TokenMetricsByAddressProvider({
  children,
  address,
  initialTokenMetrics,
}: {
  children: ReactNode
  address: string
  initialTokenMetrics?: TokenMetrics
}) {
  const {
    data: rawMetrics,
    isLoading: isLoadingMetrics,
    isError: isErrorMetrics,
  } = useWatchTokenMetricsByAddress(address)
  const { data: ipPrice } = useGetPrice()

  const metrics = useMemo(() => rawMetrics || initialTokenMetrics, [rawMetrics, initialTokenMetrics])

  const patchedMetrics = useMemo(() => {
    if (!metrics) return undefined
    return patchSingleMetric(metrics, ipPrice)
  }, [metrics, ipPrice])

  return (
    <TokenMetricsByAddressContext.Provider
      value={{ metrics: patchedMetrics, isLoading: !metrics && isLoadingMetrics, isError: isErrorMetrics }}
    >
      {children}
    </TokenMetricsByAddressContext.Provider>
  )
}

export function useTokenMetricsByAddressContext() {
  const context = useContext(TokenMetricsByAddressContext)
  if (!context) throw new Error("useTokenMetricsByAddress must be used within a TokenMetricsByAddressProvider")
  return context
}
