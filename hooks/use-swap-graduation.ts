"use client"

import { useMemo } from "react"
import type { SwapRow } from "@/hooks/use-token-swaps"
import { START_TICK_LIST } from "@/lib/utils/token-calculations"

// Default thresholds from token_deployed (covers most tokens)
const DEFAULT_START_TICK = Math.abs(START_TICK_LIST[0])
const DEFAULT_GRADUATION_THRESHOLD = Math.abs(START_TICK_LIST[1])

/**
 * Derive graduation progress from the latest swap's tick value.
 * Same formula as backend: progress = (startTick - absTick) / (startTick - threshold) * 100
 * Clamped 0–100. Once it reaches 100% (graduated), it stays there.
 */
export function useSwapGraduation(
  swaps: SwapRow[],
  currentProgress: number,
  isGraduated?: boolean,
): number {
  return useMemo(() => {
    // Already graduated — lock at 100% permanently. Once you hit 100%, no going back.
    if (isGraduated || currentProgress >= 100) return 100

    if (swaps.length === 0) return currentProgress

    // Find latest swap by timestamp
    let latest = swaps[0]
    for (let i = 1; i < swaps.length; i++) {
      if (Number(swaps[i].timestamp) > Number(latest.timestamp)) {
        latest = swaps[i]
      }
    }

    const tick = parseInt(latest.tick, 10)
    if (isNaN(tick)) return currentProgress

    const absTick = Math.abs(tick)
    const startTick = DEFAULT_START_TICK
    const threshold = DEFAULT_GRADUATION_THRESHOLD

    if (absTick < threshold) {
      // Fully graduated — lock it
      return 100
    }

    const progress = ((startTick - absTick) / (startTick - threshold)) * 100
    const swapProgress = Math.max(0, Math.min(100, Math.round(progress * 10) / 10))
    return Math.max(swapProgress, currentProgress)
  }, [swaps, currentProgress, isGraduated])
}
