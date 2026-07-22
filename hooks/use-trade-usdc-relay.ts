"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useBalance, usePublicClient } from "wagmi"
import { useAccount } from "./use-account"
import { useEmbeddedWallets } from "./use-embedded-wallets"
import { useEmbeddedEvmWalletClient } from "./use-embedded-evm-wallet-client"
import { useSignSolanaDeposit } from "./use-sign-solana-deposit"
import { useUnifiedUsdcBalance } from "./use-unified-usdc-balance"
import {
  NATIVE_CURRENCY_ADDRESS,
  RELAY_SOLANA_CHAIN_ID,
  RELAY_STORY_CHAIN_ID,
  RELAY_USDC_SOL_CONFIG,
  STORY_USDC_ADDRESS,
} from "@/config/relay-chains"
import {
  type RelayBridgeEstimate,
  type RelayQuoteResponse,
  type RelaySolanaInstruction,
  getRelayBridgeEstimate,
  getRelayQuote,
  planUsdcToIpRoute,
  pollRelayStatus,
  relayUserMessageFromErrorMessage,
} from "@/lib/relay"
import { tradeTimer } from "@/lib/trade-timer"
import { useRefreshAllBalances } from "./use-refresh-all-balances"

export type TradeUsdcRelayStatus =
  | "idle"
  | "quoting"
  | "swapping"
  | "complete"
  | "error"

const IP_GAS_THRESHOLD = BigInt(1e16)
const SOL_GAS_THRESHOLD_LAMPORTS = BigInt(3_000_000)
const DEBOUNCE_MS = 500

const ERC20_BALANCE_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const

interface TradeUsdcEstimate {
  estimatedIpWei: bigint
  estimatedIpHuman: number
  fees: { relayUsd: string; gasUsd: string; totalUsd: string }
  relayImpactPercent: number
}

export interface UseTradeUsdcRelayReturn {
  /**
   * True when Story USDC alone covers the requested amount and the user
   * has enough native IP for gas. The caller should use a direct on-chain
   * USDC -> WIP -> token multihop swap (no Relay needed).
   */
  canDirectSwap: boolean
  /** Relay estimate — only populated when `canDirectSwap` is false. */
  estimate: TradeUsdcEstimate | null
  isEstimating: boolean
  /** Set when Relay bridge estimate fails (e.g. amount too low) */
  estimateError: string | null
  status: TradeUsdcRelayStatus
  error: string | null
  /**
   * Convert the user's USDC (from Story and/or Solana) to native IP.
   * Returns the total IP received (wei) so the caller can immediately
   * execute a standard WIP -> token on-chain swap.
   * Only call when `canDirectSwap` is false.
   */
  execute: (usdcAmountRaw: bigint) => Promise<bigint>
  reset: () => void
}

function sanitizeRelayError(raw: string): string {
  const extracted = relayUserMessageFromErrorMessage(raw)
  const lc = extracted.toLowerCase()
  if (lc.includes("execution reverted")) return "Swap failed — transaction reverted. Please try again."
  if (lc.includes("user rejected") || lc.includes("user denied")) return "Transaction cancelled."
  if (lc.includes("insufficient funds") || lc.includes("insufficient balance")) return "Insufficient balance for swap."
  if (lc.includes("no routes found") || lc.includes("no_swap_routes")) return "No swap route available. Please try a different amount."
  if (lc.includes("timeout") || lc.includes("timed out")) return "Swap timed out. Please try again."
  if (extracted.length > 200) return "Swap failed. Please try again."
  return extracted
}

/**
 * Hook that converts USDC (from Story and/or Solana) to native IP for trades.
 *
 * Unlike useCreationRelay (which targets a specific IP amount), this hook
 * is amount-based: the user specifies how much USDC to spend, and the hook
 * converts all of it to IP via Relay. The returned IP is then used for a
 * standard WIP -> token on-chain swap.
 *
 * Routing is determined by `planUsdcToIpRoute` (see lib/relay/usdc-routing.ts).
 * Each step uses EXACT_INPUT.
 */
export function useTradeUsdcRelay(
  usdcAmountRaw: bigint,
  enabled: boolean,
): UseTradeUsdcRelayReturn {
  const { address } = useAccount()
  const { solanaAddress, solanaWallet } = useEmbeddedWallets()
  const { getEmbeddedWalletClient } = useEmbeddedEvmWalletClient()
  const { signSolanaDeposit } = useSignSolanaDeposit()
  const { data: ipBalance } = useBalance({ address })
  const { refreshAllBalances } = useRefreshAllBalances()
  const unifiedUsdc = useUnifiedUsdcBalance()
  const publicClient = usePublicClient()

  const canDirectSwap = enabled &&
    usdcAmountRaw > BigInt(0) &&
    unifiedUsdc.storyUsdcRaw >= usdcAmountRaw &&
    (ipBalance?.value ?? BigInt(0)) >= IP_GAS_THRESHOLD
  const needsRelay = enabled && !canDirectSwap

  const [estimate, setEstimate] = useState<TradeUsdcEstimate | null>(null)
  const [isEstimating, setIsEstimating] = useState(false)
  const [estimateError, setEstimateError] = useState<string | null>(null)
  const [status, setStatus] = useState<TradeUsdcRelayStatus>("idle")
  const [error, setError] = useState<string | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const abortRef = useRef(0)

  // Debounced estimate — only fetched when relay is actually needed
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!needsRelay || usdcAmountRaw <= BigInt(0) || !address) {
      setEstimate(null)
      setEstimateError(null)
      setIsEstimating(false)
      return
    }

    setIsEstimating(true)
    setEstimateError(null)
    const gen = ++abortRef.current

    debounceRef.current = setTimeout(async () => {
      try {
        const result: RelayBridgeEstimate = await getRelayBridgeEstimate({
          originChainId: RELAY_STORY_CHAIN_ID,
          originCurrency: STORY_USDC_ADDRESS,
          amount: usdcAmountRaw.toString(),
          userAddress: address,
          recipientAddress: address,
        })

        if (gen !== abortRef.current) return

        const ipHuman = Number(result.estimatedIpWei) / 1e18
        const impactPct = result.raw?.details?.totalImpact?.percent
          ? Math.abs(parseFloat(result.raw.details.totalImpact.percent))
          : 0
        setEstimate({
          estimatedIpWei: result.estimatedIpWei,
          estimatedIpHuman: ipHuman,
          fees: result.fees,
          relayImpactPercent: impactPct,
        })
        setEstimateError(null)
      } catch (e) {
        if (gen !== abortRef.current) return
        setEstimate(null)
        const raw = e instanceof Error ? e.message : String(e)
        setEstimateError(relayUserMessageFromErrorMessage(raw))
      } finally {
        if (gen === abortRef.current) setIsEstimating(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [usdcAmountRaw, needsRelay, address])

  // ── Helpers ──

  const readStoryUsdc = useCallback(async (): Promise<bigint> => {
    if (!publicClient || !address) return BigInt(0)
    return (await publicClient.readContract({
      address: STORY_USDC_ADDRESS,
      abi: ERC20_BALANCE_ABI,
      functionName: "balanceOf",
      args: [address],
    })) as bigint
  }, [publicClient, address])

  const readSolLamports = useCallback(async (): Promise<bigint> => {
    if (!solanaWallet || !solanaAddress) return BigInt(0)
    try {
      const connector = solanaWallet.connector as unknown as {
        getBalance(addr: string): Promise<string | undefined>
      }
      const bal = await connector.getBalance(solanaAddress)
      return BigInt(Math.floor(parseFloat(bal ?? "0") * 1e9))
    } catch {
      return BigInt(0)
    }
  }, [solanaWallet, solanaAddress])

  const executeEvmQuoteSteps = useCallback(
    async (quote: RelayQuoteResponse, label: string): Promise<void> => {
      const walletClient = await getEmbeddedWalletClient()
      let requestId: string | undefined

      for (const step of quote.steps ?? []) {
        if (step.requestId) requestId = step.requestId
        for (const item of step.items ?? []) {
          const txData = item.data
          if (!txData?.to) continue

          tradeTimer.start(`[tradeUsdcRelay] ${label}:${step.id}`)
          const hash = await walletClient.sendTransaction({
            to: txData.to as `0x${string}`,
            data: (txData.data ?? "0x") as `0x${string}`,
            value: txData.value ? BigInt(txData.value) : BigInt(0),
            account: walletClient.account!,
            chain: walletClient.chain,
          })
          if (publicClient) await publicClient.waitForTransactionReceipt({ hash })
          tradeTimer.end(`[tradeUsdcRelay] ${label}:${step.id}`)
        }
      }

      if (!requestId) requestId = quote.requestId
      if (!requestId) throw new Error(`No request ID in ${label} relay quote`)

      tradeTimer.start(`[tradeUsdcRelay] ${label}:poll`)
      const finalStatus = await pollRelayStatus(requestId)
      tradeTimer.end(`[tradeUsdcRelay] ${label}:poll`)

      if (finalStatus.status !== "success") {
        throw new Error(
          finalStatus.status === "refund"
            ? `${label} was refunded. Please try again.`
            : `${label} failed. Please try again.`
        )
      }
    },
    [getEmbeddedWalletClient, publicClient]
  )

  const executeSolanaQuoteSteps = useCallback(
    async (quote: RelayQuoteResponse, label: string): Promise<void> => {
      const depositStep = quote.steps?.find(
        (s) => s.items?.some((item) => item.data?.instructions)
      )
      const depositItem = depositStep?.items?.find((item) => item.data?.instructions)
      const instructions = depositItem?.data?.instructions as RelaySolanaInstruction[] | undefined

      if (!instructions?.length) {
        throw new Error(`No deposit instructions in ${label} relay quote`)
      }

      const requestId = depositStep?.requestId ?? quote.requestId
      if (!requestId) throw new Error(`No request ID in ${label} relay quote`)

      tradeTimer.start(`[tradeUsdcRelay] ${label}:sign`)
      await signSolanaDeposit(instructions)
      tradeTimer.end(`[tradeUsdcRelay] ${label}:sign`)

      tradeTimer.start(`[tradeUsdcRelay] ${label}:poll`)
      const finalStatus = await pollRelayStatus(requestId)
      tradeTimer.end(`[tradeUsdcRelay] ${label}:poll`)

      if (finalStatus.status !== "success") {
        throw new Error(
          finalStatus.status === "refund"
            ? `${label} was refunded. Please try again.`
            : `${label} failed. Please try again.`
        )
      }
    },
    [signSolanaDeposit]
  )

  // ── Execute: convert USDC to native IP ──

  const execute = useCallback(
    async (targetUsdcRaw: bigint): Promise<bigint> => {
      setError(null)
      setStatus("quoting")
      tradeTimer.start("[tradeUsdcRelay] total")

      try {
        const [storyBal, ipBal, solLamports] = await Promise.all([
          readStoryUsdc(),
          publicClient
            ? publicClient.getBalance({ address: address! as `0x${string}` })
            : BigInt(0),
          readSolLamports(),
        ])

        const plan = planUsdcToIpRoute({
          storyUsdcRaw: storyBal,
          solanaUsdcRaw: unifiedUsdc.solanaUsdcRaw,
          hasIpGas: ipBal > IP_GAS_THRESHOLD,
          hasSolGas: solLamports > SOL_GAS_THRESHOLD_LAMPORTS,
        })

        if (!plan.feasible) throw new Error(plan.reason)

        setStatus("swapping")

        const balances: Record<string, bigint> = {
          story: storyBal,
          solana: unifiedUsdc.solanaUsdcRaw,
        }

        let remainingUsdc = targetUsdcRaw
        let totalIpReceived = BigInt(0)

        for (const step of plan.steps) {
          if (remainingUsdc <= BigInt(0)) break

          const bal = balances[step.source]
          if (!bal || bal <= BigInt(0)) continue

          const isStory = step.source === "story"
          const label = isStory ? "storyUsdcToIp" : "solUsdcToIp"

          const inputAmount = bal >= remainingUsdc ? remainingUsdc : bal

          const quoteParams = {
            originChainId: isStory ? RELAY_STORY_CHAIN_ID : RELAY_SOLANA_CHAIN_ID,
            originCurrency: isStory ? STORY_USDC_ADDRESS : RELAY_USDC_SOL_CONFIG.currencyAddress,
            destinationChainId: RELAY_STORY_CHAIN_ID,
            destinationCurrency: NATIVE_CURRENCY_ADDRESS,
            amount: inputAmount.toString(),
            userAddress: isStory ? address! : solanaAddress!,
            recipientAddress: address!,
            tradeType: "EXACT_INPUT" as const,
          }

          tradeTimer.start(`[tradeUsdcRelay] ${label}:quote`)
          const quote = await getRelayQuote(quoteParams)
          tradeTimer.end(`[tradeUsdcRelay] ${label}:quote`)

          const ipReceived = BigInt(quote.details?.currencyOut?.amount ?? "0")

          if (isStory) await executeEvmQuoteSteps(quote, label)
          else await executeSolanaQuoteSteps(quote, label)

          totalIpReceived += ipReceived
          remainingUsdc -= inputAmount
        }

        if (totalIpReceived <= BigInt(0)) {
          throw new Error("No IP received from USDC conversion")
        }

        await refreshAllBalances()

        setStatus("complete")
        tradeTimer.end("[tradeUsdcRelay] total")

        return totalIpReceived
      } catch (err) {
        tradeTimer.end("[tradeUsdcRelay] total")
        const raw = err instanceof Error ? err.message : String(err)
        console.error("[tradeUsdcRelay] execute failed:", err)
        const msg = sanitizeRelayError(raw)
        setError(msg)
        setStatus("error")
        throw new Error(msg)
      }
    },
    [
      address,
      solanaAddress,
      publicClient,
      unifiedUsdc.solanaUsdcRaw,
      refreshAllBalances,
      executeEvmQuoteSteps,
      executeSolanaQuoteSteps,
      readStoryUsdc,
      readSolLamports,
    ]
  )

  const reset = useCallback(() => {
    setStatus("idle")
    setError(null)
  }, [])

  return { canDirectSwap, estimate, isEstimating, estimateError, status, error, execute, reset }
}
