"use client"

import BigNumber from "bignumber.js"
import { AnimatePresence, motion } from "framer-motion"
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { toast } from "sonner"
import { type Abi, Address, encodeFunctionData, encodePacked, maxUint256 } from "viem"
import { useBalance, usePublicClient, useReadContract, useReadContracts, useWaitForTransactionReceipt } from "wagmi"
import { useEmbeddedWriteContract } from "@/hooks/use-embedded-write-contract"
import { useEmbeddedSendTransaction } from "@/hooks/use-embedded-send-transaction"
import { useEmbeddedEvmWalletClient } from "@/hooks/use-embedded-evm-wallet-client"
import { useAccount } from "@/hooks/use-account"
import { useEmbeddedWallets } from "@/hooks/use-embedded-wallets"
import { useSignSolanaDeposit } from "@/hooks/use-sign-solana-deposit"
import { useEnsureEmbeddedWallet } from "@/hooks/use-ensure-embedded-wallet"
import { useUnifiedUsdcBalance } from "@/hooks/use-unified-usdc-balance"
import { useSolanaBalances } from "@/context/solana-balances-context"
import { useTradeUsdcRelay, type TradeUsdcRelayStatus } from "@/hooks/use-trade-usdc-relay"
import BigNumberInput from "@/components/bignumber-input"
import { SimpleConnectWalletButton } from "@/components/connect-wallet-button"
import AssetSelectorDropdown from "@/components/ui/asset-selector-dropdown"
import { Button } from "@/components/ui/button"
import Spinner from "@/components/ui/spinner"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { env } from "@/config"
import IPTokenABI from "@/config/IPToken.abi.json"
import QuoterABI from "@/config/Quoter.abi.json"
import StoryHuntSwapRouterABI from "@/config/SwapRouter.abi.json"
import {
  type PaymentCurrency,
  NATIVE_CURRENCY_ADDRESS,
  RELAY_SOLANA_CHAIN_ID,
  RELAY_SOL_CONFIG,
  RELAY_STORY_CHAIN_ID,
  SOLANA_NATIVE_SOL_ADDRESS,
  STORY_USDC_ADDRESS,
} from "@/config/relay-chains"
import { usePoolFee } from "@/hooks/use-pool-fee"
import { useIsMobileView } from "@/context/mobile-ui-context"
import { useIpPrice, useTokenMetricsByAddressContext } from "@/context/token-metrics-context"
import { usePaymentCurrency } from "@/context/payment-currency-context"
import { useRelaySwap, type RelaySwapStatus } from "@/hooks/use-relay-swap"
import { getRelayBridgeEstimate, getRelayGeneralWithdrawQuote, planUsdcToIpRoute, relayUserMessageFromErrorMessage } from "@/lib/relay"
import { relayStoryIpToSolana } from "@/lib/relay/story-ip-to-solana"
import { safeImageSrc } from "@/lib/safe-url"
import { tradeTimer } from "@/lib/trade-timer"
import { decodeSqrtPriceFromReceipt, computePriceFromSqrtPriceX96 } from "@/lib/swap-receipt"
import { setOptimisticMetric } from "@/stores/optimistic-metrics"
import { parseTransactionErrorMessage } from "@/lib/web3/transaction-errors"
import { useBuyPriceImpact, useSellPriceImpact } from "@/hooks/use-uniswap-v3-price-impact"
import useGetSolPrice from "@/hooks/use-get-sol-price"
import useGetUsdcPrice from "@/hooks/use-get-usdc-price"
import { bigNumberToFloat } from "@/lib/bignumber"
import { formatNumber } from "@/lib/number"
import { cn } from "@/lib/utils"
import Amount from "@/types/amount"
import { Remix } from "@/types/remix"
import { useTokenPnl } from "@/hooks/use-token-pnl"
import type { SwapRow } from "@/hooks/use-token-swaps"
import Slippage from "./slippage"
import { TradeHoldingShelfPanel, type TradeShelfPnl } from "./trade-holding-shelf"
import TradeSwitch, { Mode } from "./trade-switch"
import useGetTokenBalances from "@/hooks/use-get-token-balances"
import { useRefreshAllBalances } from "@/hooks/use-refresh-all-balances"
import { ArrowLeft, Cog, Ip, Solana, Usdc, Wallet } from "@/components/icons"
import { ArrowDown, ArrowRight } from "lucide-react"
import AnimatedNumber from "@/components/animated-number"
import DepositModal from "@/components/modals/deposit-modal"

const CURRENCY_OPTIONS: Array<{ value: PaymentCurrency; triggerLabel: string; icon?: React.ReactNode }> = [
  { value: "IP", triggerLabel: "IP", icon: <Ip size={14} /> },
  { value: "SOL", triggerLabel: "SOL", icon: <Solana size={14} /> },
  { value: "USDC", triggerLabel: "USDC", icon: <Usdc size={14} /> },
]

interface CrossChainCurrencyConfig {
  decimals: number
  definedAmounts: number[]
  feeBuffer: number
  symbol: string
}

const CROSS_CHAIN_CONFIG: Partial<Record<PaymentCurrency, CrossChainCurrencyConfig>> = {
  SOL: { decimals: 9, definedAmounts: [0.05, 0.1, 0.5], feeBuffer: 0.01, symbol: "SOL" },
}

const MIN_SOL_TX_FEE = 0.003 // SOL needed for a Solana transaction fee
const RESERVED_SWAP_TX_COUNT = BigInt(2) // current trade + one swap-back
const SUPPORTED_SWAP_FEES = [100, 500, 3000, 10000] as const

// Price-impact thresholds for the trade card UI.
// Memecoin trading legitimately produces 5–15% impact in shallow pools, so we
// only warn — never block. The user makes the call once the number is visible.
const PRICE_IMPACT_WARN_PCT = 5
const PRICE_IMPACT_SEVERE_PCT = 15

const GAS_LIMIT_APPROVE = BigInt(100_000)
const GAS_LIMIT_BUY = BigInt(750_000)
const GAS_LIMIT_SELL = BigInt(750_000)
const GAS_LIMIT_USDC_MULTIHOP = BigInt(700_000)
/** Reserve native IP on Story after a sell before bridging (matches withdraw UX). */
const STORY_IP_RELAY_GAS_RESERVE_WEI = BigInt("1000000000000000")

/** Dev-only sample data for holding shelf preview (matches Figma fixture). */
const DEBUG_TRADE_SHELF_PNL: TradeShelfPnl = {
  totalBoughtUsd: 20320,
  totalSoldUsd: 20320,
  netPnlUsd: 500.23,
  pnlPercent: 15,
  boughtQtyTokens: 1_320_000,
  soldQtyTokens: 1_320_000,
}

/**
 * Horizontal slide + fade inside each static card (direction matches Buy/Sell tab).
 * Tween (not spring) so AnimatePresence `wait` isn’t held up by spring settling.
 */
const TRADE_CARD_SLIDE = {
  type: "tween" as const,
  duration: 0.28,
  ease: [0.22, 1, 0.36, 1] as const,
}

/** Slower ease-in so fade reads while content is still moving (shared x easing hides opacity). */
const TRADE_CARD_FADE_IN = {
  type: "tween" as const,
  duration: 0.42,
  ease: [0.65, 0, 0.35, 1] as const,
}

const TRADE_CARD_FADE_OUT = {
  type: "tween" as const,
  duration: 0.2,
  ease: [0.4, 0, 0.2, 1] as const,
}

const tradeCardContentSweep = {
  initial: (to: Mode) => ({
    x: to === Mode.SELL ? "100%" : "-100%",
    opacity: 0,
  }),
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      x: TRADE_CARD_SLIDE,
      opacity: TRADE_CARD_FADE_IN,
    },
  },
  exit: (from: Mode) => ({
    x: from === Mode.SELL ? "100%" : "-100%",
    opacity: 0,
    transition: {
      x: { ...TRADE_CARD_SLIDE, duration: 0.22 },
      opacity: TRADE_CARD_FADE_OUT,
    },
  }),
}

const ERC20_ABI = [
  {
    inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const

const RELAY_STATUS_LABELS: Record<RelaySwapStatus, string> = {
  idle: "",
  quoting: "Getting quote...",
  signing: "Sending deposit...",
  bridging: "Relaying...",
  swapping: "Swapping...",
  complete: "Complete!",
  error: "Failed",
}

const TRADE_USDC_STATUS_LABELS: Record<TradeUsdcRelayStatus, string> = {
  idle: "",
  quoting: "Quoting...",
  swapping: "Swapping...",
  complete: "Complete!",
  error: "Failed",
}

function isCrossChainSol(currency: PaymentCurrency): boolean {
  return currency === "SOL"
}

function getQuotedAmount(value: unknown): bigint {
  if (typeof value === "bigint") return value
  if (Array.isArray(value)) {
    const first = value[0]
    return typeof first === "bigint" ? first : BigInt(first?.toString?.() ?? "0")
  }
  return BigInt(value?.toString?.() ?? "0")
}

export interface ExactInputSingleParams {
  tokenIn: string
  tokenOut: string
  fee: bigint
  recipient: string
  deadline: number
  amountIn: bigint
  amountOutMinimum: bigint
  sqrtPriceLimitX96: bigint
}

export type TradeDesktopLayoutRender = (parts: { toolbar: ReactNode; body: ReactNode }) => ReactNode

const Trade = ({
  remix,
  defaultMode,
  onTradeSuccess,
  onOpenPnlCard,
  desktopLayout,
  swaps,
}: {
  remix: Remix
  defaultMode?: Mode
  onTradeSuccess?: () => void
  /** Opens the shareable PnL card modal (parent owns `PnlCardDialog` state). */
  onOpenPnlCard?: () => void
  /** Desktop token page: render Buy/Sell toolbar and card body separately (hero row + full-width divider). Ignored when mobile. */
  desktopLayout?: TradeDesktopLayoutRender
  /** Electric swap rows — same overlay as the token page PnL so the holding shelf does not flicker off after a buy while /pnl refetches. */
  swaps?: SwapRow[]
}) => {
  const { address, isConnected, isReady } = useAccount()
  const { solanaAddress } = useEmbeddedWallets()
  const { ensureEmbeddedWallet } = useEnsureEmbeddedWallet()
  const { getEmbeddedWalletClient, warmEmbeddedWalletClient } = useEmbeddedEvmWalletClient()
  const { signSolanaDeposit } = useSignSolanaDeposit()
  const { fee: defaultPoolFee } = usePoolFee(remix.token_address)
  const { fee: usdcWipPoolFee } = usePoolFee(STORY_USDC_ADDRESS)

  useEffect(() => { warmEmbeddedWalletClient() }, [warmEmbeddedWalletClient])

  const { refreshAllBalances } = useRefreshAllBalances()

  const { solBalance } = useSolanaBalances()

  const unifiedUsdc = useUnifiedUsdcBalance()

  const [slippage, setSlippage] = useState(0.05)
  const [openSlippage, setOpenSlippage] = useState(false)
  const { paymentCurrency: parentPaymentCurrency } = usePaymentCurrency()
  const [paymentCurrency, setPaymentCurrency] = useState<PaymentCurrency>(parentPaymentCurrency)

  useEffect(() => {
    setPaymentCurrency(parentPaymentCurrency)
  }, [parentPaymentCurrency])

  const { sendTransactionAsync } = useEmbeddedSendTransaction()
  const [depositModalOpen, setDepositModalOpen] = useState(false)
  const isMobile = useIsMobileView()
  useGetTokenBalances(address)
  const ipPrice = useIpPrice()
  const { data: solPrice } = useGetSolPrice()
  const { data: usdcPrice } = useGetUsdcPrice()

  const tokenContract = {
    address: remix.token_address as `0x${string}`,
    abi: IPTokenABI,
  } as const

  const publicClient = usePublicClient()
  const { data: ipBalance } = useBalance({
    address,
    query: {
      staleTime: 15_000,
      gcTime: 60_000,
      refetchInterval: 15_000,
      refetchOnWindowFocus: true,
    },
  })

  const { data: remixTokenDecimals } = useReadContract({
    ...tokenContract,
    functionName: "decimals",
    query: {
      staleTime: Infinity,
      gcTime: Infinity,
      refetchOnWindowFocus: false,
    },
  })

  const { data: remixTokenBalance, refetch: refetchRemixTokenBalance } = useReadContract({
    address: remix.token_address as `0x${string}`,
    abi: IPTokenABI,
    functionName: "balanceOf",
    args: [address],
    query: {
      staleTime: 15_000,
      gcTime: 60_000,
      refetchInterval: 15_000,
      refetchOnWindowFocus: true,
    },
  })

  const wrappedIpTokenData = useMemo(
    () => ({
      address: env.NEXT_PUBLIC_WRAPPED_IP_TOKEN_ADDRESS,
      balance: ipBalance?.value as bigint,
      decimals: ipBalance?.decimals ?? 18,
      balanceNumber: ipBalance?.value ? bigNumberToFloat(ipBalance.value as bigint, ipBalance.decimals) : 0,
      symbol: "IP",
    }),
    [ipBalance]
  )

  const remixTokenData = useMemo(() => {
    const decimals =
      typeof remixTokenDecimals === "number" && Number.isFinite(remixTokenDecimals)
        ? remixTokenDecimals
        : typeof remix.decimals === "number" && Number.isFinite(remix.decimals)
          ? remix.decimals
          : 18
    return {
      address: remix.token_address as `0x${string}`,
      balance: remixTokenBalance as bigint,
      decimals,
      balanceNumber: remixTokenBalance ? bigNumberToFloat(remixTokenBalance as bigint, decimals) : 0,
      symbol: remix.symbol,
    }
  }, [remix.symbol, remix.token_address, remixTokenBalance, remixTokenDecimals, remix.decimals])

  const storyUsdcOutTokenData = useMemo(
    () => ({
      address: STORY_USDC_ADDRESS,
      balance: unifiedUsdc.storyUsdcRaw,
      decimals: 6,
      balanceNumber: unifiedUsdc.storyUsdc,
      symbol: "USDC",
    }),
    [unifiedUsdc.storyUsdc, unifiedUsdc.storyUsdcRaw]
  )

  const [mode, setMode] = useState<Mode>(defaultMode || Mode.BUY)
  const [sellReceiveCurrency, setSellReceiveCurrency] = useState<PaymentCurrency>(paymentCurrency)
  const prevModeForSellDefaultRef = useRef(mode)

  const isSellUsdcOut = mode === Mode.SELL && sellReceiveCurrency === "USDC"
  const isSellSolOut = mode === Mode.SELL && sellReceiveCurrency === "SOL"

  useEffect(() => {
    if (prevModeForSellDefaultRef.current !== Mode.SELL && mode === Mode.SELL) {
      setSellReceiveCurrency(paymentCurrency)
    }
    prevModeForSellDefaultRef.current = mode
  }, [mode, paymentCurrency])

  const [debugHoldingShelf, setDebugHoldingShelf] = useState(false)
  const [holdingShelfNonce, setHoldingShelfNonce] = useState(0)

  const { metrics } = useTokenMetricsByAddressContext()
  const livePriceUsdForPnl = Number(metrics?.price_usd ?? 0) || Number(remix.price_usd) || 0
  const { pnl: tokenPnlSnapshot, invalidate: invalidateTokenPnl } = useTokenPnl(
    remix.token_address,
    swaps,
    livePriceUsdForPnl,
  )

  const fireTradeSuccess = useCallback(() => {
    onTradeSuccess?.()
    invalidateTokenPnl()
  }, [onTradeSuccess, invalidateTokenPnl])

  const tokenData = useMemo(
    () => ({
      [Mode.BUY]: {
        tokenIn: wrappedIpTokenData,
        tokenOut: remixTokenData,
        definedAmounts: [1, 5, 10, 25],
      },
      [Mode.SELL]: {
        tokenIn: remixTokenData,
        tokenOut:
          mode === Mode.SELL && sellReceiveCurrency === "USDC"
            ? storyUsdcOutTokenData
            : wrappedIpTokenData,
        definedAmounts: [0.05, 0.1, 0.25, 0.5, 1],
      },
    }),
    [remixTokenData, wrappedIpTokenData, storyUsdcOutTokenData, mode, sellReceiveCurrency]
  )

  const [amount, setAmount] = useState<Amount>({
    valueNumber: 0,
    valueBigInt: BigInt(0),
    valueString: "",
    decimals: 18,
  })

  const isCrossChainInput = mode === Mode.BUY && isCrossChainSol(paymentCurrency)
  const isUsdcInput = mode === Mode.BUY && paymentCurrency === "USDC"
  const crossChainConfig = isCrossChainInput ? CROSS_CHAIN_CONFIG[paymentCurrency] : undefined

  const tradeUsdcRelay = useTradeUsdcRelay(amount.valueBigInt, isUsdcInput)

  const { refetch: refetchUsdcAllowance } = useReadContract({
    address: STORY_USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, env.NEXT_PUBLIC_STORYHUNT_SWAP_ROUTER] : undefined,
    query: {
      enabled: !!address && tradeUsdcRelay.canDirectSwap,
      staleTime: 30_000,
      gcTime: 60_000,
      refetchOnWindowFocus: false,
    },
  })

  const inputCurrencyData = useMemo(() => {
    if (crossChainConfig) {
      return { symbol: crossChainConfig.symbol, decimals: crossChainConfig.decimals }
    }
    if (isUsdcInput) {
      return { symbol: "USDC", decimals: 6 }
    }
    return { symbol: tokenData[mode].tokenIn.symbol, decimals: tokenData[mode].tokenIn.decimals }
  }, [crossChainConfig, isUsdcInput, mode, tokenData])

  const [wipAmountForPriceImpact, setWipAmountForPriceImpact] = useState(BigInt(0))

  useEffect(() => {
    setAmount({
      valueNumber: 0,
      valueBigInt: BigInt(0),
      valueString: "",
      decimals: inputCurrencyData.decimals,
    })
  }, [mode, tokenData, inputCurrencyData.decimals])

  useEffect(() => {
    setAmount({
      valueNumber: 0,
      valueBigInt: BigInt(0),
      valueString: "",
      decimals: inputCurrencyData.decimals,
    })
  }, [paymentCurrency, inputCurrencyData.decimals])

  const handleUpdateAmount = useCallback(
    (value: string) => {
      setAmount({
        valueNumber: parseFloat(value),
        valueBigInt: BigInt(
          new BigNumber(value.length ? value : 0)
            .times(new BigNumber(10).pow(inputCurrencyData.decimals))
            .toFixed(0)
        ),
        valueString: value,
        decimals: inputCurrencyData.decimals,
      })
    },
    [inputCurrencyData.decimals]
  )

  const calculateMaxBuyAmount = useCallback(() => {
    const estimatedGasUnits = BigInt(200000)
    const gasPrice = BigInt(20000000000)
    const estimatedGasCost = estimatedGasUnits * gasPrice * RESERVED_SWAP_TX_COUNT
    const gasCostWithBuffer = estimatedGasCost + (estimatedGasCost * BigInt(20)) / BigInt(100)
    const maxAmountAfterGas =
      wrappedIpTokenData.balance > gasCostWithBuffer ? wrappedIpTokenData.balance - gasCostWithBuffer : BigInt(0)
    const maxAmountNumber =
      maxAmountAfterGas > BigInt(0) ? bigNumberToFloat(maxAmountAfterGas, wrappedIpTokenData.decimals) : 0
    setAmount({
      valueNumber: maxAmountNumber,
      valueBigInt: maxAmountAfterGas,
      valueString: `${maxAmountNumber}`,
      decimals: wrappedIpTokenData.decimals,
    })
  }, [wrappedIpTokenData])

  const calculateMaxCrossChainAmount = useCallback(() => {
    if (!crossChainConfig) return
    const rawBalance = solBalance ?? 0
    const maxAmount = Math.max(0, rawBalance - crossChainConfig.feeBuffer)
    const smallest = BigInt(Math.floor(maxAmount * 10 ** crossChainConfig.decimals))
    setAmount({
      valueNumber: maxAmount,
      valueBigInt: smallest,
      valueString: maxAmount > 0 ? `${maxAmount}` : "",
      decimals: crossChainConfig.decimals,
    })
  }, [crossChainConfig, solBalance])

  const calculateMaxUsdcAmount = useCallback(() => {
    const maxAmount = unifiedUsdc.totalUsdc
    const smallest = unifiedUsdc.totalUsdcRaw
    setAmount({
      valueNumber: maxAmount,
      valueBigInt: smallest,
      valueString: maxAmount > 0 ? `${maxAmount}` : "",
      decimals: 6,
    })
  }, [unifiedUsdc.totalUsdc, unifiedUsdc.totalUsdcRaw])

  const calculateMaxSellAmount = useCallback(() => {
    setAmount({
      valueNumber: remixTokenData.balanceNumber,
      valueBigInt: remixTokenData.balance,
      valueString: `${remixTokenData.balanceNumber}`,
      decimals: remixTokenData.decimals,
    })
  }, [remixTokenData])

  const FALLBACK_GAS_RESERVE = BigInt(5) * BigInt(10) ** BigInt(16) // 0.05 IP
  const GAS_RESERVE_THRESHOLD = BigInt(10) ** BigInt(16) // 0.01 IP
  const fallbackNeedsGasReserve = (ipBalance?.value ?? BigInt(0)) < GAS_RESERVE_THRESHOLD

  const [isTrading, setIsTrading] = useState(false)
  const isTradingRef = useRef(false)
  const tradeBlockedReasonRef = useRef<string | null>(null)

  // --- Relay bridge estimate: SOL cross-chain → IP (debounced) ---
  const [crossChainEstimatedIpWei, setCrossChainEstimatedIpWei] = useState<bigint>(BigInt(0))
  const [isLoadingRelayEstimate, setIsLoadingRelayEstimate] = useState(false)
  const [relayEstimateUsdPerInput, setRelayEstimateUsdPerInput] = useState(0)
  const [relayBridgeQuoteError, setRelayBridgeQuoteError] = useState<string | null>(null)
  const relayEstimateTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (relayEstimateTimer.current) clearTimeout(relayEstimateTimer.current)

    if (!isCrossChainInput || amount.valueBigInt <= BigInt(0) || !address || !solanaAddress) {
      setCrossChainEstimatedIpWei(BigInt(0))
      setIsLoadingRelayEstimate(false)
      setRelayBridgeQuoteError(null)
      return
    }

    setIsLoadingRelayEstimate(true)
    setRelayBridgeQuoteError(null)

    relayEstimateTimer.current = setTimeout(async () => {
      try {
        const est = await getRelayBridgeEstimate({
          originChainId: RELAY_SOL_CONFIG.chainId,
          originCurrency: RELAY_SOL_CONFIG.currencyAddress,
          amount: amount.valueBigInt.toString(),
          userAddress: solanaAddress,
          recipientAddress: address,
        })

        const gasReserve =
          fallbackNeedsGasReserve && est.estimatedIpWei > FALLBACK_GAS_RESERVE * BigInt(2)
            ? FALLBACK_GAS_RESERVE
            : BigInt(0)
        const netIp = est.estimatedIpWei - gasReserve

        setCrossChainEstimatedIpWei(netIp > BigInt(0) ? netIp : BigInt(0))
        setRelayEstimateUsdPerInput(est.usdPerInputToken)
        setRelayBridgeQuoteError(null)
      } catch (e) {
        setCrossChainEstimatedIpWei(BigInt(0))
        setRelayEstimateUsdPerInput(0)
        setRelayBridgeQuoteError(relayUserMessageFromErrorMessage(e instanceof Error ? e.message : String(e)))
      } finally {
        setIsLoadingRelayEstimate(false)
      }
    }, 500)

    return () => {
      if (relayEstimateTimer.current) {
        clearTimeout(relayEstimateTimer.current)
        relayEstimateTimer.current = null
      }
      setIsLoadingRelayEstimate(false)
    }
  }, [isCrossChainInput, amount.valueBigInt, address, solanaAddress, fallbackNeedsGasReserve, FALLBACK_GAS_RESERVE])

  const quoterAmountIn = useMemo(() => {
    if (isCrossChainInput && crossChainEstimatedIpWei > BigInt(0)) return crossChainEstimatedIpWei
    return amount.valueBigInt
  }, [isCrossChainInput, crossChainEstimatedIpWei, amount.valueBigInt])

  // For relay USDC buys, the relay estimate gives us the equivalent IP amount
  const usdcRelayEstimatedIpWei = tradeUsdcRelay.estimate?.estimatedIpWei ?? BigInt(0)

  // For direct USDC buys, quote USDC -> WIP on-chain to get intermediate WIP amount
  const { data: usdcToWipQuote, isLoading: isLoadingUsdcToWip } = useReadContract({
    address: env.NEXT_PUBLIC_QUOTER_ADDRESS,
    abi: QuoterABI,
    functionName: "quoteExactInputSingle",
    args: [
      STORY_USDC_ADDRESS,
      env.NEXT_PUBLIC_WRAPPED_IP_TOKEN_ADDRESS,
      usdcWipPoolFee,
      amount.valueBigInt > BigInt(0) ? amount.valueBigInt : BigInt(1),
      BigInt(0),
    ],
    query: {
      enabled: tradeUsdcRelay.canDirectSwap,
      staleTime: 15_000,
      gcTime: 30_000,
      refetchOnWindowFocus: false,
    },
  })

  const directUsdcWipAmount = useMemo(() => {
    if (!tradeUsdcRelay.canDirectSwap || !usdcToWipQuote) return BigInt(0)
    if (Array.isArray(usdcToWipQuote)) return BigInt(usdcToWipQuote[0]?.toString() ?? "0")
    return BigInt(usdcToWipQuote.toString())
  }, [tradeUsdcRelay.canDirectSwap, usdcToWipQuote])

  const usdcEffectiveIpWei = tradeUsdcRelay.canDirectSwap ? directUsdcWipAmount : usdcRelayEstimatedIpWei

  useEffect(() => {
    if (mode !== Mode.BUY) {
      setWipAmountForPriceImpact(BigInt(0))
    } else if (isCrossChainInput && crossChainEstimatedIpWei > BigInt(0)) {
      setWipAmountForPriceImpact(crossChainEstimatedIpWei)
    } else if (isUsdcInput && usdcEffectiveIpWei > BigInt(0)) {
      setWipAmountForPriceImpact(usdcEffectiveIpWei)
    } else if (!isCrossChainInput && !isUsdcInput) {
      setWipAmountForPriceImpact(amount.valueBigInt)
    } else {
      setWipAmountForPriceImpact(BigInt(0))
    }
  }, [mode, isCrossChainInput, crossChainEstimatedIpWei, isUsdcInput, usdcEffectiveIpWei, amount.valueBigInt])

  const effectiveQuoterAmount = useMemo(() => {
    if (isUsdcInput && usdcEffectiveIpWei > BigInt(0)) return usdcEffectiveIpWei
    if (isCrossChainInput && crossChainEstimatedIpWei > BigInt(0)) return crossChainEstimatedIpWei
    return quoterAmountIn
  }, [isUsdcInput, usdcEffectiveIpWei, isCrossChainInput, crossChainEstimatedIpWei, quoterAmountIn])

  const isLoadingUsdcEstimate = tradeUsdcRelay.canDirectSwap ? isLoadingUsdcToWip : tradeUsdcRelay.isEstimating

  const singleHopQuoterEnabled =
    effectiveQuoterAmount > BigInt(0) &&
    !isSellUsdcOut &&
    !(isCrossChainInput && isLoadingRelayEstimate) &&
    !(isUsdcInput && isLoadingUsdcEstimate)

  const {
    data: estimatedAmountOut,
    isLoading: isLoadingQuoter,
    error: estimatedAmountOutError,
  } = useReadContract({
    address: env.NEXT_PUBLIC_QUOTER_ADDRESS,
    abi: QuoterABI,
    functionName: "quoteExactInputSingle",
    args: [
      tokenData[mode].tokenIn.address,
      tokenData[mode].tokenOut.address,
      defaultPoolFee,
      effectiveQuoterAmount > BigInt(0) ? effectiveQuoterAmount : BigInt(1),
      BigInt(0),
    ],
    query: {
      enabled: singleHopQuoterEnabled,
      staleTime: 15_000,
      gcTime: 30_000,
      refetchInterval: 15_000,
      refetchOnWindowFocus: false,
    },
  })

  const { data: executableQuoteCandidates, isLoading: isLoadingExecutableQuotes } = useReadContracts({
    contracts: SUPPORTED_SWAP_FEES.map((fee) => ({
      address: env.NEXT_PUBLIC_QUOTER_ADDRESS,
      abi: QuoterABI as Abi,
      functionName: "quoteExactInputSingle",
      args: [
        tokenData[mode].tokenIn.address,
        tokenData[mode].tokenOut.address,
        fee,
        effectiveQuoterAmount > BigInt(0) ? effectiveQuoterAmount : BigInt(1),
        BigInt(0),
      ],
    })),
    query: {
      enabled: singleHopQuoterEnabled,
      staleTime: 15_000,
      gcTime: 30_000,
      refetchInterval: 15_000,
      refetchOnWindowFocus: false,
    },
  })

  const sellUsdcMultihopPaths = useMemo(
    () =>
      SUPPORTED_SWAP_FEES.map((fee) =>
        encodePacked(
          ["address", "uint24", "address", "uint24", "address"],
          [
            remix.token_address as `0x${string}`,
            Number(fee),
            env.NEXT_PUBLIC_WRAPPED_IP_TOKEN_ADDRESS,
            Number(usdcWipPoolFee),
            STORY_USDC_ADDRESS,
          ],
        ),
      ),
    [remix.token_address, usdcWipPoolFee],
  )

  const { data: sellUsdcExecutableCandidates, isLoading: isLoadingSellUsdcQuotes } = useReadContracts({
    contracts: sellUsdcMultihopPaths.map((path) => ({
      address: env.NEXT_PUBLIC_QUOTER_ADDRESS,
      abi: QuoterABI as Abi,
      functionName: "quoteExactInput",
      args: [path, effectiveQuoterAmount > BigInt(0) ? effectiveQuoterAmount : BigInt(1)],
    })),
    query: {
      enabled:
        isSellUsdcOut &&
        effectiveQuoterAmount > BigInt(0) &&
        !(isCrossChainInput && isLoadingRelayEstimate) &&
        !(isUsdcInput && isLoadingUsdcEstimate),
      staleTime: 15_000,
      gcTime: 30_000,
      refetchInterval: 15_000,
      refetchOnWindowFocus: false,
    },
  })

  const bestExecutableQuote = useMemo(() => {
    if (!executableQuoteCandidates?.length) {
      return null
    }

    let best: { fee: bigint; amountOut: bigint } | null = null

    for (let index = 0; index < executableQuoteCandidates.length; index++) {
      const result = executableQuoteCandidates[index]
      if (result.status !== "success") {
        continue
      }

      const amountOut = getQuotedAmount(result.result)
      if (amountOut <= BigInt(0)) {
        continue
      }

      if (!best || amountOut > best.amountOut) {
        best = {
          fee: BigInt(SUPPORTED_SWAP_FEES[index]),
          amountOut,
        }
      }
    }

    return best
  }, [executableQuoteCandidates])

  const bestSellUsdcMultihopQuote = useMemo(() => {
    if (!sellUsdcExecutableCandidates?.length) {
      return null
    }
    let best: { fee: bigint; amountOut: bigint } | null = null
    for (let index = 0; index < sellUsdcExecutableCandidates.length; index++) {
      const result = sellUsdcExecutableCandidates[index]
      if (result.status !== "success") continue
      const amountOut = getQuotedAmount(result.result)
      if (amountOut <= BigInt(0)) continue
      if (!best || amountOut > best.amountOut) {
        best = { fee: BigInt(SUPPORTED_SWAP_FEES[index]), amountOut }
      }
    }
    return best
  }, [sellUsdcExecutableCandidates])

  const selectedSwapFee = isSellUsdcOut
    ? bestSellUsdcMultihopQuote?.fee ?? defaultPoolFee
    : bestExecutableQuote?.fee ?? defaultPoolFee
  const estimatedIpOutForSellSolRelay = isSellSolOut
    ? bestExecutableQuote?.amountOut ?? getQuotedAmount(estimatedAmountOut)
    : BigInt(0)
  const estimatedAmountOutRaw = isSellUsdcOut
    ? bestSellUsdcMultihopQuote?.amountOut ?? BigInt(0)
    : bestExecutableQuote?.amountOut ?? getQuotedAmount(estimatedAmountOut)
  const hasExecutableDirectQuote = estimatedAmountOutRaw > BigInt(0)

  const [sellSolRelayOutHuman, setSellSolRelayOutHuman] = useState(0)
  const [sellSolRelayFeeUsd, setSellSolRelayFeeUsd] = useState<string | null>(null)
  const [sellSolRelayQuoteError, setSellSolRelayQuoteError] = useState<string | null>(null)
  const sellSolRelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isLoadingSellSolRelayQuote, setIsLoadingSellSolRelayQuote] = useState(false)

  useEffect(() => {
    if (sellSolRelayTimerRef.current) clearTimeout(sellSolRelayTimerRef.current)
    if (!isSellSolOut || !address || !solanaAddress || estimatedIpOutForSellSolRelay <= BigInt(0)) {
      setSellSolRelayOutHuman(0)
      setSellSolRelayFeeUsd(null)
      setSellSolRelayQuoteError(null)
      setIsLoadingSellSolRelayQuote(false)
      return
    }
    setIsLoadingSellSolRelayQuote(true)
    setSellSolRelayQuoteError(null)
    sellSolRelayTimerRef.current = setTimeout(async () => {
      try {
        const quote = await getRelayGeneralWithdrawQuote({
          originChainId: RELAY_STORY_CHAIN_ID,
          originCurrency: NATIVE_CURRENCY_ADDRESS,
          destinationChainId: RELAY_SOLANA_CHAIN_ID,
          destinationCurrency: SOLANA_NATIVE_SOL_ADDRESS,
          amount: estimatedIpOutForSellSolRelay.toString(),
          userAddress: address,
          recipientAddress: solanaAddress,
        })
        const outAmt = BigInt(quote.details?.currencyOut?.amount ?? "0")
        const outDec = quote.details?.currencyOut?.currency?.decimals ?? 9
        setSellSolRelayOutHuman(bigNumberToFloat(outAmt, outDec))
        const gasUsd = parseFloat(quote.fees?.gas?.amountUsd ?? "0")
        const relayUsd = parseFloat(quote.fees?.relayer?.amountUsd ?? "0")
        setSellSolRelayFeeUsd(gasUsd + relayUsd > 0 ? (gasUsd + relayUsd).toFixed(2) : null)
        setSellSolRelayQuoteError(null)
      } catch (e) {
        setSellSolRelayOutHuman(0)
        setSellSolRelayFeeUsd(null)
        setSellSolRelayQuoteError(relayUserMessageFromErrorMessage(e instanceof Error ? e.message : String(e)))
      } finally {
        setIsLoadingSellSolRelayQuote(false)
      }
    }, 400)
    return () => {
      if (sellSolRelayTimerRef.current) clearTimeout(sellSolRelayTimerRef.current)
    }
  }, [isSellSolOut, address, solanaAddress, estimatedIpOutForSellSolRelay])

  const isLoadingEstimatedAmountOut =
    isLoadingExecutableQuotes ||
    isLoadingQuoter ||
    (isSellUsdcOut && isLoadingSellUsdcQuotes) ||
    (isCrossChainInput && isLoadingRelayEstimate) ||
    (isUsdcInput && isLoadingUsdcEstimate) ||
    (isSellSolOut && isLoadingSellSolRelayQuote)

  const isEstimatedAmountOutAntiSnipeBlocked = !hasExecutableDirectQuote && estimatedAmountOutError?.message?.includes(
    "reverted with the following reason:\nTF"
  )

  const estimatedAmountOutNumber = useMemo(() => {
    if (isSellSolOut && sellSolRelayOutHuman > 0) return sellSolRelayOutHuman
    if (estimatedAmountOutRaw <= BigInt(0)) return 0
    const d = tokenData[mode].tokenOut.decimals
    const decimals = typeof d === "number" && Number.isFinite(d) ? d : 18
    const n = bigNumberToFloat(estimatedAmountOutRaw, decimals)
    return Number.isFinite(n) ? n : 0
  }, [estimatedAmountOutRaw, isSellSolOut, mode, sellSolRelayOutHuman, tokenData])

  const buyPriceImpactResult = useBuyPriceImpact({
    tokenAddress: remix.token_address as Address,
    buyAmount: wipAmountForPriceImpact,
    enabled: mode === Mode.BUY && wipAmountForPriceImpact > BigInt(0),
    fee: selectedSwapFee,
  })

  const sellPriceImpactResult = useSellPriceImpact({
    tokenAddress: remix.token_address as Address,
    sellAmount: mode === Mode.SELL ? amount.valueBigInt : BigInt(0),
    enabled: mode === Mode.SELL && amount.valueBigInt > 0,
    fee: selectedSwapFee,
  })

  const onChainPriceImpactResult = mode === Mode.BUY ? buyPriceImpactResult : sellPriceImpactResult

  const {
    isPending: isPendingTx,
    data,
    receipt: pipelineReceipt,
    writeContractAsync: _writeContractAsync,
    // writeContractWithPipeline,
    writeContractOptimistic,
  } = useEmbeddedWriteContract()

  // Wrap writeContractAsync to push optimistic metrics as soon as tx hash is available
  const writeContractAsync = useCallback(
    async (...args: Parameters<typeof _writeContractAsync>) => {
      const hash = await _writeContractAsync(...args)
      // Fire-and-forget: fetch receipt → decode sqrtPriceX96 → push optimistic price
      if (publicClient && remix.token_address && ipPrice) {
        publicClient.waitForTransactionReceipt({ hash }).then((receipt) => {
          const sqrtPriceX96 = decodeSqrtPriceFromReceipt(receipt.logs)
          if (sqrtPriceX96) {
            const { priceUsd, marketCapUsd } = computePriceFromSqrtPriceX96(
              sqrtPriceX96,
              remix.token_address,
              ipPrice,
            )
            setOptimisticMetric(remix.token_address, {
              priceUsd,
              marketCapUsd,
              timestamp: Date.now(),
            })
            // Push optimistic price to TradingView chart
            window.dispatchEvent(new CustomEvent("optimistic-price-update", {
              detail: { tokenAddress: remix.token_address, priceUsd },
            }))
          }
        }).catch(() => { })
      }
      return hash
    },
    [_writeContractAsync, publicClient, remix.token_address, ipPrice],
  )

  const handleBridgeComplete = useCallback(async () => {
    if (!publicClient || !address) throw new Error("Missing client or address")

    tradeTimer.start("[trade] bridgeComplete:settlementPoll")
    const SETTLEMENT_POLL_FAST = 100
    const SETTLEMENT_POLL_SLOW = 200
    const SETTLEMENT_FAST_WINDOW = 5_000
    const SETTLEMENT_TIMEOUT = 30_000
    const startBalance = await publicClient.getBalance({ address })
    const startTime = Date.now()

    let settledBalance = startBalance
    while (Date.now() - startTime < SETTLEMENT_TIMEOUT) {
      settledBalance = await publicClient.getBalance({ address })
      if (settledBalance > startBalance) break
      const elapsed = Date.now() - startTime
      await new Promise((r) => setTimeout(r, elapsed < SETTLEMENT_FAST_WINDOW ? SETTLEMENT_POLL_FAST : SETTLEMENT_POLL_SLOW))
    }
    tradeTimer.end("[trade] bridgeComplete:settlementPoll")

    if (settledBalance <= startBalance) {
      throw new Error("Bridged IP did not arrive. Check your wallet and try swapping with IP directly")
    }

    const arrivedAmount = settledBalance - startBalance
    tradeTimer.log(`[trade] bridgeComplete: arrived ${arrivedAmount.toString()} wei IP`)

    const gasReserve = fallbackNeedsGasReserve && arrivedAmount > FALLBACK_GAS_RESERVE * BigInt(2)
      ? FALLBACK_GAS_RESERVE
      : BigInt(0)
    const swapAmount = arrivedAmount - gasReserve

    const scaledEstimatedOut = estimatedAmountOutRaw > BigInt(0)
      ? (estimatedAmountOutRaw * swapAmount) / (arrivedAmount > BigInt(0) ? arrivedAmount : BigInt(1))
      : BigInt(0)
    const slippageBps = BigInt(Math.floor(slippage * 10000))
    const amountOutMinimum = scaledEstimatedOut > BigInt(0)
      ? (scaledEstimatedOut * (BigInt(10000) - slippageBps)) / BigInt(10000)
      : BigInt(0)

    const exactInputSingleParams = {
      tokenIn: env.NEXT_PUBLIC_WRAPPED_IP_TOKEN_ADDRESS,
      tokenOut: remix.token_address,
      fee: selectedSwapFee,
      recipient: env.NEXT_PUBLIC_STORYHUNT_SWAP_ROUTER,
      amountIn: swapAmount,
      amountOutMinimum,
      sqrtPriceLimitX96: BigInt(0),
      deadline: Math.floor(Date.now() / 1000) + 120,
    }

    tradeTimer.start("[trade] bridgeComplete:swapTx")
    await writeContractAsync({
      address: env.NEXT_PUBLIC_STORYHUNT_SWAP_ROUTER,
      abi: StoryHuntSwapRouterABI,
      functionName: "multicall",
      value: swapAmount,
      args: [
        [
          encodeFunctionData({
            abi: StoryHuntSwapRouterABI,
            functionName: "exactInputSingle",
            args: [exactInputSingleParams],
          }),
          encodeFunctionData({
            abi: StoryHuntSwapRouterABI,
            functionName: "sweepToken",
            args: [env.NEXT_PUBLIC_WRAPPED_IP_TOKEN_ADDRESS, BigInt(0), address as Address],
          }),
          encodeFunctionData({
            abi: StoryHuntSwapRouterABI,
            functionName: "sweepToken",
            args: [remix.token_address as Address, BigInt(0), address as Address],
          }),
          encodeFunctionData({
            abi: StoryHuntSwapRouterABI,
            functionName: "refundIP",
            args: [],
          }),
        ],
      ],
      gas: GAS_LIMIT_BUY,
    })
    tradeTimer.end("[trade] bridgeComplete:swapTx")

    refreshAllBalances()
    refetchRemixTokenBalance()
    fireTradeSuccess()
  }, [address, publicClient, estimatedAmountOutRaw, fallbackNeedsGasReserve, selectedSwapFee, refreshAllBalances, refetchRemixTokenBalance, remix.token_address, slippage, writeContractAsync, fireTradeSuccess])

  const relaySwap = useRelaySwap({
    tokenAddress: remix.token_address as Address,
    paymentCurrency,
    amount: amount.valueBigInt,
    estimatedIpAmount: isCrossChainInput ? crossChainEstimatedIpWei : undefined,
    slippage,
    enabled: isCrossChainSol(paymentCurrency) && !!address,
    solanaAddress,
    ipBalance: ipBalance?.value,
    fee: selectedSwapFee,
    onBridgeComplete: handleBridgeComplete,
    signSolanaDeposit,
  })

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError,
  } = useWaitForTransactionReceipt({
    hash: data,
    pollingInterval: 2_000,
    query: {
      refetchOnWindowFocus: false,
    },
  })

  const {
    data: remixTokenAllowanceForPool,
    refetch: refetchRemixTokenAllowanceForPool,
  } = useReadContract({
    address: remix.token_address as `0x${string}`,
    abi: IPTokenABI,
    functionName: "allowance",
    args: [address, env.NEXT_PUBLIC_STORYHUNT_SWAP_ROUTER],
    query: {
      staleTime: 30_000,
      gcTime: 60_000,
      refetchOnWindowFocus: false,
    },
  })

  const RELAY_TOAST_ID = "relay-swap"
  const USDC_RELAY_TOAST_ID = "usdc-swap"
  const sellSolAwaitingRelayRef = useRef(false)

  const confirmTimerHashRef = useRef<`0x${string}` | undefined>(undefined)
  useEffect(() => {
    if (data && data !== confirmTimerHashRef.current && isTradingRef.current) {
      confirmTimerHashRef.current = data
      tradeTimer.start("[trade] txConfirmation:wait")
    }
  }, [data])

  const silentApproveForSell = useCallback(() => {
    const allowance = typeof remixTokenAllowanceForPool === "bigint" ? remixTokenAllowanceForPool : BigInt(0)
    if (allowance > BigInt(0)) return
    getEmbeddedWalletClient()
      .then((client) =>
        client.writeContract({
          address: remix.token_address as `0x${string}`,
          abi: IPTokenABI as Abi,
          functionName: "approve",
          args: [env.NEXT_PUBLIC_STORYHUNT_SWAP_ROUTER, maxUint256],
          gas: GAS_LIMIT_APPROVE,
          chain: client.chain,
          account: client.account!,
        })
      )
      .catch(() => { })
  }, [remix.token_address, remixTokenAllowanceForPool, getEmbeddedWalletClient])

  const lastConfirmedHash = useRef<`0x${string}` | undefined>(undefined)
  const isReceiptConfirmed = isConfirmed || !!pipelineReceipt
  useEffect(() => {
    if (!isReceiptConfirmed || !data || data === lastConfirmedHash.current) return
    if (sellSolAwaitingRelayRef.current) {
      tradeTimer.end("[trade] txConfirmation:wait")
      if (data !== lastConfirmedHash.current) lastConfirmedHash.current = data
      return
    }
    lastConfirmedHash.current = data
    if (!isTradingRef.current && !isTrading) return

    tradeTimer.end("[trade] txConfirmation:wait")
    toast.dismiss(USDC_RELAY_TOAST_ID)
    toast.success("Transaction success")
    setIsTrading(false)
    isTradingRef.current = false
    refreshAllBalances()
    refetchRemixTokenBalance()
    refetchRemixTokenAllowanceForPool()
    fireTradeSuccess()

    if (mode === Mode.BUY) silentApproveForSell()

    const confirmType =
      paymentCurrency === "USDC" && mode === Mode.BUY
        ? "USDC → Token"
        : mode === Mode.BUY
          ? "IP Buy"
          : sellReceiveCurrency === "USDC"
            ? "Token → USDC"
            : sellReceiveCurrency === "SOL"
              ? "Token → SOL"
              : "IP Sell"
    tradeTimer.summary(`${confirmType} (confirmed)`)
  }, [isReceiptConfirmed, data, isTrading, refreshAllBalances, refetchRemixTokenAllowanceForPool, refetchRemixTokenBalance, fireTradeSuccess, paymentCurrency, mode, sellReceiveCurrency, silentApproveForSell])

  useEffect(() => {
    if (isError) {
      sellSolAwaitingRelayRef.current = false
      tradeTimer.end("[trade] txConfirmation:wait")
      tradeTimer.log("[trade] tx reverted on-chain")
      toast.dismiss(USDC_RELAY_TOAST_ID)
      toast.error("transaction failed, please try again")
      setIsTrading(false)
      isTradingRef.current = false
      tradeTimer.summary("FAILED TX")
    }
  }, [isError]) 

  const relayToastShownRef = useRef<RelaySwapStatus | null>(null)
  useEffect(() => {
    const s = relaySwap.status
    if (s === "idle") {
      relayToastShownRef.current = null
      return
    }
    if (s === relayToastShownRef.current) return
    relayToastShownRef.current = s

    if (s === "complete") {
      toast.success("Transaction success", { id: RELAY_TOAST_ID, duration: 4000 })
      setIsTrading(false)
      isTradingRef.current = false
      setTimeout(() => relaySwap.reset(), 100)
      refreshAllBalances()
      refetchRemixTokenBalance()
      fireTradeSuccess()
      silentApproveForSell()
    } else if (s === "error") {
      toast.error(relaySwap.error || "Cross-chain swap failed", { id: RELAY_TOAST_ID, duration: 5000 })
      setIsTrading(false)
      isTradingRef.current = false
      setTimeout(() => relaySwap.reset(), 100)
    } else {
      toast.loading(RELAY_STATUS_LABELS[s], { id: RELAY_TOAST_ID })
    }
  }, [relaySwap.status, relaySwap.error, refreshAllBalances, refetchRemixTokenBalance, fireTradeSuccess, silentApproveForSell])

  const usdcRelayToastRef = useRef<TradeUsdcRelayStatus | null>(null)
  useEffect(() => {
    const s = tradeUsdcRelay.status
    if (s === "idle") {
      usdcRelayToastRef.current = null
      return
    }
    if (s === usdcRelayToastRef.current) return
    usdcRelayToastRef.current = s

    if (s === "complete") {
      if (isTradingRef.current) {
        toast.loading("Swapping...", { id: USDC_RELAY_TOAST_ID })
      } else {
        toast.success(TRADE_USDC_STATUS_LABELS[s], { id: USDC_RELAY_TOAST_ID, duration: 3000 })
      }
    } else if (s === "error") {
      toast.error(tradeUsdcRelay.error || "USDC swap failed", { id: USDC_RELAY_TOAST_ID, duration: 5000 })
      setIsTrading(false)
      isTradingRef.current = false
    } else {
      toast.loading(TRADE_USDC_STATUS_LABELS[s], { id: USDC_RELAY_TOAST_ID })
    }
  }, [tradeUsdcRelay.status, tradeUsdcRelay.error])

  const handleApprove = useCallback(async () => {
    const client = await getEmbeddedWalletClient()

    if (mode === Mode.BUY && !tradeUsdcRelay.canDirectSwap) {
      tradeTimer.log("[trade] approve:buy:skipped (native IP needs no approval)")
      return
    }

    // Direct USDC buy: approve USDC for the swap router
    if (mode === Mode.BUY && tradeUsdcRelay.canDirectSwap) {
      const { data: freshAllowance } = await refetchUsdcAllowance()
      const allowance = typeof freshAllowance === "bigint" ? freshAllowance : BigInt(0)
      if (allowance < amount.valueBigInt) {
        tradeTimer.start("[trade] approve:usdc:send")
        const hash = await client.writeContract({
          address: STORY_USDC_ADDRESS,
          abi: IPTokenABI as Abi,
          functionName: "approve",
          args: [env.NEXT_PUBLIC_STORYHUNT_SWAP_ROUTER, maxUint256],
          gas: GAS_LIMIT_APPROVE,
          chain: client.chain,
          account: client.account!,
        })
        tradeTimer.end("[trade] approve:usdc:send")
        tradeTimer.start("[trade] approve:usdc:confirm")
        if (publicClient) await publicClient.waitForTransactionReceipt({ hash })
        tradeTimer.end("[trade] approve:usdc:confirm")
      } else {
        tradeTimer.log("[trade] approve:usdc:skipped (allowance sufficient)")
      }
      return
    }

    const { data: freshSellAllowance } = await refetchRemixTokenAllowanceForPool()
    const sellAllowance = typeof freshSellAllowance === "bigint" ? freshSellAllowance : BigInt(0)

    if (
      mode === Mode.SELL &&
      sellAllowance < amount.valueBigInt
    ) {
      toast.loading("Approving token for trading...", { id: "sell-approve" })
      tradeTimer.start("[trade] approve:sell:send")
      const hash = await client.writeContract({
        address: remix.token_address as `0x${string}`,
        abi: IPTokenABI as Abi,
        functionName: "approve",
        args: [env.NEXT_PUBLIC_STORYHUNT_SWAP_ROUTER, maxUint256],
        gas: GAS_LIMIT_APPROVE,
        chain: client.chain,
        account: client.account!,
      })
      tradeTimer.end("[trade] approve:sell:send")
      tradeTimer.start("[trade] approve:sell:confirm")
      if (publicClient) await publicClient.waitForTransactionReceipt({ hash })
      tradeTimer.end("[trade] approve:sell:confirm")
      toast.dismiss("sell-approve")
    } else {
      tradeTimer.log("[trade] approve:sell:skipped (allowance sufficient)")
    }
  }, [amount.valueBigInt, mode, publicClient, remix.token_address, refetchRemixTokenAllowanceForPool, refetchUsdcAllowance, tradeUsdcRelay.canDirectSwap, getEmbeddedWalletClient])

  const pushOptimisticMetrics = useCallback((receipt: import("viem").TransactionReceipt) => {
    if (!remix.token_address || !ipPrice) return
    const sqrtPriceX96 = decodeSqrtPriceFromReceipt(receipt.logs)
    if (!sqrtPriceX96) return
    const { priceUsd, marketCapUsd } = computePriceFromSqrtPriceX96(
      sqrtPriceX96,
      remix.token_address,
      ipPrice,
    )
    setOptimisticMetric(remix.token_address, {
      priceUsd,
      marketCapUsd,
      timestamp: Date.now(),
    })
    window.dispatchEvent(new CustomEvent("optimistic-price-update", {
      detail: { tokenAddress: remix.token_address, priceUsd },
    }))
  }, [remix.token_address, ipPrice])

  const handleSwap = useCallback(async (ipOverride?: bigint): Promise<{ receiptPromise: Promise<import("viem").TransactionReceipt> } | undefined> => {
    const swapIpAmount = ipOverride ?? amount.valueBigInt
    const scaledMinOut = ipOverride && amount.valueBigInt > BigInt(0)
      ? (estimatedAmountOutRaw * ipOverride) / (isUsdcInput ? usdcEffectiveIpWei || BigInt(1) : amount.valueBigInt)
      : estimatedAmountOutRaw
    const amountOutMinimum = (scaledMinOut * BigInt((1 - slippage) * 10000)) / BigInt(10000)

    const scheduleOptimisticMetrics = (receiptPromise: Promise<import("viem").TransactionReceipt>) => {
      receiptPromise.then(pushOptimisticMetrics).catch(() => { })
    }

    // Direct USDC buy: USDC -> WIP -> token multihop (no native IP value)
    if (mode === Mode.BUY && tradeUsdcRelay.canDirectSwap) {
      const multihopPath = encodePacked(
        ["address", "uint24", "address", "uint24", "address"],
        [
          STORY_USDC_ADDRESS,
          Number(usdcWipPoolFee),
          env.NEXT_PUBLIC_WRAPPED_IP_TOKEN_ADDRESS,
          Number(selectedSwapFee),
          remix.token_address as `0x${string}`,
        ],
      )

      tradeTimer.start("[trade] swap:usdc:buy")
      const { receiptPromise } = await writeContractOptimistic({
        address: env.NEXT_PUBLIC_STORYHUNT_SWAP_ROUTER,
        abi: StoryHuntSwapRouterABI,
        functionName: "multicall",
        args: [
          [
            encodeFunctionData({
              abi: StoryHuntSwapRouterABI,
              functionName: "exactInput",
              args: [{
                path: multihopPath,
                recipient: address as Address,
                deadline: Math.floor(Date.now() / 1000) + 60,
                amountIn: amount.valueBigInt,
                amountOutMinimum,
              }],
            }),
          ],
        ],
        gas: GAS_LIMIT_USDC_MULTIHOP,
      })
      tradeTimer.end("[trade] swap:usdc:buy")
      scheduleOptimisticMetrics(receiptPromise)
      return undefined
    }

    // Sell → USDC on Story (token → WIP → USDC)
    if (mode === Mode.SELL && sellReceiveCurrency === "USDC") {
      const sellUsdcPath = encodePacked(
        ["address", "uint24", "address", "uint24", "address"],
        [
          remix.token_address as `0x${string}`,
          Number(selectedSwapFee),
          env.NEXT_PUBLIC_WRAPPED_IP_TOKEN_ADDRESS,
          Number(usdcWipPoolFee),
          STORY_USDC_ADDRESS,
        ],
      )
      tradeTimer.start("[trade] swap:usdc:sell")
      const { receiptPromise } = await writeContractOptimistic({
        address: env.NEXT_PUBLIC_STORYHUNT_SWAP_ROUTER,
        abi: StoryHuntSwapRouterABI,
        functionName: "multicall",
        args: [
          [
            encodeFunctionData({
              abi: StoryHuntSwapRouterABI,
              functionName: "exactInput",
              args: [{
                path: sellUsdcPath,
                recipient: address as Address,
                deadline: Math.floor(Date.now() / 1000) + 60,
                amountIn: amount.valueBigInt,
                amountOutMinimum,
              }],
            }),
          ],
        ],
        gas: GAS_LIMIT_USDC_MULTIHOP,
      })
      tradeTimer.end("[trade] swap:usdc:sell")
      scheduleOptimisticMetrics(receiptPromise)
      return { receiptPromise }
    }

    const exactInputSingleParams: ExactInputSingleParams = {
      tokenIn: tokenData[mode].tokenIn.address,
      tokenOut: tokenData[mode].tokenOut.address,
      fee: selectedSwapFee,
      recipient: env.NEXT_PUBLIC_STORYHUNT_SWAP_ROUTER,
      amountIn: swapIpAmount,
      amountOutMinimum,
      sqrtPriceLimitX96: BigInt(0),
      deadline: Math.floor(Date.now() / 1000) + 60,
    }

    if (mode === Mode.BUY) {
      tradeTimer.start("[trade] swap:ip:buy")
      const { receiptPromise } = await writeContractOptimistic({
        address: env.NEXT_PUBLIC_STORYHUNT_SWAP_ROUTER,
        abi: StoryHuntSwapRouterABI,
        functionName: "multicall",
        value: swapIpAmount,
        args: [
          [
            encodeFunctionData({
              abi: StoryHuntSwapRouterABI,
              functionName: "exactInputSingle",
              args: [exactInputSingleParams],
            }),
            encodeFunctionData({
              abi: StoryHuntSwapRouterABI,
              functionName: "sweepToken",
              args: [env.NEXT_PUBLIC_WRAPPED_IP_TOKEN_ADDRESS, BigInt(0), address as Address],
            }),
            encodeFunctionData({
              abi: StoryHuntSwapRouterABI,
              functionName: "sweepToken",
              args: [remix.token_address as Address, BigInt(0), address as Address],
            }),
            encodeFunctionData({
              abi: StoryHuntSwapRouterABI,
              functionName: "refundIP",
              args: [],
            }),
          ],
        ],
        gas: GAS_LIMIT_BUY,
      })
      tradeTimer.end("[trade] swap:ip:buy")
      scheduleOptimisticMetrics(receiptPromise)
      return undefined
    }

    tradeTimer.start("[trade] swap:ip:sell")
    const { receiptPromise } = await writeContractOptimistic({
      address: env.NEXT_PUBLIC_STORYHUNT_SWAP_ROUTER,
      abi: StoryHuntSwapRouterABI,
      functionName: "multicall",
      args: [
        [
          encodeFunctionData({
            abi: StoryHuntSwapRouterABI,
            functionName: "exactInputSingle",
            args: [exactInputSingleParams],
          }),
          encodeFunctionData({
            abi: StoryHuntSwapRouterABI,
            functionName: "unwrapWIP9",
            args: [amountOutMinimum, address as Address],
          }),
          encodeFunctionData({
            abi: StoryHuntSwapRouterABI,
            functionName: "refundIP",
            args: [],
          }),
        ],
      ],
      gas: GAS_LIMIT_SELL,
    })
    tradeTimer.end("[trade] swap:ip:sell")
    scheduleOptimisticMetrics(receiptPromise)
    return { receiptPromise }
  }, [
    address,
    amount.valueBigInt,
    estimatedAmountOutRaw,
    isUsdcInput,
    usdcEffectiveIpWei,
    tradeUsdcRelay.canDirectSwap,
    usdcWipPoolFee,
    mode,
    selectedSwapFee,
    remix.token_address,
    sellReceiveCurrency,
    slippage,
    tokenData,
    writeContractOptimistic,
    pushOptimisticMetrics,
  ])

  const onTradeHandler = useCallback(async () => {
    if (tradeBlockedReasonRef.current) {
      toast.error(tradeBlockedReasonRef.current)
      return
    }

    setIsTrading(true)
    isTradingRef.current = true

    tradeTimer.reset()
    tradeTimer.start("[trade] ensureEmbeddedWallet")
    try {
      await ensureEmbeddedWallet()
    } catch {
      toast.error("Embedded wallet not ready. Please try again.")
      tradeTimer.end("[trade] ensureEmbeddedWallet")
      setIsTrading(false)
      isTradingRef.current = false
      return
    }
    tradeTimer.end("[trade] ensureEmbeddedWallet")

    // SOL cross-chain (Relay) path — isTrading cleared by relay status effect on complete/error
    if (mode === Mode.BUY && isCrossChainSol(paymentCurrency)) {
      tradeTimer.start("[trade] sol:total")
      try {
        await relaySwap.execute()
      } catch (err) {
        toast.error(parseTransactionErrorMessage(err, "Cross-chain swap failed"))
        setIsTrading(false)
        isTradingRef.current = false
      }
      tradeTimer.end("[trade] sol:total")
      tradeTimer.summary("SOL → Token")
      return
    }

    tradeTimer.log(`[trade] path=${paymentCurrency} mode=${mode === Mode.BUY ? "BUY" : "SELL"}`)

    // USDC path
    if (mode === Mode.BUY && paymentCurrency === "USDC") {
      if (tradeUsdcRelay.canDirectSwap) {
        // Direct on-chain USDC -> WIP -> token (no Relay needed)
        tradeTimer.start("[trade] usdc-direct:total")
        try {
          toast.loading("Approving...", { id: USDC_RELAY_TOAST_ID })
          tradeTimer.start("[trade] usdc-direct:approve")
          await handleApprove()
          tradeTimer.end("[trade] usdc-direct:approve")

          toast.loading("Swapping...", { id: USDC_RELAY_TOAST_ID })
          tradeTimer.start("[trade] usdc-direct:swap")
          await handleSwap()
          tradeTimer.end("[trade] usdc-direct:swap")
          toast.loading("Confirming...", { id: USDC_RELAY_TOAST_ID })
        } catch (err) {
          toast.dismiss(USDC_RELAY_TOAST_ID)
          setIsTrading(false)
          isTradingRef.current = false
          toast.error(parseTransactionErrorMessage(err, "USDC swap failed"))
        }
        tradeTimer.end("[trade] usdc-direct:total")
        tradeTimer.summary("USDC (direct) → Token")
      } else {
        // Relay USDC -> IP, then standard IP buy swap
        tradeTimer.start("[trade] usdc-relay:total")
        try {
          toast.loading("Relaying...", { id: USDC_RELAY_TOAST_ID })
          tradeTimer.start("[trade] usdc-relay:relay")
          const ipReceived = await tradeUsdcRelay.execute(amount.valueBigInt)
          tradeTimer.end("[trade] usdc-relay:relay")

          toast.loading("Executing swap...", { id: USDC_RELAY_TOAST_ID })
          tradeTimer.start("[trade] usdc-relay:swap")
          await handleSwap(ipReceived)
          tradeTimer.end("[trade] usdc-relay:swap")
          toast.loading("Confirming...", { id: USDC_RELAY_TOAST_ID })
        } catch (err) {
          toast.dismiss(USDC_RELAY_TOAST_ID)
          setIsTrading(false)
          isTradingRef.current = false
          toast.error(parseTransactionErrorMessage(err, "USDC swap failed"))
        }
        tradeTimer.end("[trade] usdc-relay:total")
        tradeTimer.summary("USDC (relay) → Token")
      }
      return
    }

    // Direct swap path (IP / sell) — optimistic: unblock UI after hash, confirm in background
    tradeTimer.start("[trade] ip:total")
    try {
      if (mode !== Mode.BUY) {
        tradeTimer.start("[trade] ip:approve")
        await handleApprove()
        tradeTimer.end("[trade] ip:approve")
      }

      if (mode === Mode.SELL && sellReceiveCurrency === "SOL") {
        if (!publicClient || !address || !solanaAddress) {
          setIsTrading(false)
          isTradingRef.current = false
          toast.error("Connect a Solana wallet to receive SOL on Solana.")
          tradeTimer.end("[trade] ip:total")
          return
        }
        const ipBefore = await publicClient.getBalance({ address })
        sellSolAwaitingRelayRef.current = true
        try {
          toast.loading("Swapping...", { id: "sell-sol-relay" })
          tradeTimer.start("[trade] ip:swap")
          const swapRet = await handleSwap()
          tradeTimer.end("[trade] ip:swap")
          if (!swapRet?.receiptPromise) throw new Error("Swap incomplete")
          await swapRet.receiptPromise
          const ipAfter = await publicClient.getBalance({ address })
          const gained = ipAfter - ipBefore
          const relayWei = gained > STORY_IP_RELAY_GAS_RESERVE_WEI ? gained - STORY_IP_RELAY_GAS_RESERVE_WEI : BigInt(0)
          if (relayWei <= BigInt(0)) throw new Error("Not enough IP to bridge after the swap.")
          toast.loading("Relaying...", { id: "sell-sol-relay" })
          await relayStoryIpToSolana({
            amountWei: relayWei,
            evmUserAddress: address,
            solanaRecipientAddress: solanaAddress,
            sendTransactionAsync,
          })
        } catch (err) {
          sellSolAwaitingRelayRef.current = false
          toast.dismiss("sell-sol-relay")
          setIsTrading(false)
          isTradingRef.current = false
          toast.error(parseTransactionErrorMessage(err, "Transaction failed"))
          tradeTimer.end("[trade] ip:total")
          return
        }
        sellSolAwaitingRelayRef.current = false
        toast.dismiss("sell-sol-relay")
        toast.success("Transaction success")
        setIsTrading(false)
        isTradingRef.current = false
        refreshAllBalances()
        refetchRemixTokenBalance()
        refetchRemixTokenAllowanceForPool()
        fireTradeSuccess()
        tradeTimer.end("[trade] ip:total")
        tradeTimer.summary("Sell → SOL (complete)")
        return
      }

      tradeTimer.start("[trade] ip:swap")
      await handleSwap()
      tradeTimer.end("[trade] ip:swap")
      toast.loading("Confirming...", { id: USDC_RELAY_TOAST_ID })
    } catch (err) {
      sellSolAwaitingRelayRef.current = false
      setIsTrading(false)
      isTradingRef.current = false
      toast.error(parseTransactionErrorMessage(err, "Transaction failed"))
    }
    tradeTimer.end("[trade] ip:total")
  }, [
    address,
    amount.valueBigInt,
    ensureEmbeddedWallet,
    handleApprove,
    handleSwap,
    refreshAllBalances,
    mode,
    fireTradeSuccess,
    paymentCurrency,
    publicClient,
    refetchRemixTokenAllowanceForPool,
    refetchRemixTokenBalance,
    relaySwap,
    sellReceiveCurrency,
    sendTransactionAsync,
    solanaAddress,
    tradeUsdcRelay,
    unifiedUsdc,
  ])

  // --- Balance check ---
  const balanceCheck = useMemo(() => {
    if (mode === Mode.BUY && paymentCurrency === "USDC") {
      return unifiedUsdc.totalUsdcRaw >= amount.valueBigInt
    }
    if (mode === Mode.BUY && paymentCurrency === "SOL") {
      return amount.valueNumber + MIN_SOL_TX_FEE <= (solBalance ?? 0)
    }
    return tokenData[mode].tokenIn.balance >= amount.valueBigInt
  }, [tokenData, mode, amount.valueBigInt, amount.valueNumber, paymentCurrency, unifiedUsdc.totalUsdcRaw, solBalance])

  const insufficientBalanceLabel = useMemo(() => {
    return "Insufficient balance"
  }, [])

  const usdcTradeBlock = useMemo<string | null>(() => {
    if (mode !== Mode.BUY || paymentCurrency !== "USDC") return null
    if (amount.valueBigInt <= BigInt(0)) return null
    if (tradeUsdcRelay.canDirectSwap) return null

    const plan = planUsdcToIpRoute({
      storyUsdcRaw: unifiedUsdc.storyUsdcRaw,
      solanaUsdcRaw: unifiedUsdc.solanaUsdcRaw,
      hasIpGas: (ipBalance?.value ?? BigInt(0)) > BigInt(1e16),
      hasSolGas: solBalance >= MIN_SOL_TX_FEE,
    })

    if (!plan.feasible) return plan.reason
    return null
  }, [mode, paymentCurrency, amount.valueBigInt, tradeUsdcRelay.canDirectSwap, ipBalance?.value, solBalance, unifiedUsdc.storyUsdcRaw, unifiedUsdc.solanaUsdcRaw])

  // --- Zero-balance → Deposit button ---
  const hasZeroBalance = useMemo(() => {
    if (mode !== Mode.BUY) return false
    switch (paymentCurrency) {
      case "IP": return !wrappedIpTokenData.balance || wrappedIpTokenData.balance === BigInt(0)
      case "SOL": return (solBalance ?? 0) < MIN_SOL_TX_FEE
      case "USDC": return unifiedUsdc.totalUsdcRaw === BigInt(0)
      default: return false
    }
  }, [mode, paymentCurrency, wrappedIpTokenData.balance, solBalance, unifiedUsdc.totalUsdcRaw])

  const usdValue = useMemo(() => {
    if (!amount.valueNumber || amount.valueNumber === 0) return 0
    if (isCrossChainInput) {
      return amount.valueNumber * (relayEstimateUsdPerInput || solPrice || 0)
    }
    if (mode === Mode.BUY) {
      if (isUsdcInput) return amount.valueNumber * usdcPrice
      return amount.valueNumber * (ipPrice || 0)
    }
    if (mode === Mode.SELL && isSellSolOut) return estimatedAmountOutNumber * (solPrice || 0)
    return estimatedAmountOutNumber * (ipPrice || 0)
  }, [amount.valueNumber, mode, ipPrice, solPrice, usdcPrice, estimatedAmountOutNumber, isCrossChainInput, relayEstimateUsdPerInput, isUsdcInput, isSellSolOut])

  const priceImpact = useMemo(() => {
    if (isCrossChainInput && relaySwap.quote?.details?.totalImpact?.percent != null) {
      const relayImpactPct = Math.abs(parseFloat(relaySwap.quote.details.totalImpact.percent))
      return relayImpactPct + onChainPriceImpactResult.priceImpact
    }
    if (isUsdcInput && !tradeUsdcRelay.canDirectSwap && tradeUsdcRelay.estimate?.relayImpactPercent) {
      return tradeUsdcRelay.estimate.relayImpactPercent + onChainPriceImpactResult.priceImpact
    }
    return onChainPriceImpactResult.priceImpact
  }, [isCrossChainInput, isUsdcInput, tradeUsdcRelay.canDirectSwap, relaySwap.quote, tradeUsdcRelay.estimate, onChainPriceImpactResult.priceImpact])

  const priceImpactIsLoading = isCrossChainInput
    ? (isLoadingRelayEstimate || relaySwap.isPrefetching)
    : isUsdcInput
      ? (isLoadingUsdcEstimate || onChainPriceImpactResult.isLoading)
      : onChainPriceImpactResult.isLoading

  const priceImpactHasError = isCrossChainInput
    ? (!relaySwap.quote?.details?.totalImpact && !relaySwap.isPrefetching && !isLoadingRelayEstimate)
    : !!onChainPriceImpactResult.error

  const isPriceImpactUnreliable =
    hasExecutableDirectQuote &&
    !isCrossChainInput &&
    !isUsdcInput &&
    !isSellUsdcOut &&
    !isSellSolOut &&
    (onChainPriceImpactResult.poolTvlBase <= 0 || onChainPriceImpactResult.poolTvlQuote <= 0 || priceImpact >= 99.5)

  // Price-impact display: only show once we have a meaningful, stable number.
  // Hidden when loading, errored, or when the underlying TVL signal is unreliable
  // so we never lie about a tiny impact for a clearly-broken pool.
  const priceImpactDisplayPct = useMemo(() => {
    if (amount.valueNumber === 0 || amount.valueString === "") return null
    if (priceImpactIsLoading) return null
    if (priceImpactHasError || isPriceImpactUnreliable) return null
    if (!Number.isFinite(priceImpact) || priceImpact <= 0) return null
    return priceImpact
  }, [amount.valueNumber, amount.valueString, isPriceImpactUnreliable, priceImpact, priceImpactHasError, priceImpactIsLoading])

  const priceImpactClass =
    priceImpactDisplayPct == null
      ? "text-[#797979]"
      : priceImpactDisplayPct >= PRICE_IMPACT_SEVERE_PCT
        ? "text-red font-semibold"
        : priceImpactDisplayPct >= PRICE_IMPACT_WARN_PCT
          ? "text-orange font-medium"
          : "text-[#797979]"

  const tradeBlockedReason = useMemo(() => {
    if (!amount.valueString || Number.isNaN(amount.valueNumber) || amount.valueNumber <= 0) {
      return null
    }

    if (mode === Mode.SELL && sellReceiveCurrency === "SOL" && !solanaAddress) {
      return "Solana wallet required for SOL payout"
    }

    if (
      mode === Mode.SELL &&
      sellReceiveCurrency === "SOL" &&
      amount.valueBigInt > BigInt(0) &&
      !isLoadingSellSolRelayQuote &&
      estimatedIpOutForSellSolRelay > BigInt(0) &&
      sellSolRelayOutHuman <= 0
    ) {
      return sellSolRelayQuoteError ?? "Unable to quote bridge to Solana"
    }

    if (isCrossChainInput && relayBridgeQuoteError) {
      return relayBridgeQuoteError
    }

    if (isCrossChainInput && relaySwap.prefetchError) {
      return relaySwap.prefetchError
    }

    if (isUsdcInput && !tradeUsdcRelay.canDirectSwap && tradeUsdcRelay.estimateError) {
      return tradeUsdcRelay.estimateError
    }

    if (isLoadingEstimatedAmountOut || priceImpactIsLoading) {
      return null
    }

    if (isEstimatedAmountOutAntiSnipeBlocked || onChainPriceImpactResult.isAntiSnipeBlocked) {
      return "Anti-snipe limit exceeded"
    }

    if (!hasExecutableDirectQuote && priceImpactHasError) {
      return parseTransactionErrorMessage(
        onChainPriceImpactResult.error ?? estimatedAmountOutError,
        "Unable to get a swap quote right now."
      )
    }

    if (!hasExecutableDirectQuote) {
      return "No executable swap route is available right now."
    }

    return null
  }, [
    amount.valueNumber,
    amount.valueString,
    estimatedAmountOutError,
    hasExecutableDirectQuote,
    isEstimatedAmountOutAntiSnipeBlocked,
    isLoadingEstimatedAmountOut,
    onChainPriceImpactResult.error,
    onChainPriceImpactResult.isAntiSnipeBlocked,
    priceImpactHasError,
    priceImpactIsLoading,
    mode,
    sellReceiveCurrency,
    solanaAddress,
    isLoadingSellSolRelayQuote,
    estimatedIpOutForSellSolRelay,
    sellSolRelayOutHuman,
    sellSolRelayQuoteError,
    amount.valueBigInt,
    isCrossChainInput,
    relayBridgeQuoteError,
    relaySwap.prefetchError,
    isUsdcInput,
    tradeUsdcRelay.canDirectSwap,
    tradeUsdcRelay.estimateError,
  ])

  useEffect(() => {
    tradeBlockedReasonRef.current = tradeBlockedReason
  }, [tradeBlockedReason])

  const handleSetDefinedAmount = useCallback(
    (definedAmount: number) => {
      if (mode === Mode.BUY) {
        handleUpdateAmount(`${definedAmount}`)
      } else {
        if (definedAmount === 1) {
          setAmount({
            valueNumber: tokenData[mode].tokenIn.balanceNumber,
            valueBigInt: tokenData[mode].tokenIn.balance,
            valueString: `${tokenData[mode].tokenIn.balanceNumber}`,
            decimals: tokenData[mode].tokenIn.decimals,
          })
        } else {
          handleUpdateAmount(`${definedAmount * tokenData[mode].tokenIn.balanceNumber}`)
        }
      }
    },
    [handleUpdateAmount, mode, tokenData]
  )

  // const getMaxAmount = useCallback(() => {
  //   if (mode === Mode.BUY && isCrossChainSol(paymentCurrency)) {
  //     calculateMaxCrossChainAmount()
  //   } else if (mode === Mode.BUY && paymentCurrency === "USDC") {
  //     calculateMaxUsdcAmount()
  //   } else if (mode === Mode.BUY && paymentCurrency === "IP") {
  //     calculateMaxBuyAmount()
  //   } else if (mode === Mode.SELL) {
  //     calculateMaxSellAmount()
  //   }
  // }, [mode, paymentCurrency, calculateMaxCrossChainAmount, calculateMaxUsdcAmount, calculateMaxBuyAmount, calculateMaxSellAmount])

  const usdcDefinedAmounts = [5, 10, 50]

  const isBusy =
    isTrading ||
    isConfirming ||
    isPendingTx ||
    (isCrossChainSol(paymentCurrency) && (relaySwap.status !== "idle" || relaySwap.isPrefetching))

  const definedAmounts = crossChainConfig
    ? crossChainConfig.definedAmounts
    : isUsdcInput
      ? usdcDefinedAmounts
      : tokenData[mode].definedAmounts

  const currencySelectorOptions = useMemo(
    () =>
      CURRENCY_OPTIONS.map((opt) => ({
        value: opt.value,
        triggerLabel: opt.triggerLabel,
        menuLabel:
          opt.value === "IP"
            ? `${formatNumber(wrappedIpTokenData.balanceNumber, 2, true)} IP`
            : opt.value === "SOL"
              ? `${formatNumber(solBalance, 2, true)} SOL`
              : `${formatNumber(unifiedUsdc.totalUsdc, 2, true)} USDC`,
        icon: opt.icon,
      })),
    [solBalance, unifiedUsdc.totalUsdc, wrappedIpTokenData.balanceNumber]
  )

  const sellSelectorOptions = useMemo(
    () =>
      CURRENCY_OPTIONS.map((opt) => ({
        value: opt.value,
        triggerLabel: opt.triggerLabel,
        menuLabel:
          opt.value === "IP"
            ? "To IP"
            : opt.value === "SOL"
              ? "To SOL"
              : "To USDC",
        icon: opt.icon,
      })),
    [],
  )

  const inputUsdValue = mode === Mode.SELL ? amount.valueNumber * (remix.price_usd || 0) : usdValue
  const receiveUsdValue =
    mode === Mode.BUY
      ? estimatedAmountOutNumber * (remix.price_usd || 0)
      : usdValue
  const inputUsdLabel = `$${formatNumber(inputUsdValue, 2, true)}`
  const receiveUsdLabel = `$${formatNumber(receiveUsdValue, 2, true)}`
  const inputTokenBalanceAmount = useMemo(() => {
    if (mode === Mode.SELL) return remixTokenData.balanceNumber
    switch (paymentCurrency) {
      case "USDC":
        return unifiedUsdc.totalUsdc
      case "SOL":
        return solBalance ?? 0
      default:
        return wrappedIpTokenData.balanceNumber
    }
  }, [
    mode,
    paymentCurrency,
    remixTokenData.balanceNumber,
    unifiedUsdc.totalUsdc,
    solBalance,
    wrappedIpTokenData.balanceNumber,
  ])
  const inputTokenBalanceSymbol = useMemo(() => {
    if (mode === Mode.SELL) return `$${tokenData[mode].tokenIn.symbol.toUpperCase()}`
    switch (paymentCurrency) {
      case "USDC":
        return "USDC"
      case "SOL":
        return "SOL"
      default:
        return "WIP"
    }
  }, [mode, paymentCurrency, tokenData])
  const inputTokenBalanceUsd = useMemo(() => {
    if (mode === Mode.SELL) return inputTokenBalanceAmount * (remix.price_usd || 0)
    switch (paymentCurrency) {
      case "USDC":
        return inputTokenBalanceAmount * (usdcPrice || 0)
      case "SOL":
        return inputTokenBalanceAmount * (solPrice || 0)
      default:
        return inputTokenBalanceAmount * (ipPrice || 0)
    }
  }, [mode, paymentCurrency, inputTokenBalanceAmount, remix.price_usd, usdcPrice, solPrice, ipPrice])
  const inputBalanceTooltipLines = useMemo(() => {
    const tokenLine = `${formatNumber(inputTokenBalanceAmount, 2, true)} ${inputTokenBalanceSymbol}`
    const usdLine = `≈ $${formatNumber(inputTokenBalanceUsd, 2, true)}`
    return { tokenLine, usdLine }
  }, [inputTokenBalanceAmount, inputTokenBalanceSymbol, inputTokenBalanceUsd])

  /** Wallet balance of the receive (output) asset — mirrors input row; SOL-out uses Solana balance. */
  const outputTokenBalanceAmount = useMemo(() => {
    if (mode === Mode.BUY) return remixTokenData.balanceNumber
    if (isSellSolOut) return solBalance ?? 0
    return tokenData[mode].tokenOut.balanceNumber
  }, [mode, isSellSolOut, solBalance, remixTokenData.balanceNumber, tokenData])
  const outputTokenBalanceSymbol = useMemo(() => {
    if (mode === Mode.BUY) return `$${tokenData[mode].tokenOut.symbol.toUpperCase()}`
    if (isSellSolOut) return "SOL"
    if (isSellUsdcOut) return "USDC"
    return "WIP"
  }, [mode, isSellSolOut, isSellUsdcOut, tokenData])
  const outputTokenBalanceUsd = useMemo(() => {
    if (mode === Mode.BUY) return outputTokenBalanceAmount * (remix.price_usd || 0)
    if (isSellSolOut) return outputTokenBalanceAmount * (solPrice || 0)
    if (isSellUsdcOut) return outputTokenBalanceAmount * (usdcPrice || 0)
    return outputTokenBalanceAmount * (ipPrice || 0)
  }, [
    mode,
    isSellSolOut,
    isSellUsdcOut,
    outputTokenBalanceAmount,
    remix.price_usd,
    solPrice,
    usdcPrice,
    ipPrice,
  ])
  const outputBalanceTooltipLines = useMemo(() => {
    const tokenLine = `${formatNumber(outputTokenBalanceAmount, 2, true)} ${outputTokenBalanceSymbol}`
    const usdLine = `≈ $${formatNumber(outputTokenBalanceUsd, 2, true)}`
    return { tokenLine, usdLine }
  }, [outputTokenBalanceAmount, outputTokenBalanceSymbol, outputTokenBalanceUsd])

  const displayInputCurrencySymbol = inputCurrencyData.symbol === "IP" ? "WIP" : inputCurrencyData.symbol
  const receiveSymbol =
    mode === Mode.SELL && sellReceiveCurrency === "SOL"
      ? "SOL"
      : tokenData[mode].tokenOut.symbol.toUpperCase()
  const outputActionSymbol = mode === Mode.BUY ? `$${tokenData[mode].tokenOut.symbol.toUpperCase()}` : `$${tokenData[mode].tokenIn.symbol.toUpperCase()}`
  const inputPillSymbol = mode === Mode.BUY ? displayInputCurrencySymbol : `$${tokenData[mode].tokenIn.symbol.toUpperCase()}`
  const receivePillSymbol = mode === Mode.BUY ? `$${tokenData[mode].tokenOut.symbol.toUpperCase()}` : receiveSymbol
  const actionAmountLabel =
    mode === Mode.BUY
      ? formatNumber(estimatedAmountOutNumber, 2, true)
      : formatNumber(amount.valueNumber, 2, true)

  const holdingShelfPnl = useMemo((): TradeShelfPnl | null => {
    if (tokenPnlSnapshot) {
      return {
        totalBoughtUsd: tokenPnlSnapshot.totalBoughtUsd,
        totalSoldUsd: tokenPnlSnapshot.totalSoldUsd,
        netPnlUsd: tokenPnlSnapshot.netPnlUsd,
        pnlPercent: tokenPnlSnapshot.pnlPercent,
        boughtQtyTokens: tokenPnlSnapshot.boughtQtyTokens,
        soldQtyTokens: tokenPnlSnapshot.soldQtyTokens,
      }
    }
    if (process.env.NODE_ENV === "development" && debugHoldingShelf) {
      return DEBUG_TRADE_SHELF_PNL
    }
    return null
  }, [tokenPnlSnapshot, debugHoldingShelf])

  const showHoldingShelf =
    mode === Mode.BUY &&
    isConnected &&
    holdingShelfPnl !== null &&
    ((tokenPnlSnapshot?.totalBoughtUsd ?? 0) > 0 ||
      (process.env.NODE_ENV === "development" && debugHoldingShelf))

  const actionButtonLabel = !balanceCheck
    ? insufficientBalanceLabel
    : tradeBlockedReason
      ? tradeBlockedReason
      : hasZeroBalance
        ? "Deposit"
        : usdcTradeBlock
          ? usdcTradeBlock
          : `${mode === Mode.BUY ? "Buy" : "Sell"} ${actionAmountLabel} ${outputActionSymbol}`

  // Only take over the full card when we know we're on mobile; `null` would skip TradeSwitch otherwise.
  if (isMobile === true && openSlippage) {
    return (
      <div className="flex flex-col gap-3 rounded-[6px]">
        <button
          type="button"
          className="flex w-fit items-center gap-2 py-1 text-sm font-medium text-neutral-200 hover:text-white"
          onClick={() => setOpenSlippage(false)}
        >
          <ArrowLeft size={18} />
          Back to trade
        </button>
        <Slippage
          value={slippage}
          onChange={(value) => {
            setSlippage(value)
            setOpenSlippage(false)
          }}
          isMobile={isMobile}
        />
      </div>
    )
  }

  const tradeToolbar = (
    <>
      <div className="flex items-center justify-between">
        <TradeSwitch mode={mode} onChange={setMode} />
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            aria-label="Trade settings"
            className="flex size-9 items-center justify-center rounded-[23px] border-[0.5px] border-[#313131] bg-transparent p-2 text-[#737373] hover:!bg-[#1A1A1A] hover:text-neutral-200"
            onClick={() => setOpenSlippage(!openSlippage)}
            key="slippage-toggle"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <motion.div whileHover={{ rotate: 90 }} transition={{ duration: 0.2 }}>
              <Cog size={14} />
            </motion.div>
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {openSlippage && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <Slippage value={slippage} onChange={setSlippage} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )

  const tradeCardStack = (
    <div className="relative flex flex-col gap-1">
      <div className="relative z-0 overflow-hidden rounded-2xl border-[0.5px] border-[#313131] bg-[#191919] p-4">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={mode}
            custom={mode}
            variants={tradeCardContentSweep}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex w-full min-w-0 flex-col gap-5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[14px] font-semibold leading-none text-[#494949]">{mode === Mode.BUY ? "Buy" : "Sell"}</span>
              <div className="flex items-center gap-1">
                {definedAmounts.slice(0, 4).map((definedAmount) => (
                  <Button
                    className="h-auto min-h-0 rounded px-2 py-1 text-[10px] font-semibold text-[#494949] shadow-none border-[0.5px] border-[#313131] bg-[#191919] hover:bg-[#202020] hover:text-[#797979]"
                    onClick={() => handleSetDefinedAmount(definedAmount)}
                    key={`predefined-${definedAmount}`}
                  >
                    {mode === Mode.SELL ? `${definedAmount * 100}%` : `${definedAmount} ${displayInputCurrencySymbol}`}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <BigNumberInput
                    value={amount.valueString}
                    onChange={handleUpdateAmount}
                    className="w-full min-w-0 bg-transparent text-[28px] font-extrabold leading-none text-[#D9D9D9] outline-hidden placeholder:text-[#D9D9D9]"
                  />
                  {!amount.valueString && (
                    <div className="pointer-events-none -mt-[28px] text-[28px] font-extrabold leading-none text-[#D9D9D9]">
                      0
                    </div>
                  )}
                </div>
                {mode === Mode.BUY ? (
                  <AssetSelectorDropdown
                    value={paymentCurrency}
                    onChange={setPaymentCurrency}
                    options={currencySelectorOptions}
                    disabled={false}
                    menuAlign="end"
                    menuWidthClassName="min-w-[176px] max-w-[190px]"
                    textSizeClassName="text-[14px] leading-none font-medium"
                    triggerClassName="h-8 min-h-[32px] gap-2 rounded-[30px] border-0 bg-[#242424] px-3 py-2 hover:bg-[#2A2A2A]"
                    menuItemClassName="gap-2 px-3 py-3"
                  />
                ) : (
                  <div className="flex h-8 min-h-[32px] items-center gap-2 rounded-[30px] bg-[#242424] px-3 py-2">
                    <img src={safeImageSrc(remix.image)} alt="" className="size-[14px] rounded-full object-cover" />
                    <span className="text-[14px] font-medium leading-none text-white">{inputPillSymbol}</span>
                  </div>
                )}
              </div>
              <div className="flex items-start justify-between gap-2 text-[14px] leading-none">
                <AnimatedNumber value={inputUsdLabel} className="text-[13px] font-normal leading-none text-[#797979]" delay={0} animateDuration={900} />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-1.5 rounded p-0 text-right outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white/20"
                      aria-label="Wallet balance"
                    >
                      <span className="shrink-0 text-[#7A7A7A]">
                        <Wallet size={12} />
                      </span>
                      <AnimatedNumber value={inputTokenBalanceAmount} className="text-[14px] font-normal leading-none text-[#7A7A7A]" delay={0} animateDuration={900} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={6} className="max-w-[240px]">
                    <div className="flex flex-col gap-1 text-left text-xs">
                      <span className="font-semibold tabular-nums">{inputBalanceTooltipLines.tokenLine}</span>
                      <span className="text-white/85 tabular-nums">{inputBalanceTooltipLines.usdLine}</span>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative z-[1] -my-5 flex justify-center">
        <div className="flex size-10 items-center justify-center rounded-[8px] border-[0.5px] border-[#313131] bg-[#191919] p-2.5 text-white">
          <ArrowDown size={14} strokeWidth={1.8} />
        </div>
      </div>

      <div className="relative z-0 overflow-hidden rounded-2xl border-[0.5px] border-[#313131] bg-[#191919] p-4">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={mode}
            custom={mode}
            variants={tradeCardContentSweep}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex w-full min-w-0 flex-col gap-2"
          >
            <span className="text-[14px] font-semibold leading-none text-[#494949]">Receive</span>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1 truncate text-[24px] font-extrabold leading-none text-[#D9D9D9]">
                  {isLoadingEstimatedAmountOut && !!amount.valueNumber ? (
                    "..."
                  ) : estimatedAmountOutNumber === 0 ? (
                    <span className="leading-none">0</span>
                  ) : (
                    <AnimatedNumber
                      value={estimatedAmountOutNumber}
                      className="leading-none"
                      delay={0}
                      animateDuration={900}
                    />
                  )}
                </div>
                {mode === Mode.BUY ? (
                  <div className="flex h-8 min-h-[32px] items-center gap-1 rounded-[30px] border border-[#313131] p-2">
                    <div className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-white/40">
                      <img src={safeImageSrc(remix.image)} alt="" className="size-full rounded-full object-cover" />
                    </div>
                    <span className="text-[14px] font-bold leading-none text-white">{receivePillSymbol}</span>
                  </div>
                ) : (
                  <AssetSelectorDropdown
                    value={sellReceiveCurrency}
                    onChange={setSellReceiveCurrency}
                    options={sellSelectorOptions}
                    disabled={false}
                    menuAlign="end"
                    menuWidthClassName="min-w-[176px] max-w-[190px]"
                    textSizeClassName="text-[14px] leading-none font-bold"
                    triggerClassName="h-8 min-h-[32px] gap-2 rounded-[30px] border border-[#313131] bg-transparent px-3 py-2 hover:bg-[#1A1A1A]"
                    menuItemClassName="gap-2 px-3 py-3"
                  />
                )}
              </div>
              <div className="flex items-start justify-between gap-2 text-[14px] leading-none">
                <AnimatedNumber value={receiveUsdLabel} className="text-[13px] font-normal leading-none text-[#797979]" delay={0} animateDuration={900} />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-1.5 rounded p-0 text-right outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white/20"
                      aria-label="Wallet balance of receive token"
                    >
                      <span className="shrink-0 text-[#7A7A7A]">
                        <Wallet size={12} />
                      </span>
                      <AnimatedNumber
                        value={outputTokenBalanceAmount}
                        className="text-[14px] font-normal leading-none text-[#7A7A7A]"
                        delay={0}
                        animateDuration={900}
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={6} className="max-w-[240px]">
                    <div className="flex flex-col gap-1 text-left text-xs">
                      <span className="font-semibold tabular-nums">{outputBalanceTooltipLines.tokenLine}</span>
                      <span className="text-white/85 tabular-nums">{outputBalanceTooltipLines.usdLine}</span>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {priceImpactDisplayPct != null && (
        <div className="mt-2 flex items-center justify-between rounded-2xl border-[0.5px] border-[#313131] bg-[#191919] px-4 py-2.5 text-[13px] leading-none">
          <span className="text-[#797979]">Price impact</span>
          <span className={`tabular-nums ${priceImpactClass}`}>
            {priceImpactDisplayPct.toFixed(2)}%
          </span>
        </div>
      )}
    </div>
  )

  const tradeAlertsAndActions = (
    <>
      {tradeBlockedReason ? (
        <div className="text-center text-sm font-semibold text-red">
          {tradeBlockedReason.includes("route") ? "No route" : tradeBlockedReason}
        </div>
      ) : null}
      {isConnected ? (
        <div className="relative isolate flex w-full flex-col">
          <Button
            className="relative z-10 h-auto w-full cursor-pointer !rounded-2xl bg-[#C093FF] px-24 py-3 text-[14px] font-semibold text-[#321F4D] !shadow-none !ring-0 hover:bg-[#c7a2ff] focus-visible:!ring-0 focus-visible:!ring-offset-0 disabled:bg-[#3A3A3A] disabled:text-[#7A7A7A] disabled:opacity-100"
            onClick={hasZeroBalance || usdcTradeBlock ? () => setDepositModalOpen(true) : onTradeHandler}
            disabled={
              !(hasZeroBalance || usdcTradeBlock) &&
              (!isReady ||
                isBusy ||
                !balanceCheck ||
                !!tradeBlockedReason ||
                amount.valueNumber === 0 ||
                amount.valueString === "" ||
                Number.isNaN(amount.valueNumber) ||
                isEstimatedAmountOutAntiSnipeBlocked ||
                onChainPriceImpactResult.isAntiSnipeBlocked)
            }
          >
            {isBusy ? (
              <Spinner size={32} />
            ) : (
              <span className="flex min-w-0 items-center gap-1.5 leading-none">
                {actionButtonLabel}
                <ArrowRight size={12} strokeWidth={1.8} />
              </span>
            )}
          </Button>
          <AnimatePresence initial={false}>
            {showHoldingShelf && holdingShelfPnl ? (
              <TradeHoldingShelfPanel
                key={
                  process.env.NODE_ENV === "development" && debugHoldingShelf
                    ? `debug-holding-shelf-${holdingShelfNonce}`
                    : "trade-holding-shelf"
                }
                pnl={holdingShelfPnl}
                tokenSymbol={remix.symbol}
                onOpenPnlCard={onOpenPnlCard}
              />
            ) : null}
          </AnimatePresence>
          {process.env.NODE_ENV === "development" ? (
            <button
              type="button"
              className="mt-2 text-left text-[11px] font-medium text-neutral-500 underline decoration-neutral-600 underline-offset-2 hover:text-neutral-400"
              onClick={() => {
                setDebugHoldingShelf((v) => {
                  const next = !v
                  if (next) setHoldingShelfNonce((n) => n + 1)
                  return next
                })
              }}
            >
              Debug: {debugHoldingShelf ? "hide" : "show"} holding shelf (needs Buy tab)
            </button>
          ) : null}
        </div>
      ) : (
        <SimpleConnectWalletButton
          className="h-auto w-full cursor-pointer !rounded-2xl bg-[#C093FF] px-24 py-3 text-[14px] font-semibold text-[#321F4D] !shadow-none hover:bg-[#c7a2ff] disabled:bg-[#3A3A3A] disabled:text-[#7A7A7A] disabled:opacity-100"
          suffixIcon={
            <div className="rotate-180">
              <ArrowLeft size={12} />
            </div>
          }
        />
      )}
    </>
  )

  if (desktopLayout && isMobile !== true) {
    return (
      <>
        {desktopLayout({
          toolbar: <div className="flex flex-col gap-2">{tradeToolbar}</div>,
          body: (
            <div className="flex flex-col gap-3">
              {tradeCardStack}
              {tradeAlertsAndActions}
              <DepositModal open={depositModalOpen} onOpenChange={setDepositModalOpen} />
            </div>
          ),
        })}
      </>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {tradeToolbar}
        {tradeCardStack}
      </div>
      {tradeAlertsAndActions}
      <DepositModal open={depositModalOpen} onOpenChange={setDepositModalOpen} />
    </div>
  )
}

export default Trade
