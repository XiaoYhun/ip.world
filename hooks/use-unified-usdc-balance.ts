"use client"

import { useReadContract } from "wagmi"
import { STORY_USDC_ADDRESS } from "@/config/relay-chains"
import { useEmbeddedWallets } from "./use-embedded-wallets"
import { useSolanaBalances } from "@/context/solana-balances-context"

const USDC_DECIMALS = 6

const ERC20_BALANCE_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const

/**
 * Aggregates USDC balance across both embedded wallets (Story EVM + Solana).
 *
 * - Story USDC: ERC-20 `balanceOf` on the EVM embedded wallet
 * - Solana USDC: read from SolanaBalancesProvider (single shared poll)
 */
export function useUnifiedUsdcBalance() {
  const { evmAddress } = useEmbeddedWallets()
  const { solanaUsdcRaw, isLoading: solanaLoading, refetch: refetchSolanaUsdc } = useSolanaBalances()

  const { data: storyUsdcRaw, refetch: refetchStoryUsdc } = useReadContract({
    address: STORY_USDC_ADDRESS,
    abi: ERC20_BALANCE_ABI,
    functionName: "balanceOf",
    args: evmAddress ? [evmAddress] : undefined,
    query: {
      enabled: !!evmAddress,
      staleTime: 15_000,
      gcTime: 60_000,
      refetchOnWindowFocus: false,
    },
  })

  const storyRaw = typeof storyUsdcRaw === "bigint" ? storyUsdcRaw : BigInt(0)
  const totalRaw = storyRaw + solanaUsdcRaw

  const toFormatted = (raw: bigint) => Number(raw) / 10 ** USDC_DECIMALS

  return {
    totalUsdcRaw: totalRaw,
    totalUsdc: toFormatted(totalRaw),
    storyUsdcRaw: storyRaw,
    storyUsdc: toFormatted(storyRaw),
    solanaUsdcRaw,
    solanaUsdc: toFormatted(solanaUsdcRaw),
    isLoading: solanaLoading,
    decimals: USDC_DECIMALS,
    refetchStoryUsdc,
    refetchSolanaUsdc,
  }
}
