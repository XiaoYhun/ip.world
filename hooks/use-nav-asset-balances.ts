"use client"

import { useCallback, useMemo } from "react"
import { useBalance } from "wagmi"
import BigNumber from "bignumber.js"
import { useUnifiedUsdcBalance } from "./use-unified-usdc-balance"
import { useAccount } from "./use-account"
import { useSolanaBalances } from "@/context/solana-balances-context"
import type { RawBalanceSnapshot } from "@/lib/detect-balance-inflow"

const SOL_DECIMALS = 9

/** @deprecated Use RawBalanceSnapshot from @/lib/detect-balance-inflow */
export type NavBalanceSnapshot = RawBalanceSnapshot

export interface AssetBalance {
  raw: bigint
  decimals: number
  /** Formatted string ready for display, e.g. "1.23" */
  formatted: string
}

export interface NavAssetBalances {
  IP: AssetBalance
  SOL: AssetBalance
  USDC: AssetBalance
  refetch: () => Promise<void>
  /** Parallel refetch; uses return values so Solana numbers are correct in the same tick. */
  fetchFreshSnapshot: () => Promise<RawBalanceSnapshot>
}

function formatBalance(raw: bigint, decimals: number, displayDecimals = 2): string {
  const value = new BigNumber(raw.toString()).dividedBy(new BigNumber(10).pow(decimals))
  const fixed = value.toFixed(displayDecimals, BigNumber.ROUND_DOWN)
  return new BigNumber(fixed).isZero() ? "0" : fixed
}

export function useNavAssetBalances(): NavAssetBalances {
  const { address } = useAccount()
  const { solLamports, refetch: refetchSolana } = useSolanaBalances()
  const { totalUsdcRaw: usdcRaw, refetchStoryUsdc } = useUnifiedUsdcBalance()

  const { data: ipBalance, refetch: refetchIp } = useBalance({
    address,
    query: { enabled: !!address, staleTime: 10_000, refetchOnWindowFocus: false },
  })

  const refetch = useCallback(async () => {
    await Promise.all([
      refetchIp(),
      refetchSolana(),
      refetchStoryUsdc?.(),
    ])
  }, [refetchIp, refetchSolana, refetchStoryUsdc])

  const fetchFreshSnapshot = useCallback(async (): Promise<RawBalanceSnapshot> => {
    const [ipRes, solSnap, storyRes] = await Promise.all([
      refetchIp(),
      refetchSolana(),
      refetchStoryUsdc?.() ?? Promise.resolve({ data: undefined as bigint | undefined }),
    ])
    const ip = ipRes.data?.value ?? BigInt(0)
    const storyUsdc =
      typeof storyRes.data === "bigint" ? storyRes.data : BigInt(0)
    return {
      ip,
      sol: solSnap.solLamports,
      solanaUsdc: solSnap.solanaUsdcRaw,
      storyUsdc,
    }
  }, [refetchIp, refetchSolana, refetchStoryUsdc])

  const ipRaw = ipBalance?.value ?? BigInt(0)
  const ipDecimals = ipBalance?.decimals ?? 18

  return useMemo(() => ({
    IP: {
      raw: ipRaw,
      decimals: ipDecimals,
      formatted: formatBalance(ipRaw, ipDecimals, 2),
    },
    SOL: {
      raw: solLamports,
      decimals: SOL_DECIMALS,
      formatted: formatBalance(solLamports, SOL_DECIMALS, 4),
    },
    USDC: {
      raw: usdcRaw,
      decimals: 6,
      formatted: formatBalance(usdcRaw, 6, 2),
    },
    refetch,
    fetchFreshSnapshot,
  }), [ipRaw, ipDecimals, solLamports, usdcRaw, refetch, fetchFreshSnapshot])
}
