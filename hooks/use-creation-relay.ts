"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePublicClient } from "wagmi"
import { useAccount } from "./use-account"
import { useEmbeddedWallets } from "./use-embedded-wallets"
import { useEmbeddedEvmWalletClient } from "./use-embedded-evm-wallet-client"
import { useSignSolanaDeposit } from "./use-sign-solana-deposit"
import { useUnifiedUsdcBalance } from "./use-unified-usdc-balance"
import {
  type PaymentCurrency,
  NATIVE_CURRENCY_ADDRESS,
  RELAY_SOL_CONFIG,
  RELAY_SOLANA_CHAIN_ID,
  RELAY_STORY_CHAIN_ID,
  RELAY_USDC_SOL_CONFIG,
  STORY_USDC_ADDRESS,
  type RelaySourceChain,
} from "@/config/relay-chains"
import {
  type RelayBridgeEstimate,
  type RelayQuoteResponse,
  type RelaySolanaInstruction,
  getRelayBridgeEstimate,
  getRelayQuote,
  planUsdcToIpRoute,
  pollRelayStatus,
} from "@/lib/relay"
import { tradeTimer } from "@/lib/trade-timer"
import { useRefreshAllBalances } from "./use-refresh-all-balances"

export type CreationRelayStatus =
  | "idle"
  | "quoting"
  | "bridging"
  | "complete"
  | "error"

function getRelayConfig(currency: PaymentCurrency): RelaySourceChain | null {
  if (currency === "SOL") return RELAY_SOL_CONFIG
  if (currency === "USDC") return RELAY_USDC_SOL_CONFIG
  return null
}

function currencyAmountToRaw(amount: number, decimals: number): string {
  if (amount <= 0) return "0"
  const factor = 10 ** decimals
  return Math.floor(amount * factor).toString()
}

const USDC_DECIMALS = 6

/** ~0.01 IP — minimum IP needed to pay EVM gas on Story */
const IP_GAS_THRESHOLD = BigInt(1e16)
/** ~0.003 SOL — minimum SOL needed to sign a Solana transaction */
const SOL_GAS_THRESHOLD_LAMPORTS = BigInt(3_000_000)
/** Sub-cent rounding dust tolerance (< 0.01 IP ≈ $0.008) */
const DUST_THRESHOLD_WEI = BigInt(1e16)

const ERC20_BALANCE_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const

interface CreationRelayEstimate {
  estimatedIpWei: bigint
  estimatedIpHuman: number
  fees: { relayUsd: string; gasUsd: string; totalUsd: string }
  inputPerIp: number
}

export interface UseCreationRelayReturn {
  estimate: CreationRelayEstimate | null
  isEstimating: boolean
  status: CreationRelayStatus
  error: string | null
  /** Execute the relay: converts foreign currency to native IP.
   *  @param targetIpWei — exact IP (in wei) the wallet must end up with.
   *    Relay uses EXACT_INPUT so the hook calculates the precise input from the rate. */
  execute: (targetIpWei: bigint, currency: PaymentCurrency) => Promise<void>
  /** Creation fee expressed in the selected currency (null when IP or rate unknown) */
  feeInCurrency: number | null
  /** Effective input-per-IP rate from real estimate or seed (available on load for non-IP) */
  inputPerIp: number | null
}

/** Map verbose viem / Relay errors to short user-facing messages. */
function sanitizeRelayError(raw: string): string {
  const lc = raw.toLowerCase()
  if (lc.includes("execution reverted")) return "Swap failed — transaction reverted. Please try again."
  if (lc.includes("user rejected") || lc.includes("user denied")) return "Transaction cancelled."
  if (lc.includes("insufficient funds") || lc.includes("insufficient balance")) return "Insufficient balance for swap."
  if (lc.includes("no routes found") || lc.includes("no_swap_routes")) return "No swap route available. Please try a different amount."
  if (lc.includes("no usdc/ip rate")) return "Rate unavailable — please wait a moment and retry."
  if (lc.includes("timeout") || lc.includes("timed out")) return "Swap timed out. Please try again."
  if (raw.length > 120) return "Swap failed. Please try again."
  return raw
}

const DEBOUNCE_MS = 500

/**
 * Hook that provides relay bridge estimates and execution for
 * converting SOL/USDC to native IP during token creation.
 *
 * All paths go directly to IP — no intermediate USDC→USDC bridging.
 *
 * For USDC:
 *   Routing is determined by `planUsdcToIpRoute` (see lib/relay/usdc-routing.ts).
 *   Each step uses EXACT_INPUT with rate-derived amounts and a re-quote
 *   correction pass to account for swap fees.
 *
 * For SOL: Solana SOL → Story native IP directly via Relay (EXPECTED_OUTPUT).
 */
export function useCreationRelay(
  amount: number,
  currency: PaymentCurrency,
  creationFeeWei?: bigint,
  onBridgeComplete?: () => void
): UseCreationRelayReturn {
  const { address } = useAccount()
  const { solanaAddress, solanaWallet } = useEmbeddedWallets()
  const { getEmbeddedWalletClient } = useEmbeddedEvmWalletClient()
  const { signSolanaDeposit } = useSignSolanaDeposit()
  const { refreshAllBalances } = useRefreshAllBalances()
  const unifiedUsdc = useUnifiedUsdcBalance()
  const publicClient = usePublicClient()

  const [estimate, setEstimate] = useState<CreationRelayEstimate | null>(null)
  const [isEstimating, setIsEstimating] = useState(false)
  const [status, setStatus] = useState<CreationRelayStatus>("idle")
  const [error, setError] = useState<string | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const abortRef = useRef(0)

  // Debounced estimate fetcher
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const config = getRelayConfig(currency)
    if (!config || amount <= 0 || !address || !solanaAddress) {
      setEstimate(null)
      setIsEstimating(false)
      return
    }

    setIsEstimating(true)
    const currentGeneration = ++abortRef.current

    debounceRef.current = setTimeout(async () => {
      try {
        if (currency === "USDC") {
          const rawAmount = currencyAmountToRaw(amount, USDC_DECIMALS)
          const result: RelayBridgeEstimate = await getRelayBridgeEstimate({
            originChainId: RELAY_STORY_CHAIN_ID,
            originCurrency: STORY_USDC_ADDRESS,
            amount: rawAmount,
            userAddress: address,
            recipientAddress: address,
          })

          if (currentGeneration !== abortRef.current) return

          const ipHuman = Number(result.estimatedIpWei) / 1e18
          const inputPerIp = ipHuman > 0 ? amount / ipHuman : 0

          setEstimate({
            estimatedIpWei: result.estimatedIpWei,
            estimatedIpHuman: ipHuman,
            fees: result.fees,
            inputPerIp,
          })
        } else {
          const rawAmount = currencyAmountToRaw(amount, config.decimals)
          const result: RelayBridgeEstimate = await getRelayBridgeEstimate({
            originChainId: config.chainId,
            originCurrency: config.currencyAddress,
            amount: rawAmount,
            userAddress: solanaAddress,
            recipientAddress: address,
          })

          if (currentGeneration !== abortRef.current) return

          const ipHuman = Number(result.estimatedIpWei) / 1e18
          const inputPerIp = ipHuman > 0 ? amount / ipHuman : 0

          setEstimate({
            estimatedIpWei: result.estimatedIpWei,
            estimatedIpHuman: ipHuman,
            fees: result.fees,
            inputPerIp,
          })
        }
      } catch {
        if (currentGeneration !== abortRef.current) return
        setEstimate(null)
      } finally {
        if (currentGeneration === abortRef.current) {
          setIsEstimating(false)
        }
      }
    }, DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [amount, currency, address, solanaAddress])

  // Pre-fetch seed rates for ALL non-IP currencies on mount so switching
  // between SOL/USDC/IP is instant (no re-fetch, no null flash).
  const [seedRates, setSeedRates] = useState<Partial<Record<PaymentCurrency, number>>>({})
  const seedAbortRef = useRef(0)

  useEffect(() => {
    if (!address || !solanaAddress) return

    const seedGen = ++seedAbortRef.current

    const SEED_CURRENCIES: { currency: PaymentCurrency; config: RelaySourceChain; amount: number; decimals: number }[] = [
      { currency: "SOL", config: RELAY_SOL_CONFIG, amount: 0.01, decimals: RELAY_SOL_CONFIG.decimals },
      { currency: "USDC", config: RELAY_USDC_SOL_CONFIG, amount: 1, decimals: USDC_DECIMALS },
    ]

    const fetchAllSeedRates = async () => {
      const results = await Promise.allSettled(
        SEED_CURRENCIES.map(async ({ currency: c, config, amount: seedAmt, decimals }) => {
          const rawAmount = currencyAmountToRaw(seedAmt, decimals)
          const originChainId = c === "USDC" ? RELAY_STORY_CHAIN_ID : config.chainId
          const originCurrency = c === "USDC" ? STORY_USDC_ADDRESS : config.currencyAddress
          const user = c === "USDC" ? address : solanaAddress

          const result: RelayBridgeEstimate = await getRelayBridgeEstimate({
            originChainId,
            originCurrency,
            amount: rawAmount,
            userAddress: user,
            recipientAddress: address,
          })

          const ipHuman = Number(result.estimatedIpWei) / 1e18
          return { currency: c, rate: ipHuman > 0 ? seedAmt / ipHuman : undefined }
        })
      )

      if (seedGen !== seedAbortRef.current) return

      const rates: Partial<Record<PaymentCurrency, number>> = {}
      results.forEach((r, i) => {
        if (r.status === "fulfilled" && r.value.rate !== undefined) {
          rates[SEED_CURRENCIES[i].currency] = r.value.rate
        }
      })
      setSeedRates(rates)
    }

    fetchAllSeedRates()
  }, [address, solanaAddress])

  // Clear stale estimate when currency changes
  const prevCurrencyRef = useRef(currency)
  useEffect(() => {
    if (prevCurrencyRef.current !== currency) {
      prevCurrencyRef.current = currency
      setEstimate(null)
      setIsEstimating(false)
    }
  }, [currency])

  const feeInCurrency = useMemo((): number | null => {
    if (currency === "IP" || !creationFeeWei || creationFeeWei === BigInt(0)) return null
    const feeIpHuman = Number(creationFeeWei) / 1e18
    const rate = estimate?.inputPerIp ?? seedRates[currency]
    if (!rate || rate <= 0) return null
    return feeIpHuman * rate
  }, [currency, creationFeeWei, estimate, seedRates])

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

  /** Execute EVM transaction steps from a Relay quote, then poll until success. */
  const executeEvmQuoteSteps = useCallback(
    async (quote: RelayQuoteResponse, label: string): Promise<void> => {
      const walletClient = await getEmbeddedWalletClient()
      let requestId: string | undefined

      for (const step of quote.steps ?? []) {
        if (step.requestId) requestId = step.requestId
        for (const item of step.items ?? []) {
          const txData = item.data
          if (!txData?.to) continue

          const stepLabel = `[creationRelay] ${label}:${step.id}`
          tradeTimer.start(stepLabel)
          const hash = await walletClient.sendTransaction({
            to: txData.to as `0x${string}`,
            data: (txData.data ?? "0x") as `0x${string}`,
            value: txData.value ? BigInt(txData.value) : BigInt(0),
            account: walletClient.account!,
            chain: walletClient.chain,
          })
          if (publicClient) await publicClient.waitForTransactionReceipt({ hash })
          tradeTimer.end(stepLabel)
        }
      }

      if (!requestId) requestId = quote.requestId
      if (!requestId) throw new Error(`No request ID in ${label} relay quote`)

      tradeTimer.start(`[creationRelay] ${label}:poll`)
      const finalStatus = await pollRelayStatus(requestId)
      tradeTimer.end(`[creationRelay] ${label}:poll`)

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

  /** Execute a Solana-origin Relay quote (sign deposit instructions + poll). */
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

      tradeTimer.start(`[creationRelay] ${label}:sign`)
      await signSolanaDeposit(instructions)
      tradeTimer.end(`[creationRelay] ${label}:sign`)

      tradeTimer.start(`[creationRelay] ${label}:poll`)
      const finalStatus = await pollRelayStatus(requestId)
      tradeTimer.end(`[creationRelay] ${label}:poll`)

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

  // ── Execute ──

  const execute = useCallback(
    async (targetIpWei: bigint, execCurrency: PaymentCurrency) => {
      setError(null)
      setStatus("quoting")
      tradeTimer.start("[creationRelay] total")

      try {
        if (execCurrency === "USDC") {
          // ── USDC → IP: plan route, then execute steps sequentially ──
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

          setStatus("bridging")
          let remainingIpWei = targetIpWei

          const balances: Record<string, bigint> = {
            story: storyBal,
            solana: unifiedUsdc.solanaUsdcRaw,
          }

          // Relay doesn't support EXPECTED_OUTPUT for USDC → IP swaps,
          // so we calculate the input from the rate and use EXACT_INPUT.
          const usdcPerIp = estimate?.inputPerIp ?? seedRates["USDC"]
          if (!usdcPerIp || usdcPerIp <= 0) {
            throw new Error("No USDC/IP rate available — cannot calculate swap input")
          }

          for (const step of plan.steps) {
            if (remainingIpWei <= BigInt(0)) break

            const bal = balances[step.source]
            if (!bal || bal <= BigInt(0)) continue

            const isStory = step.source === "story"
            const label = isStory ? "storyUsdcToIp" : "solUsdcToIp"

            const remainingIpHuman = Number(remainingIpWei) / 1e18
            const estimatedUsdcRaw = BigInt(Math.ceil(remainingIpHuman * usdcPerIp * 1e6))
            let inputAmount = bal >= estimatedUsdcRaw ? estimatedUsdcRaw : bal

            const buildQuoteParams = (amount: bigint) => ({
              originChainId: isStory ? RELAY_STORY_CHAIN_ID : RELAY_SOLANA_CHAIN_ID,
              originCurrency: isStory ? STORY_USDC_ADDRESS : RELAY_USDC_SOL_CONFIG.currencyAddress,
              destinationChainId: RELAY_STORY_CHAIN_ID,
              destinationCurrency: NATIVE_CURRENCY_ADDRESS,
              amount: amount.toString(),
              userAddress: isStory ? address! : solanaAddress!,
              recipientAddress: address!,
              tradeType: "EXACT_INPUT" as const,
            })

            tradeTimer.start(`[creationRelay] ${label}:quote`)
            let quote = await getRelayQuote(buildQuoteParams(inputAmount))
            tradeTimer.end(`[creationRelay] ${label}:quote`)

            let ipReceived = BigInt(quote.details?.currencyOut?.amount ?? "0")

            // If the initial rate-based estimate falls short (due to swap fees),
            // re-quote with a corrected amount derived from the actual quote rate.
            if (ipReceived < remainingIpWei && inputAmount < bal) {
              const shortfallIp = Number(remainingIpWei - ipReceived) / 1e18
              const actualUsdcPerIp = Number(inputAmount) / 1e6 / (Number(ipReceived) / 1e18)
              const extraUsdc = BigInt(Math.ceil(shortfallIp * actualUsdcPerIp * 1e6))
              const cappedAmount = (() => {
                const corrected = inputAmount + extraUsdc
                return corrected > bal ? bal : corrected
              })()

              tradeTimer.start(`[creationRelay] ${label}:requote`)
              quote = await getRelayQuote(buildQuoteParams(cappedAmount))
              tradeTimer.end(`[creationRelay] ${label}:requote`)

              ipReceived = BigInt(quote.details?.currencyOut?.amount ?? "0")
              inputAmount = cappedAmount
            }

            if (isStory) await executeEvmQuoteSteps(quote, label)
            else await executeSolanaQuoteSteps(quote, label)

            remainingIpWei = remainingIpWei > ipReceived ? remainingIpWei - ipReceived : BigInt(0)
          }

          if (remainingIpWei > DUST_THRESHOLD_WEI) {
            throw new Error("Insufficient USDC balance across all sources")
          }
        } else if (execCurrency === "SOL") {
          // ── SOL → IP: EXPECTED_OUTPUT — Relay determines exact SOL input ──
          const config = getRelayConfig(execCurrency)!

          tradeTimer.start("[creationRelay] quote")
          const quote = await getRelayQuote({
            originChainId: config.chainId,
            originCurrency: config.currencyAddress,
            destinationChainId: RELAY_STORY_CHAIN_ID,
            destinationCurrency: NATIVE_CURRENCY_ADDRESS,
            amount: targetIpWei.toString(),
            userAddress: solanaAddress!,
            recipientAddress: address!,
            tradeType: "EXPECTED_OUTPUT",
          })
          tradeTimer.end("[creationRelay] quote")

          await executeSolanaQuoteSteps(quote, "solToIp")

          setStatus("bridging")
        } else {
          throw new Error("Unsupported currency for creation relay")
        }

        await refreshAllBalances()

        setStatus("complete")
        tradeTimer.end("[creationRelay] total")
        onBridgeComplete?.()
      } catch (err) {
        tradeTimer.end("[creationRelay] total")
        const raw = err instanceof Error ? err.message : String(err)
        console.error("[creationRelay] execute failed:", err)
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
      onBridgeComplete,
      executeEvmQuoteSteps,
      executeSolanaQuoteSteps,
      readStoryUsdc,
      readSolLamports,
      estimate,
      seedRates,
    ]
  )

  const inputPerIp = estimate?.inputPerIp ?? seedRates[currency] ?? null

  return { estimate, isEstimating, status, error, execute, feeInCurrency, inputPerIp }
}
