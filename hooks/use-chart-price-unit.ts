"use client"

import { useEffect, useState } from "react"
import { useReadContract } from "wagmi"
import { IPTokenABI } from "@/lib/contracts/abis"
import { bigNumberToFloat } from "@/lib/bignumber"
import { TOTAL_SUPPLY } from "@/lib/constants"

export const TV_CHART_UNIT_STORAGE_KEY = "tv-chart-unit"
export type TvChartUnit = "price" | "mcap"

/** IPToken uses OpenZeppelin ERC20 — always 18 decimals for `totalSupply` raw value. */
const TOKEN_SUPPLY_DECIMALS = 18

/**
 * Price vs MCap chart mode. MCap = OHLC × circulating supply (on-chain `totalSupply`).
 * While RPC is in flight, uses `TOTAL_SUPPLY` (1B) as a temporary multiplier so the chart still loads;
 * refines when `totalSupply` returns. Historical bars do not reflect past burns.
 */
export function useChartPriceUnit(tokenAddress: string, useCoinGeckoChart: boolean) {
  const [unit, setUnit] = useState<TvChartUnit>(() => {
    if (typeof window === "undefined") return "mcap"
    const v = localStorage.getItem(TV_CHART_UNIT_STORAGE_KEY) as TvChartUnit | null
    return v === "price" || v === "mcap" ? v : "mcap"
  })

  useEffect(() => {
    localStorage.setItem(TV_CHART_UNIT_STORAGE_KEY, unit)
  }, [unit])

  const { data: totalSupplyRaw } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: IPTokenABI,
    functionName: "totalSupply",
    query: { enabled: Boolean(tokenAddress) && !useCoinGeckoChart },
  })

  const supplyHuman =
    totalSupplyRaw != null && typeof totalSupplyRaw === "bigint"
      ? bigNumberToFloat(totalSupplyRaw as bigint, TOKEN_SUPPLY_DECIMALS)
      : 0

  /** Human-readable token amount (never 0 for mcap path while waiting — avoids blank chart). */
  const supplyForMultiplier =
    supplyHuman > 0 ? supplyHuman : TOTAL_SUPPLY

  const priceMultiplier =
    !useCoinGeckoChart && unit === "mcap" ? supplyForMultiplier : 1

  const chartDisplayUnit: TvChartUnit = useCoinGeckoChart ? "price" : unit

  return { unit, setUnit, priceMultiplier, chartDisplayUnit, supplyHuman }
}
