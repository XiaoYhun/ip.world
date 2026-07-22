import { useSyncExternalStore } from "react"

export type OptimisticMetric = {
  priceUsd: number
  marketCapUsd: number
  timestamp: number // Date.now() when set
}

// Simple external store — no zustand needed
const metrics = new Map<string, OptimisticMetric>()
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

export function setOptimisticMetric(tokenAddress: string, metric: OptimisticMetric) {
  metrics.set(tokenAddress.toLowerCase(), metric)
  notify()
}

export function clearOptimisticMetric(tokenAddress: string) {
  metrics.delete(tokenAddress.toLowerCase())
  notify()
}

export function getOptimisticMetric(tokenAddress: string): OptimisticMetric | undefined {
  return metrics.get(tokenAddress.toLowerCase())
}

/**
 * React hook to subscribe to optimistic metric for a token.
 * Re-renders when the optimistic value changes.
 */
export function useOptimisticMetric(tokenAddress?: string): OptimisticMetric | undefined {
  const key = tokenAddress?.toLowerCase() ?? ""

  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => metrics.get(key),
    () => undefined, // server snapshot
  )
}
