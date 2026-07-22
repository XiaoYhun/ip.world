"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { type Address } from "viem"
import { useReadContract } from "wagmi"
import { useAccount } from "@/hooks/use-account"

import { env } from "@/config"
import QuoterABI from "@/config/Quoter.abi.json"
import { type PaymentCurrency, RELAY_SOL_CONFIG } from "@/config/relay-chains"
import {
  type RelaySolanaInstruction,
  type RelayQuoteResponse,
  type RelayStatusResponse,
  type RelayQuoteWithFallbackResult,
  buildStorySwapTxs,
  getRelayQuoteWithFallback,
  pollRelayStatus,
  relayUserMessageFromErrorMessage,
} from "@/lib/relay"
import { tradeTimer } from "@/lib/trade-timer"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RelaySwapStatus = "idle" | "quoting" | "signing" | "bridging" | "swapping" | "complete" | "error"

export interface UseRelaySwapParams {
  tokenAddress: Address
  paymentCurrency: PaymentCurrency
  amount: bigint
  /** Pre-computed IP amount from Relay bridge estimate (cross-chain→IP). When provided, used instead of `amount` for all IP-denominated operations. */
  estimatedIpAmount?: bigint
  slippage: number
  enabled: boolean
  solanaAddress?: string
  ipBalance?: bigint
  fee?: bigint
  /** Called when a fallback bridge-only completes — the trade component auto-swaps IP→token */
  onBridgeComplete?: () => Promise<void>
  /** Signs and sends a Solana deposit transaction; returns the tx signature */
  signSolanaDeposit?: (instructions: RelaySolanaInstruction[]) => Promise<string>
}

export interface RelaySwapFees {
  relay: string
  gas: string
  total: string
}

export interface UseRelaySwapReturn {
  quote: RelayQuoteResponse | null
  estimatedOutput: bigint
  fees: RelaySwapFees
  status: RelaySwapStatus
  execute: () => Promise<void>
  error: string | null
  /** Quote prefetch failed (e.g. amount too low) — surfaced in trade UI */
  prefetchError: string | null
  txHash: string | null
  reset: () => void
  needsGasReserve: boolean
  isPrefetching: boolean
  /** True when the primary single-step route was unavailable and bridge-only fallback was used */
  usedFallback: boolean
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Orchestrates a cross-chain buy via Relay Protocol.
 *
 * Flow:
 * 1. Get on-chain quote from Story's Quoter (how much meme out for X IP in)
 * 2. Build StoryHunt multicall destination txs
 * 3. Fetch Relay quote with deposit + destination txs
 * 4. User signs the deposit transaction on Solana
 * 5. Poll Relay status until success / failure
 */
const GAS_RESERVE_THRESHOLD = BigInt(10) ** BigInt(16) // 0.01 IP

export function useRelaySwap({
  tokenAddress,
  paymentCurrency,
  amount,
  estimatedIpAmount,
  slippage,
  enabled,
  solanaAddress,
  ipBalance,
  fee: externalFee,
  onBridgeComplete,
  signSolanaDeposit,
}: UseRelaySwapParams): UseRelaySwapReturn {
  const { address } = useAccount()
  const needsGasReserve = (ipBalance ?? BigInt(0)) < GAS_RESERVE_THRESHOLD

  // When a cross-chain currency is input, trade.tsx provides the relay-estimated IP amount.
  // Use it for all IP-denominated operations (quoter, swap txs, relay quote amount).
  const effectiveIpAmount = estimatedIpAmount && estimatedIpAmount > BigInt(0) ? estimatedIpAmount : amount
  const [status, setStatus] = useState<RelaySwapStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [prefetchError, setPrefetchError] = useState<string | null>(null)
  const [quote, setQuote] = useState<RelayQuoteResponse | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [usedFallback, setUsedFallback] = useState(false)
  const [isPrefetching, setIsPrefetching] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const sourceChain = paymentCurrency === "SOL" ? RELAY_SOL_CONFIG : null

  const { data: quoterResult } = useReadContract({
    address: env.NEXT_PUBLIC_QUOTER_ADDRESS,
    abi: QuoterABI,
    functionName: "quoteExactInputSingle",
    args: [
      env.NEXT_PUBLIC_WRAPPED_IP_TOKEN_ADDRESS,
      tokenAddress,
      externalFee ?? BigInt(env.NEXT_PUBLIC_V3_FEE),
      effectiveIpAmount > BigInt(0) ? effectiveIpAmount : BigInt(1),
      BigInt(0),
    ],
    query: {
      enabled: enabled && !!sourceChain && effectiveIpAmount > BigInt(0) && !!address,
      staleTime: 15_000,
      gcTime: 60_000,
      refetchOnWindowFocus: false,
    },
  })

  const estimatedOutput = useMemo(() => {
    if (!quoterResult) return BigInt(0)
    // Quoter returns [amountOut, sqrtPriceX96After, ...] – first element is the amount
    if (Array.isArray(quoterResult)) return BigInt(quoterResult[0]?.toString() ?? "0")
    return BigInt(quoterResult.toString())
  }, [quoterResult])

  const fees = useMemo<RelaySwapFees>(() => {
    if (!quote?.fees) return { relay: "0", gas: "0", total: "0" }
    const relayFee = quote.fees.relayer?.amountUsd ?? "0"
    const gasFee = quote.fees.gas?.amountUsd ?? "0"
    const totalUsd = (parseFloat(relayFee) + parseFloat(gasFee)).toFixed(2)
    return { relay: relayFee, gas: gasFee, total: totalUsd }
  }, [quote])

  // Pre-cache Relay quote so execute() can skip the quote step
  const QUOTE_TTL_MS = 30_000
  const cachedQuoteRef = useRef<{ result: RelayQuoteWithFallbackResult; amount: string; ts: number } | null>(null)
  const prefetchPromiseRef = useRef<{ promise: Promise<RelayQuoteWithFallbackResult>; amount: string } | null>(null)
  const prefetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const buildRelayParams = useCallback(() => {
    const depositAddress = solanaAddress || address
    if (!address || !depositAddress || !sourceChain || amount <= BigInt(0)) return null

    const slippageBps = BigInt(Math.floor(slippage * 10000))
    const amountOutMin =
      estimatedOutput > BigInt(0)
        ? (estimatedOutput * (BigInt(10000) - slippageBps)) / BigInt(10000)
        : BigInt(0)

    const destinationTxs = buildStorySwapTxs({
      tokenAddress,
      amountIn: effectiveIpAmount,
      amountOutMin,
      recipient: address,
      needsGasReserve,
      fee: externalFee,
    })

    return {
      originChainId: sourceChain.chainId,
      originCurrency: sourceChain.currencyAddress,
      tradeType: "EXACT_INPUT" as const,
      amount: amount.toString(),
      userAddress: depositAddress,
      recipientAddress: address,
      destinationTxs,
    }
  }, [address, amount, effectiveIpAmount, estimatedOutput, externalFee, needsGasReserve, slippage, solanaAddress, sourceChain, tokenAddress])

  useEffect(() => {
    if (prefetchTimerRef.current) clearTimeout(prefetchTimerRef.current)
    if (!enabled || !sourceChain || amount <= BigInt(0)) {
      setPrefetchError(null)
      return
    }

    setIsPrefetching(true)
    prefetchTimerRef.current = setTimeout(async () => {
      const params = buildRelayParams()
      if (!params) {
        setIsPrefetching(false)
        return
      }
      setPrefetchError(null)
      const promise = getRelayQuoteWithFallback(params)
      prefetchPromiseRef.current = { promise, amount: params.amount }
      try {
        const result = await promise
        cachedQuoteRef.current = { result, amount: params.amount, ts: Date.now() }
        setQuote(result.quote)
        setUsedFallback(result.usedFallback)
      } catch (err) {
        cachedQuoteRef.current = null
        setQuote(null)
        const raw = err instanceof Error ? err.message : String(err)
        setPrefetchError(relayUserMessageFromErrorMessage(raw))
      } finally {
        setIsPrefetching(false)
      }
    }, 300)

    return () => {
      if (prefetchTimerRef.current) clearTimeout(prefetchTimerRef.current)
    }
  }, [enabled, sourceChain, amount, buildRelayParams])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setStatus("idle")
    setError(null)
    setPrefetchError(null)
    setQuote(null)
    setTxHash(null)
    setUsedFallback(false)
  }, [])

  const execute = useCallback(async () => {
    const depositAddress = solanaAddress || address

    if (!address || !depositAddress || !sourceChain || amount <= BigInt(0)) {
      setError("Missing wallet or amount")
      return
    }

    try {
      abortRef.current?.abort()
      abortRef.current = new AbortController()
      setError(null)
      setTxHash(null)
      setUsedFallback(false)

      tradeTimer.start("[relaySwap] total")

      const cached = cachedQuoteRef.current
      const isCacheValid = cached && cached.amount === amount.toString() && Date.now() - cached.ts < QUOTE_TTL_MS

      let relayQuote: RelayQuoteResponse
      let didFallback: boolean

      tradeTimer.start("[relaySwap] quote")
      if (isCacheValid) {
        tradeTimer.log("[relaySwap] using cached quote")
        relayQuote = cached.result.quote
        didFallback = cached.result.usedFallback
      } else if (prefetchPromiseRef.current && prefetchPromiseRef.current.amount === amount.toString()) {
        tradeTimer.log("[relaySwap] awaiting in-flight prefetch")
        setStatus("quoting")
        const result = await prefetchPromiseRef.current.promise
        relayQuote = result.quote
        didFallback = result.usedFallback
      } else {
        tradeTimer.log("[relaySwap] fetching fresh quote")
        setStatus("quoting")
        const params = buildRelayParams()
        if (!params) throw new Error("Missing parameters for Relay quote")
        const result = await getRelayQuoteWithFallback(params)
        relayQuote = result.quote
        didFallback = result.usedFallback
      }
      tradeTimer.end("[relaySwap] quote")

      setQuote(relayQuote)
      setUsedFallback(didFallback)
      tradeTimer.log(`[relaySwap] usedFallback=${didFallback}`)

      const depositStep = relayQuote.steps?.find(
        (step) => step.id === "deposit" || step.action === "deposit"
      )
      const depositItem = depositStep?.items?.[0]
      const depositData = depositItem?.data

      if (!depositData) {
        throw new Error("[RelaySwap] No deposit transaction found in Relay quote")
      }

      const requestId = depositStep?.requestId ?? relayQuote.requestId
      if (!requestId) {
        throw new Error("[RelaySwap] No request ID in Relay quote response")
      }

      setStatus("signing")

      tradeTimer.start("[relaySwap] sign")
      if (depositData.instructions) {
        if (!signSolanaDeposit) {
          throw new Error("[RelaySwap] Solana wallet signer required but not provided")
        }
        let depositTxSig: string
        try {
          depositTxSig = await signSolanaDeposit(depositData.instructions)
        } catch (signErr) {
          throw new Error(
            `[RelaySwap] Deposit signing failed: ${signErr instanceof Error ? signErr.message : String(signErr)}`
          )
        }
        if (!depositTxSig) {
          throw new Error("[RelaySwap] Deposit signing returned no transaction signature")
        }
        tradeTimer.log(`[relaySwap] deposit tx: ${depositTxSig}`)
      } else if (depositData.to) {
        throw new Error("[RelaySwap] EVM deposit signing not implemented")
      } else {
        throw new Error("[RelaySwap] Unknown deposit format")
      }
      tradeTimer.end("[relaySwap] sign")

      setStatus("bridging")

      if (didFallback) {
        tradeTimer.start("[relaySwap] fallback:bridge+swap")
        const relayPoll = pollRelayStatus(requestId, (statusUpdate: RelayStatusResponse) => {
          if (statusUpdate.outTxHashes?.[0]) setTxHash(statusUpdate.outTxHashes[0])
        })

        setStatus("swapping")
        try {
          tradeTimer.start("[relaySwap] fallback:onBridgeComplete")
          await onBridgeComplete?.()
          tradeTimer.end("[relaySwap] fallback:onBridgeComplete")
          setStatus("complete")
          relayPoll.catch(() => {})
        } catch (swapErr: unknown) {
          tradeTimer.end("[relaySwap] fallback:onBridgeComplete")
          const finalStatus = await relayPoll.catch(() => null)
          if (finalStatus?.status === "refund") {
            setError("Bridge was refunded — your funds are safe on the source chain.")
          } else {
            const errMsg = swapErr instanceof Error ? swapErr.message : String(swapErr)
            setError(`Auto-swap failed: ${errMsg}. You have IP in your wallet — try swapping with IP directly.`)
          }
          setStatus("error")
        }
        tradeTimer.end("[relaySwap] fallback:bridge+swap")
      } else {
        tradeTimer.start("[relaySwap] direct:poll")
        const finalStatus = await pollRelayStatus(requestId, (statusUpdate: RelayStatusResponse) => {
          if (statusUpdate.outTxHashes?.[0]) {
            setTxHash(statusUpdate.outTxHashes[0])
            setStatus("swapping")
          }
        })
        tradeTimer.end("[relaySwap] direct:poll")

        if (finalStatus.status === "success") {
          if (finalStatus.outTxHashes?.[0]) setTxHash(finalStatus.outTxHashes[0])
          setStatus("complete")
        } else if (finalStatus.status === "refund") {
          setError("Bridge was refunded — your funds are safe on the source chain.")
          setStatus("error")
        } else {
          const hasOutTx = !!finalStatus.outTxHashes?.[0]
          if (hasOutTx) {
            setTxHash(finalStatus.outTxHashes![0])
            setError("Swap failed after bridging. You have IP in your wallet — try swapping directly with IP.")
          } else {
            setError("Cross-chain swap failed. Your funds may still be bridging — check your wallet.")
          }
          setStatus("error")
        }
      }

      tradeTimer.end("[relaySwap] total")
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Unknown error"
      const friendly = relayUserMessageFromErrorMessage(raw)
      const lc = friendly.toLowerCase()

      let message: string
      if (lc.includes("timed out") || raw.includes("timed out")) {
        message = "Bridge timed out. Your funds are safe — check your wallet and try again."
      } else if (lc.includes("insufficient") && lc.includes("balance")) {
        message = "Insufficient balance on the source chain."
      } else if (lc.includes("user rejected") || lc.includes("user denied")) {
        message = "Transaction cancelled."
      } else if (raw.includes("No deposit transaction")) {
        message = "Relay could not prepare the deposit. The route may be temporarily unavailable."
      } else if (raw.includes("No request ID")) {
        message = "Relay did not return a tracking ID. Try again."
      } else {
        message = friendly
      }

      setError(message)
      setStatus("error")
    }
  }, [address, amount, effectiveIpAmount, estimatedOutput, externalFee, needsGasReserve, onBridgeComplete, signSolanaDeposit, slippage, solanaAddress, sourceChain, tokenAddress])

  return {
    quote,
    estimatedOutput,
    fees,
    status,
    execute,
    error,
    prefetchError,
    txHash,
    reset,
    needsGasReserve,
    isPrefetching,
    usedFallback,
  }
}
