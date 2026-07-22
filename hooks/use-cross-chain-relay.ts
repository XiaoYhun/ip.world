"use client"

import { useCallback, useRef, useState } from "react"
import type {
  RelaySolanaInstruction,
  RelayQuoteResponse,
  RelayStatusResponse,
} from "@/lib/relay"
import { getRelayQuote, pollRelayStatus } from "@/lib/relay"
import { tradeTimer } from "@/lib/trade-timer"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CrossChainRelayStatus =
  | "idle"
  | "quoting"
  | "signing"
  | "bridging"
  | "complete"
  | "error"

export interface UseCrossChainRelayParams {
  originChainId: number
  originCurrency: string
  destinationChainId: number
  destinationCurrency: string
  amount: bigint
  senderAddress: string
  recipientAddress: string
  signDeposit: (instructions: RelaySolanaInstruction[]) => Promise<string>
  enabled: boolean
}

export interface UseCrossChainRelayReturn {
  status: CrossChainRelayStatus
  error: string | null
  txHash: string | null
  execute: () => Promise<void>
  reset: () => void
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Generic cross-chain relay hook for bridging assets between any two chains.
 * No destination swap logic — purely moves currency from origin to destination.
 *
 * Designed to be composable: `useRelaySwap` uses this for bridge-then-swap,
 * and the trade modal uses this for USDC Solana -> Story relay.
 */
export function useCrossChainRelay({
  originChainId,
  originCurrency,
  destinationChainId,
  destinationCurrency,
  amount,
  senderAddress,
  recipientAddress,
  signDeposit,
  enabled,
}: UseCrossChainRelayParams): UseCrossChainRelayReturn {
  const [status, setStatus] = useState<CrossChainRelayStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setStatus("idle")
    setError(null)
    setTxHash(null)
  }, [])

  const execute = useCallback(async () => {
    if (!enabled || !senderAddress || !recipientAddress || amount <= BigInt(0)) {
      setError("Missing wallet or amount")
      return
    }

    try {
      abortRef.current?.abort()
      abortRef.current = new AbortController()
      setError(null)
      setTxHash(null)

      tradeTimer.start("[crossChainRelay] total")

      setStatus("quoting")
      tradeTimer.start("[crossChainRelay] quote")
      const quote: RelayQuoteResponse = await getRelayQuote({
        originChainId,
        originCurrency,
        destinationChainId,
        destinationCurrency,
        amount: amount.toString(),
        userAddress: senderAddress,
        recipientAddress,
        tradeType: "EXACT_INPUT",
      })
      tradeTimer.end("[crossChainRelay] quote")

      const depositStep = quote.steps?.find(
        (step) => step.id === "deposit" || step.action === "deposit"
      )
      const depositData = depositStep?.items?.[0]?.data

      if (!depositData) {
        throw new Error("No deposit transaction in relay quote")
      }

      const requestId = depositStep?.requestId ?? quote.requestId
      if (!requestId) {
        throw new Error("No request ID in relay quote")
      }

      setStatus("signing")
      tradeTimer.start("[crossChainRelay] sign")
      if (depositData.instructions) {
        await signDeposit(depositData.instructions)
      } else if (depositData.to) {
        throw new Error("EVM deposit signing not implemented in cross-chain relay")
      } else {
        throw new Error("Unknown deposit format")
      }
      tradeTimer.end("[crossChainRelay] sign")

      setStatus("bridging")
      tradeTimer.start("[crossChainRelay] poll")
      const finalStatus = await pollRelayStatus(requestId, (update: RelayStatusResponse) => {
        if (update.outTxHashes?.[0]) setTxHash(update.outTxHashes[0])
      })
      tradeTimer.end("[crossChainRelay] poll")

      if (finalStatus.status === "success") {
        if (finalStatus.outTxHashes?.[0]) setTxHash(finalStatus.outTxHashes[0])
        setStatus("complete")
      } else if (finalStatus.status === "refund") {
        setError("Bridge was refunded — funds are safe on the source chain.")
        setStatus("error")
      } else {
        setError("Cross-chain relay failed. Check your wallet.")
        setStatus("error")
      }

      tradeTimer.end("[crossChainRelay] total")
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Unknown error"

      let message: string
      if (raw.includes("Quote failed") || raw.includes("quote")) {
        message = "Unable to get a cross-chain quote. Try again."
      } else if (raw.includes("timed out")) {
        message = "Bridge timed out. Your funds are safe — check your wallet."
      } else if (raw.includes("insufficient") || raw.includes("balance")) {
        message = "Insufficient balance on the source chain."
      } else if (raw.includes("user rejected") || raw.includes("User rejected")) {
        message = "Transaction cancelled."
      } else {
        message = raw
      }

      setError(message)
      setStatus("error")
    }
  }, [
    enabled,
    originChainId,
    originCurrency,
    destinationChainId,
    destinationCurrency,
    amount,
    senderAddress,
    recipientAddress,
    signDeposit,
  ])

  return { status, error, txHash, execute, reset }
}
