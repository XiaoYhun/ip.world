"use client"

import BigNumber from "bignumber.js"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { type Address, encodeFunctionData, formatUnits } from "viem"
import { useBalance, usePublicClient, useReadContract } from "wagmi"
import { useEmbeddedSendTransaction } from "@/hooks/use-embedded-send-transaction"
import { useEmbeddedWriteContract } from "@/hooks/use-embedded-write-contract"
import { toast } from "sonner"
import { env } from "@/config"
import QuoterABI from "@/config/Quoter.abi.json"
import StoryHuntSwapRouterABI from "@/config/SwapRouter.abi.json"
import {
  NATIVE_CURRENCY_ADDRESS,
  RELAY_SOLANA_CHAIN_ID,
  RELAY_STORY_CHAIN_ID,
  SOLANA_NATIVE_SOL_ADDRESS,
  SOLANA_USDC_ADDRESS,
  STORY_USDC_ADDRESS,
} from "@/config/relay-chains"
import { useEmbeddedWallets } from "@/hooks/use-embedded-wallets"
import { useEnsureEmbeddedWallet } from "@/hooks/use-ensure-embedded-wallet"
import { usePoolFee } from "@/hooks/use-pool-fee"
import { useUnifiedUsdcBalance } from "@/hooks/use-unified-usdc-balance"
import { useSolanaBalances } from "@/context/solana-balances-context"
import { getRelayGeneralWithdrawQuote, pollRelayStatus } from "@/lib/relay"
import type { RelayQuoteResponse } from "@/lib/relay"
import { useRefreshAllBalances } from "@/hooks/use-refresh-all-balances"
import { useSignSolanaDeposit } from "@/hooks/use-sign-solana-deposit"

export type ConvertToken = "IP" | "SOL" | "USDC"
export type ConvertStatus = "idle" | "quoting" | "signing" | "bridging" | "swapping" | "complete" | "error"

const QUOTE_DEBOUNCE_MS = 600
const IP_GAS_RESERVE_WEI = BigInt(10) ** BigInt(15) // 0.001 IP
const SOL_GAS_RESERVE_LAMPORTS = BigInt(3_000_000) // 0.003 SOL
const SLIPPAGE_BPS = BigInt(100) // 1%
const TOAST_ID = "deposit-convert"

// Value-loss thresholds expressed as positive percentages (e.g. 5 = 5%).
// Used by the deposit modal UI to colour the "Price impact" hint. We never
// hard-block here — the user makes the call once the number is visible.
const PRICE_IMPACT_WARN_PCT = 1
const PRICE_IMPACT_SEVERE_PCT = 5

const ERC20_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const

const TOKEN_DECIMALS: Record<ConvertToken, number> = {
  IP: 18,
  SOL: 9,
  USDC: 6,
}

function toRawAmount(value: string, decimals: number): bigint {
  if (!value.trim()) return BigInt(0)
  if (Number.isNaN(Number(value))) return BigInt(0)
  return BigInt(
    new BigNumber(value)
      .times(new BigNumber(10).pow(decimals))
      .integerValue(BigNumber.ROUND_DOWN)
      .toFixed(0)
  )
}

function parseError(err: unknown): string {
  const raw = err instanceof Error ? err.message : "Transaction failed"
  if (raw.includes("User rejected") || raw.includes("user rejected")) return "Transaction cancelled."
  if (raw.includes("insufficient")) return "Insufficient balance."
  // Relay failures include the substring "quote" in paths like `/quote/v2` — only treat as generic quote failure when it is clearly a quote API error.
  if (/quote failed/i.test(raw) || /\/quote\//i.test(raw)) {
    const jsonTail = raw.match(/\{[\s\S]*\}\s*$/)
    if (jsonTail) {
      try {
        const parsed = JSON.parse(jsonTail[0]) as { message?: string }
        if (parsed.message && typeof parsed.message === "string") return parsed.message
      } catch {
        /* ignore */
      }
    }
    return "Bridge quote unavailable. Try a smaller amount or retry shortly."
  }
  return raw
}

function getStatusLabel(status: ConvertStatus): string {
  switch (status) {
    case "quoting":
      return "Getting quote..."
    case "signing":
      return "Sending..."
    case "bridging":
      return "Bridging..."
    case "swapping":
      return "Swapping..."
    case "complete":
      return "Convert complete"
    case "error":
      return "Try again"
    default:
      return "Convert"
  }
}

type RelayParams = {
  originChainId: number
  originCurrency: string
  destinationChainId: number
  destinationCurrency: string
  amount: bigint
  userAddress: string
  recipientAddress: string
}

type UseConvertParams = {
  fromToken: ConvertToken
  toToken: ConvertToken
  amountInput: string
  // Spot USD prices used to compute the realised value-impact of the conversion.
  // Optional: when missing, the impact check is skipped (degrades to prior behavior).
  ipPriceUsd?: number
  solPriceUsd?: number
}

export type UseConvertReturn = {
  amountRaw: bigint
  fromBalanceRaw: bigint
  fromBalanceLabel: string
  toBalanceLabel: string
  fromDecimals: number
  maxInputValue: string
  isQuoting: boolean
  receiveAmount: string
  receiveSymbol: string
  feeSummary: string | null
  timeEstimate: number | null
  quoteError: string | null
  status: ConvertStatus
  statusLabel: string
  error: string | null
  isExecuting: boolean
  canExecute: boolean
  disabledReason: string | null
  // Realised value impact in % (positive = user loses value, negative = user gains).
  // 0 when prices/quote are not available yet.
  priceImpactPct: number
  // Realised value delta in USD (negative = loss). 0 when prices/quote are not available.
  priceImpactUsd: number
  // True once the impact crosses the severe-warn threshold (UI signal only — never blocks the swap).
  priceImpactSevere: boolean
  execute: () => Promise<void>
}

export function useConvert({
  fromToken,
  toToken,
  amountInput,
  ipPriceUsd,
  solPriceUsd,
}: UseConvertParams): UseConvertReturn {
  const { evmAddress, solanaAddress } = useEmbeddedWallets()
  const { signSolanaDeposit } = useSignSolanaDeposit()
  const { ensureEmbeddedWallet } = useEnsureEmbeddedWallet()
  const unifiedUsdc = useUnifiedUsdcBalance()
  const { solLamports } = useSolanaBalances()
  const { fee: usdcPoolFee } = usePoolFee(STORY_USDC_ADDRESS)
  const { refreshAllBalances } = useRefreshAllBalances()
  const publicClient = usePublicClient()
  const { sendTransactionAsync } = useEmbeddedSendTransaction()
  const { writeContractAsync } = useEmbeddedWriteContract()
  const quoteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const relayQuoteGenRef = useRef(0)

  const [status, setStatus] = useState<ConvertStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [isQuoting, setIsQuoting] = useState(false)
  const [quoteError, setQuoteError] = useState<string | null>(null)
  const [receiveAmount, setReceiveAmount] = useState("0")
  const [receiveSymbol, setReceiveSymbol] = useState<ConvertToken>(toToken)
  const [feeSummary, setFeeSummary] = useState<string | null>(null)
  const [timeEstimate, setTimeEstimate] = useState<number | null>(null)

  const fromDecimals = TOKEN_DECIMALS[fromToken]
  const amountRaw = useMemo(() => toRawAmount(amountInput, fromDecimals), [amountInput, fromDecimals])

  const { data: ipBalance } = useBalance({
    address: evmAddress,
    query: { enabled: !!evmAddress, staleTime: 10_000, refetchOnWindowFocus: false },
  })

  const { refetch: refetchStoryUsdcAllowance } = useReadContract({
    address: STORY_USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: evmAddress ? [evmAddress, env.NEXT_PUBLIC_STORYHUNT_SWAP_ROUTER] : undefined,
    query: { enabled: !!evmAddress, staleTime: 15_000, refetchOnWindowFocus: false },
  })

  const fromBalanceRaw = useMemo(() => {
    if (fromToken === "IP") return ipBalance?.value ?? BigInt(0)
    if (fromToken === "SOL") return solLamports
    return unifiedUsdc.totalUsdcRaw
  }, [fromToken, ipBalance?.value, solLamports, unifiedUsdc.totalUsdcRaw])

  const maxSpendableRaw = useMemo(() => {
    if (fromToken === "IP") return fromBalanceRaw > IP_GAS_RESERVE_WEI ? fromBalanceRaw - IP_GAS_RESERVE_WEI : BigInt(0)
    if (fromToken === "SOL") return fromBalanceRaw > SOL_GAS_RESERVE_LAMPORTS ? fromBalanceRaw - SOL_GAS_RESERVE_LAMPORTS : BigInt(0)
    return fromBalanceRaw
  }, [fromBalanceRaw, fromToken])

  const fromBalanceLabel = useMemo(() => formatUnits(fromBalanceRaw, fromDecimals), [fromBalanceRaw, fromDecimals])

  const toBalanceRaw = useMemo(() => {
    if (toToken === "IP") return ipBalance?.value ?? BigInt(0)
    if (toToken === "SOL") return solLamports
    return unifiedUsdc.totalUsdcRaw
  }, [toToken, ipBalance?.value, solLamports, unifiedUsdc.totalUsdcRaw])

  const toBalanceLabel = useMemo(() => formatUnits(toBalanceRaw, TOKEN_DECIMALS[toToken]), [toBalanceRaw, toToken])

  const maxInputValue = useMemo(() => formatUnits(maxSpendableRaw, fromDecimals), [maxSpendableRaw, fromDecimals])

  // Resolve a USD spot price for a given token from the inputs the modal already fetches.
  // Returning 0 means "unknown" — callers must skip impact checks in that case.
  const usdPriceFor = useCallback(
    (token: ConvertToken): number => {
      if (token === "USDC") return 1
      if (token === "IP") return ipPriceUsd && ipPriceUsd > 0 ? ipPriceUsd : 0
      return solPriceUsd && solPriceUsd > 0 ? solPriceUsd : 0
    },
    [ipPriceUsd, solPriceUsd]
  )

  const onChainPath = (fromToken === "IP" && toToken === "USDC") || (fromToken === "USDC" && toToken === "IP")
  const relayOnlyPath =
    (fromToken === "IP" && toToken === "SOL") ||
    (fromToken === "SOL" && toToken === "IP") ||
    (fromToken === "SOL" && toToken === "USDC")
  const usdcToIpPath = fromToken === "USDC" && toToken === "IP"
  const usdcToSolPath = fromToken === "USDC" && toToken === "SOL"

  const { data: onChainQuote, isLoading: isLoadingOnChainQuote } = useReadContract({
    address: env.NEXT_PUBLIC_QUOTER_ADDRESS,
    abi: QuoterABI,
    functionName: "quoteExactInputSingle",
    args: [
      fromToken === "IP" ? env.NEXT_PUBLIC_WRAPPED_IP_TOKEN_ADDRESS : STORY_USDC_ADDRESS,
      toToken === "IP" ? env.NEXT_PUBLIC_WRAPPED_IP_TOKEN_ADDRESS : STORY_USDC_ADDRESS,
      usdcPoolFee,
      amountRaw > BigInt(0) ? amountRaw : BigInt(1),
      BigInt(0),
    ],
    query: {
      enabled: onChainPath && amountRaw > BigInt(0),
      staleTime: 10_000,
      refetchOnWindowFocus: false,
    },
  })

  const buildRelayQuoteParams = useCallback(
    (amount: bigint): RelayParams | null => {
      if (!evmAddress || !solanaAddress || amount <= BigInt(0)) return null
      if (fromToken === "IP" && toToken === "SOL") {
        return {
          originChainId: RELAY_STORY_CHAIN_ID,
          originCurrency: NATIVE_CURRENCY_ADDRESS,
          destinationChainId: RELAY_SOLANA_CHAIN_ID,
          destinationCurrency: SOLANA_NATIVE_SOL_ADDRESS,
          amount,
          userAddress: evmAddress,
          recipientAddress: solanaAddress,
        }
      }
      if (fromToken === "SOL" && toToken === "IP") {
        return {
          originChainId: RELAY_SOLANA_CHAIN_ID,
          originCurrency: SOLANA_NATIVE_SOL_ADDRESS,
          destinationChainId: RELAY_STORY_CHAIN_ID,
          destinationCurrency: NATIVE_CURRENCY_ADDRESS,
          amount,
          userAddress: solanaAddress,
          recipientAddress: evmAddress,
        }
      }
      if (fromToken === "SOL" && toToken === "USDC") {
        return {
          originChainId: RELAY_SOLANA_CHAIN_ID,
          originCurrency: SOLANA_NATIVE_SOL_ADDRESS,
          destinationChainId: RELAY_STORY_CHAIN_ID,
          destinationCurrency: STORY_USDC_ADDRESS,
          amount,
          userAddress: solanaAddress,
          recipientAddress: evmAddress,
        }
      }
      if (fromToken === "USDC" && toToken === "SOL") {
        const useSolanaUsdc = unifiedUsdc.solanaUsdcRaw > BigInt(0)
        return {
          originChainId: useSolanaUsdc ? RELAY_SOLANA_CHAIN_ID : RELAY_STORY_CHAIN_ID,
          originCurrency: useSolanaUsdc ? SOLANA_USDC_ADDRESS : STORY_USDC_ADDRESS,
          destinationChainId: RELAY_SOLANA_CHAIN_ID,
          destinationCurrency: SOLANA_NATIVE_SOL_ADDRESS,
          amount,
          userAddress: useSolanaUsdc ? solanaAddress : evmAddress,
          recipientAddress: solanaAddress,
        }
      }
      return null
    },
    [evmAddress, fromToken, solanaAddress, toToken, unifiedUsdc.solanaUsdcRaw]
  )

  useEffect(() => {
    setReceiveSymbol(toToken)
    setQuoteError(null)
    setFeeSummary(null)
    setTimeEstimate(null)

    if (quoteTimerRef.current) clearTimeout(quoteTimerRef.current)
    relayQuoteGenRef.current += 1
    const quoteRunEpoch = relayQuoteGenRef.current

    if (fromToken === toToken || amountRaw <= BigInt(0)) {
      setReceiveAmount("0")
      setIsQuoting(false)
      return
    }

    if (onChainPath) {
      setIsQuoting(isLoadingOnChainQuote)
      if (!onChainQuote) {
        setReceiveAmount("0")
        return
      }
      const quoted = Array.isArray(onChainQuote) ? BigInt(onChainQuote[0]?.toString() ?? "0") : BigInt(onChainQuote.toString())
      setReceiveAmount(formatUnits(quoted, TOKEN_DECIMALS[toToken]))
      return
    }

    const relayParams = buildRelayQuoteParams(amountRaw)
    if (!relayParams) {
      setIsQuoting(false)
      setReceiveAmount("0")
      return
    }

    const quoteRunId = quoteRunEpoch
    setIsQuoting(true)
    quoteTimerRef.current = setTimeout(async () => {
      if (quoteRunId !== relayQuoteGenRef.current) return
      try {
        const quote = await getRelayGeneralWithdrawQuote({
          originChainId: relayParams.originChainId,
          originCurrency: relayParams.originCurrency,
          destinationChainId: relayParams.destinationChainId,
          destinationCurrency: relayParams.destinationCurrency,
          amount: relayParams.amount.toString(),
          userAddress: relayParams.userAddress,
          recipientAddress: relayParams.recipientAddress,
        })
        if (quoteRunId !== relayQuoteGenRef.current) return
        const outAmount = BigInt(quote.details?.currencyOut?.amount ?? "0")
        const outDecimals = quote.details?.currencyOut?.currency?.decimals ?? TOKEN_DECIMALS[toToken]
        const outSymbol = (quote.details?.currencyOut?.currency?.symbol ?? toToken) as ConvertToken
        const gasUsd = parseFloat(quote.fees?.gas?.amountUsd ?? "0")
        const relayerUsd = parseFloat(quote.fees?.relayer?.amountUsd ?? "0")
        setReceiveAmount(formatUnits(outAmount, outDecimals))
        setReceiveSymbol(outSymbol)
        setFeeSummary(gasUsd + relayerUsd > 0 ? `~$${(gasUsd + relayerUsd).toFixed(2)} fee` : null)
        setTimeEstimate(quote.details?.timeEstimate ?? null)
        setQuoteError(null)
      } catch (err) {
        if (quoteRunId !== relayQuoteGenRef.current) return
        setQuoteError(parseError(err))
      } finally {
        if (quoteRunId === relayQuoteGenRef.current) setIsQuoting(false)
      }
    }, QUOTE_DEBOUNCE_MS)

    return () => {
      if (quoteTimerRef.current) clearTimeout(quoteTimerRef.current)
    }
  }, [amountRaw, buildRelayQuoteParams, fromToken, isLoadingOnChainQuote, onChainPath, onChainQuote, toToken])

  useEffect(() => {
    if (status === "idle") return
    if (status === "complete") {
      refreshAllBalances()
      toast.success("Conversion complete", { id: TOAST_ID, duration: 3500 })
      return
    }
    if (status === "error") {
      toast.error(error ?? "Conversion failed", { id: TOAST_ID, duration: 5000 })
      return
    }
    toast.loading(getStatusLabel(status), { id: TOAST_ID })
  }, [error, status, refreshAllBalances])

  const executeRelay = useCallback(
    async (params: RelayParams) => {
      setStatus("quoting")
      const quote: RelayQuoteResponse = await getRelayGeneralWithdrawQuote({
        originChainId: params.originChainId,
        originCurrency: params.originCurrency,
        destinationChainId: params.destinationChainId,
        destinationCurrency: params.destinationCurrency,
        amount: params.amount.toString(),
        userAddress: params.userAddress,
        recipientAddress: params.recipientAddress,
      })

      if (params.originChainId === RELAY_SOLANA_CHAIN_ID) {
        // Same-chain Solana swaps (e.g. USDC → SOL) use a "swap" step with Jupiter instructions + ALTs, not "deposit".
        const step = quote.steps?.find((s) => s.items?.some((it) => (it.data?.instructions?.length ?? 0) > 0))
        const item = step?.items?.find((it) => (it.data?.instructions?.length ?? 0) > 0)
        const data = item?.data
        const requestId = step?.requestId ?? quote.requestId
        if (!data?.instructions?.length || !requestId) throw new Error("Invalid relay quote")

        setStatus("signing")
        await signSolanaDeposit(data.instructions, {
          addressLookupTableAddresses: data.addressLookupTableAddresses,
        })

        setStatus("bridging")
        const finalStatus = await pollRelayStatus(requestId)
        if (finalStatus.status !== "success") throw new Error("Relay failed")
        return
      }

      if (params.originChainId === RELAY_STORY_CHAIN_ID) {
        const depositStep = quote.steps?.find((step) => step.id === "deposit" || step.action === "deposit")
        const depositData = depositStep?.items?.[0]?.data
        const requestId = depositStep?.requestId ?? quote.requestId
        if (!depositData || !requestId) throw new Error("Invalid relay quote")

        setStatus("signing")
        if (depositData.to) {
          await sendTransactionAsync({
            to: depositData.to as Address,
            value: BigInt(depositData.value ?? "0"),
            data: (depositData.data ?? "0x") as `0x${string}`,
          })
        } else {
          throw new Error("Unsupported relay deposit format")
        }

        setStatus("bridging")
        const finalStatus = await pollRelayStatus(requestId)
        if (finalStatus.status !== "success") throw new Error("Relay failed")
        return
      }

      throw new Error("Unsupported relay chain")
    },
    [sendTransactionAsync, signSolanaDeposit]
  )

  // Realised value impact derived from the displayed quote.
  // We compare the USD value of what the user is sending vs what they would receive.
  // Positive priceImpactPct = user loses value (slippage + fees + spread combined),
  // which is the only number that actually matters from a UX safety standpoint.
  const inputValueUsd = useMemo(() => {
    const amount = parseFloat(amountInput)
    if (!Number.isFinite(amount) || amount <= 0) return 0
    const price = usdPriceFor(fromToken)
    if (price <= 0) return 0
    return amount * price
  }, [amountInput, fromToken, usdPriceFor])

  const outputValueUsd = useMemo(() => {
    const amount = parseFloat(receiveAmount)
    if (!Number.isFinite(amount) || amount <= 0) return 0
    // `receiveSymbol` may differ from `toToken` (relay can settle in a related currency).
    const price = usdPriceFor(receiveSymbol as ConvertToken)
    if (price <= 0) return 0
    return amount * price
  }, [receiveAmount, receiveSymbol, usdPriceFor])

  const { priceImpactPct, priceImpactUsd } = useMemo(() => {
    if (inputValueUsd <= 0 || outputValueUsd <= 0) return { priceImpactPct: 0, priceImpactUsd: 0 }
    const deltaUsd = outputValueUsd - inputValueUsd
    const pct = (-deltaUsd / inputValueUsd) * 100
    return { priceImpactPct: pct, priceImpactUsd: deltaUsd }
  }, [inputValueUsd, outputValueUsd])

  const priceImpactSevere = priceImpactPct >= PRICE_IMPACT_SEVERE_PCT

  const execute = useCallback(async () => {
    if (!evmAddress || !solanaAddress) {
      setError("Embedded wallets are not ready.")
      setStatus("error")
      return
    }
    if (amountRaw <= BigInt(0) || fromToken === toToken) {
      setError("Select a valid amount and pair.")
      setStatus("error")
      return
    }
    if (fromBalanceRaw < amountRaw) {
      setError(`Insufficient ${fromToken} balance.`)
      setStatus("error")
      return
    }

    setError(null)
    try {
      void ensureEmbeddedWallet().catch(() => {})

      // On-chain Story: IP -> USDC
      if (fromToken === "IP" && toToken === "USDC") {
        const quoted = Array.isArray(onChainQuote) ? BigInt(onChainQuote[0]?.toString() ?? "0") : BigInt(onChainQuote?.toString() ?? "0")
        const minOut = quoted > BigInt(0) ? (quoted * (BigInt(10_000) - SLIPPAGE_BPS)) / BigInt(10_000) : BigInt(0)
        setStatus("swapping")
        const hash = await writeContractAsync({
          address: env.NEXT_PUBLIC_STORYHUNT_SWAP_ROUTER,
          abi: StoryHuntSwapRouterABI,
          functionName: "multicall",
          value: amountRaw,
          args: [[
            encodeFunctionData({
              abi: StoryHuntSwapRouterABI,
              functionName: "exactInputSingle",
              args: [{
                tokenIn: env.NEXT_PUBLIC_WRAPPED_IP_TOKEN_ADDRESS,
                tokenOut: STORY_USDC_ADDRESS,
                fee: usdcPoolFee,
                recipient: env.NEXT_PUBLIC_STORYHUNT_SWAP_ROUTER,
                deadline: Math.floor(Date.now() / 1000) + 60,
                amountIn: amountRaw,
                amountOutMinimum: minOut,
                sqrtPriceLimitX96: BigInt(0),
              }],
            }),
            encodeFunctionData({
              abi: StoryHuntSwapRouterABI,
              functionName: "sweepToken",
              args: [STORY_USDC_ADDRESS, BigInt(0), evmAddress],
            }),
            encodeFunctionData({
              abi: StoryHuntSwapRouterABI,
              functionName: "refundIP",
              args: [],
            }),
          ]],
        })
        if (publicClient) await publicClient.waitForTransactionReceipt({ hash })
      } else if (fromToken === "USDC" && toToken === "IP") {
        // Aggregate USDC to Story first if needed.
        const storyDeficit = amountRaw > unifiedUsdc.storyUsdcRaw ? amountRaw - unifiedUsdc.storyUsdcRaw : BigInt(0)
        if (storyDeficit > BigInt(0)) {
          await executeRelay({
            originChainId: RELAY_SOLANA_CHAIN_ID,
            originCurrency: SOLANA_USDC_ADDRESS,
            destinationChainId: RELAY_STORY_CHAIN_ID,
            destinationCurrency: STORY_USDC_ADDRESS,
            amount: storyDeficit,
            userAddress: solanaAddress,
            recipientAddress: evmAddress,
          })
        }

        const { data: allowance } = await refetchStoryUsdcAllowance()
        const currentAllowance = typeof allowance === "bigint" ? allowance : BigInt(0)
        if (currentAllowance < amountRaw) {
          setStatus("signing")
          const approveHash = await writeContractAsync({
            address: STORY_USDC_ADDRESS,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [env.NEXT_PUBLIC_STORYHUNT_SWAP_ROUTER, amountRaw],
          })
          if (publicClient) await publicClient.waitForTransactionReceipt({ hash: approveHash })
        }

        const quoted = Array.isArray(onChainQuote) ? BigInt(onChainQuote[0]?.toString() ?? "0") : BigInt(onChainQuote?.toString() ?? "0")
        const minOut = quoted > BigInt(0) ? (quoted * (BigInt(10_000) - SLIPPAGE_BPS)) / BigInt(10_000) : BigInt(0)
        setStatus("swapping")
        const swapHash = await writeContractAsync({
          address: env.NEXT_PUBLIC_STORYHUNT_SWAP_ROUTER,
          abi: StoryHuntSwapRouterABI,
          functionName: "multicall",
          args: [[
            encodeFunctionData({
              abi: StoryHuntSwapRouterABI,
              functionName: "exactInputSingle",
              args: [{
                tokenIn: STORY_USDC_ADDRESS,
                tokenOut: env.NEXT_PUBLIC_WRAPPED_IP_TOKEN_ADDRESS,
                fee: usdcPoolFee,
                recipient: env.NEXT_PUBLIC_STORYHUNT_SWAP_ROUTER,
                deadline: Math.floor(Date.now() / 1000) + 60,
                amountIn: amountRaw,
                amountOutMinimum: minOut,
                sqrtPriceLimitX96: BigInt(0),
              }],
            }),
            encodeFunctionData({
              abi: StoryHuntSwapRouterABI,
              functionName: "unwrapWIP9",
              args: [minOut, evmAddress],
            }),
            encodeFunctionData({
              abi: StoryHuntSwapRouterABI,
              functionName: "refundIP",
              args: [],
            }),
          ]],
        })
        if (publicClient) await publicClient.waitForTransactionReceipt({ hash: swapHash })
      } else if (relayOnlyPath) {
        const relayParams = buildRelayQuoteParams(amountRaw)
        if (!relayParams) throw new Error("Invalid relay path")
        await executeRelay(relayParams)
      } else if (usdcToSolPath) {
        // Use Solana USDC first, then Story USDC remainder.
        const fromSolana = amountRaw > unifiedUsdc.solanaUsdcRaw ? unifiedUsdc.solanaUsdcRaw : amountRaw
        const fromStory = amountRaw - fromSolana

        if (fromSolana > BigInt(0)) {
          await executeRelay({
            originChainId: RELAY_SOLANA_CHAIN_ID,
            originCurrency: SOLANA_USDC_ADDRESS,
            destinationChainId: RELAY_SOLANA_CHAIN_ID,
            destinationCurrency: SOLANA_NATIVE_SOL_ADDRESS,
            amount: fromSolana,
            userAddress: solanaAddress,
            recipientAddress: solanaAddress,
          })
        }
        if (fromStory > BigInt(0)) {
          await executeRelay({
            originChainId: RELAY_STORY_CHAIN_ID,
            originCurrency: STORY_USDC_ADDRESS,
            destinationChainId: RELAY_SOLANA_CHAIN_ID,
            destinationCurrency: SOLANA_NATIVE_SOL_ADDRESS,
            amount: fromStory,
            userAddress: evmAddress,
            recipientAddress: solanaAddress,
          })
        }
      } else if (usdcToIpPath) {
        throw new Error("Unsupported conversion path")
      } else {
        throw new Error("Unsupported conversion path")
      }

      setStatus("complete")
      await refreshAllBalances()
    } catch (err) {
      setError(parseError(err))
      setStatus("error")
    } finally {
      setTimeout(() => {
        setStatus("idle")
      }, 250)
    }
  }, [
    amountRaw,
    buildRelayQuoteParams,
    evmAddress,
    fromBalanceRaw,
    fromToken,
    onChainQuote,
    publicClient,
    refreshAllBalances,
    refetchStoryUsdcAllowance,
    relayOnlyPath,
    solanaAddress,
    toToken,
    unifiedUsdc,
    usdcPoolFee,
    usdcToIpPath,
    usdcToSolPath,
    writeContractAsync,
    executeRelay,
    ensureEmbeddedWallet,
  ])

  const disabledReason = useMemo(() => {
    if (fromToken === toToken) return "Select different assets"
    if (amountRaw <= BigInt(0)) return "Enter an amount"
    if (fromBalanceRaw < amountRaw) return `Insufficient ${fromToken}`
    if (!evmAddress || !solanaAddress) return "Embedded wallets unavailable"
    return null
  }, [amountRaw, evmAddress, fromBalanceRaw, fromToken, solanaAddress, toToken])

  return {
    amountRaw,
    fromBalanceRaw,
    fromBalanceLabel,
    toBalanceLabel,
    fromDecimals,
    maxInputValue,
    isQuoting,
    receiveAmount,
    receiveSymbol,
    feeSummary,
    timeEstimate,
    quoteError,
    status,
    statusLabel: getStatusLabel(status),
    error,
    isExecuting: status !== "idle" && status !== "complete" && status !== "error",
    canExecute: !disabledReason,
    disabledReason,
    priceImpactPct,
    priceImpactUsd,
    priceImpactSevere,
    execute,
  }
}
