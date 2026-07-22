"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import BigNumber from "bignumber.js"
import { formatDate } from "date-fns"

// Custom time formatter for "1s ago", "1min ago", "1hr ago", "1d ago" format
const formatTimeAgo = (date: string | Date) => {
  const now = new Date()
  const target = new Date(date)
  const diffMs = now.getTime() - target.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.round(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) {
    return `${diffDays}d ago`
  } else if (diffHours > 0) {
    return `${diffHours}hr ago`
  } else if (diffMins > 0) {
    return `${diffMins}min ago`
  } else {
    return `${Math.max(1, diffSecs)}s ago`
  }
}
import dynamic from "next/dynamic"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useReadContracts } from "wagmi"
import { useQuery } from "@tanstack/react-query"

import { MobileStackContent, MobileStackTrigger } from "@/components/mobile-stack"
import { BottomSheetContent } from "@/components/mobile-stack"
import { TitleNavbar } from "@/components/navigation/mobile-navbar"
import Socials, { SOCIAL_TYPE } from "@/components/socials"
import {
  TokenMetricsByAddressProvider,
  useTokenMetricsByAddressContext,
  useIpPrice,
} from "@/context/token-metrics-context"
import { useMobileStack } from "@/context/mobile-ui-context"
import { bigNumberToFloat } from "@/lib/bignumber"
import { fetchJSONWithAuth } from "@/lib/client/fetcher"
import { TOTAL_SUPPLY } from "@/lib/constants"
import { IPOwnerVaultABI, IPTokenABI } from "@/lib/contracts/abis"
import { getContractAddress } from "@/lib/contracts/addresses"
import { formatNumberWithSuffix } from "@/lib/number"
import { Remix } from "@/types/remix"

import Header from "./header"
import Holders from "./holders"
import TokenData from "./token-data"
import { Mode } from "./trade/trade-switch"
import Transactions from "./transactions/transactions"
import { TokenMetrics, TokenMetricsPatched } from "@/lib/schema/token-metrics-schema"
// useSwaps removed — tokenSwaps (Electric, no time window) is the single source of truth
import { truncateAddress } from "@/lib/strings"
import { cn, getAPIRootUrl } from "@/lib/utils"
import { Burn, Community, Creator, Tiktok, Twitter, TwitterBadge } from "@/components/icons"
import { OwnerWarning } from "@/components/icons/owner-warning"
import { AnimatePresence, motion } from "framer-motion"
import DescriptionAccordion from "./components/DescriptionAccordion"
import Feeds from "./components/feeds"
import IpInfoBadge from "@/components/remixes/ip-info-badge"
import { TreasureChestFilled } from "@/components/icons/treasure-chest-filled"
import { TreasureChestLocked } from "@/components/icons/treasure-chest-locked"
import { TikTokBadge } from "@/components/icons/tiktok-badge"
import TopEarners from "./components/top-earners"
import OwnerEarning, { type UgcCardState, resolveUgcViewerCardState } from "./components/owner-earning"
import { TokenRightRailCarousel } from "./components/token-right-rail-carousel"
import { TokenFeedFiltersPanel, type TokenFeedFiltersState } from "./components/feed-filters-panel"
import { TokenChartPanel } from "./components/token-chart-panel"
import { HolderRewardsCard } from "./components/holder-rewards-card"
import ReferBanner from "./refer-banner"
import PnlCardDialog from "@/components/modals/pnl-card-dialog"
// Single shared Electric shape for all swaps on this token — consumed by trading metrics
import { useTokenSwaps, type SwapRow } from "@/hooks/use-token-swaps"
import { useTokenPnl } from "@/hooks/use-token-pnl"
import { useAccount } from "@/hooks/use-account"
import { useOptimisticMetric, clearOptimisticMetric } from "@/stores/optimistic-metrics"
// swap-receipt import removed — price/mcap now from token_metrics Electric shape
import { useLiveTradingMetrics } from "@/hooks/use-live-trading-metrics"
import { useSwapGraduation } from "@/hooks/use-swap-graduation"
import { useProfile } from "@/hooks/use-profile"
import { useIsIpOwner } from "@/hooks/use-is-ip-owner"
import { TokenImageViewerDialog } from "./components/token-image-viewer-dialog"

const TradingView = dynamic(() => import("@/components/trading-view"), { ssr: false })
const CoinGeckoTradingView = dynamic(() => import("@/components/coingecko-tradingview"), { ssr: false })
const Proposals = dynamic(() => import("./proposals/proposals").then((mod) => mod.default), {
  loading: () => (
    <div className="flex items-center justify-center py-12">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#494949] border-t-white" />
    </div>
  ),
})
const Trade = dynamic(() => import("./trade/trade"), { ssr: false })
const Comments = dynamic(() => import("./comments/comments"), { ssr: false })

// Specific token addresses that should use CoinGecko TradingView
import { TICK_1 } from "@/lib/utils/token-calculations"

const WRAPPED_IP = "0x1514000000000000000000000000000000000000"

// Starting price ratio (IP per token) derived from initial pool tick.
// The contract sets tick sign based on token ordering, so the absolute
// magnitude is always the same: tokensPerWIP = 1.0001^|TICK_1|.
// IP_per_token = 1 / tokensPerWIP — independent of token0/token1 ordering.
function getStartingPriceRatio(_tokenAddress: string): number {
  const tokensPerWIP = Math.pow(1.0001, Math.abs(TICK_1))
  return 1 / tokensPerWIP
}

const COINGECKO_TOKENS = ["0x02353a3bd5c9668159cf9fd54ac61b03212fcf41", "0x210e36b5cdb47c010c3225a065467ea193ded463"]

// Bring Provider inside wrapper here to avoid hydration error because Context Providers are not SSR compatible
const TokenContentWrapper = ({
  initialRemix,
  initialTokenMetrics,
}: {
  initialRemix: Remix
  initialTokenMetrics?: TokenMetrics
}) => {
  return (
    <TokenMetricsByAddressProvider address={initialRemix.token_address} initialTokenMetrics={initialTokenMetrics}>
      <TokenContent initialRemix={initialRemix} />
    </TokenMetricsByAddressProvider>
  )
}

const TokenContent = ({ initialRemix }: { initialRemix: Remix }) => {
  const { data: remix } = useQuery({
    queryKey: ["remix", initialRemix.token_address],
    queryFn: async () => {
      return await fetch(`${getAPIRootUrl()}/remixes/${initialRemix.token_address}`).then((res) => res.json())
    },
    refetchInterval: 10000, // 10 seconds
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,
    initialData: initialRemix,
  })

  // Swaps now come entirely from the shared Electric shape (tokenSwaps below)

  const router = useRouter()
  const { address } = useAccount()
  const isLoggedIn = !!address
  const { stackPayload, isOpen: stackIsOpen, currentStackId } = useMobileStack()
  const tradeDrawerKey =
    stackIsOpen && currentStackId === "tokenTrade"
      ? `${remix.token_address}-trade-${stackPayload?.tradeDefaultMode ?? Mode.BUY}`
      : `${remix.token_address}-trade-closed`
  const { metrics } = useTokenMetricsByAddressContext()
  const [currentEndorsement, setCurrentEndorsement] = useState<"none" | "official" | "liked" | "flagged">(
    remix.owner_endorsement || "none"
  )

  // Handle endorsement changes - direct state update
  const handleEndorsementChange = (newEndorsement: "none" | "official" | "liked" | "flagged") => {
    setCurrentEndorsement(newEndorsement)
  }
  const [pnlCardOpen, setPnlCardOpen] = useState(false)
  const [tokenImageViewerOpen, setTokenImageViewerOpen] = useState(false)
  const { user } = useProfile()
  const { isIpOwner } = useIsIpOwner(remix.ip)
  // Single shared swaps shape — all viewers of this token share one Electric shape (24h window)
  const { swaps: tokenSwaps } = useTokenSwaps(remix.token_address)
  const showPinnedOwnerCard = Boolean(remix.ip?.is_verified && isIpOwner)

  // Optimistic metrics from user's own swap — overlays until Electric catches up
  const optimistic = useOptimisticMetric(remix.token_address)
  const metricsTimestampRef = useRef(metrics?.timestamp)
  useEffect(() => {
    // Clear optimistic value once Electric delivers a newer row
    if (optimistic && metrics?.timestamp && metrics.timestamp !== metricsTimestampRef.current) {
      metricsTimestampRef.current = metrics.timestamp
      clearOptimisticMetric(remix.token_address)
    }
  }, [metrics?.timestamp, optimistic, remix.token_address])

  // Live metrics take priority over the stale REST snapshot on remix
  // PnL + starting MC need IP price — must be declared before displayMarketCap
  const ipPrice = useIpPrice()
  // displayMarketCap is set below

  // Single source of truth: Electric token_metrics → REST
  // If MC is 0 in backend (unseeded), the change % is meaningless — show 0
  const rawMcapChange = metrics?.market_cap_change_24h ?? remix.market_cap_change ?? 0
  const displayMarketCapChange = metrics?.total_market_cap_usd_int || remix.market_cap ? rawMcapChange : 0
  const baseGraduationProgress = metrics?.graduation_progress || remix.graduation_progress || 0
  const displayGraduationProgress = useSwapGraduation(tokenSwaps, baseGraduationProgress, remix.is_graduated)
  // total_value_locked_usd from patched metrics is a formatted display string (e.g. "5.4K"),
  // so we derive USD from the raw IP value × live IP price for a real-time number
  const displayLiquidity =
    parseFloat(String(metrics?.total_value_locked_ip ?? 0)) * (ipPrice || 0) || remix.pool_size || 0

  // Price & mcap from token_metrics (Electric shape, updated by hot path ~5ms per swap)
  // Falls back to REST remix data → starting mcap for freshly created tokens
  const displayMarketCap = optimistic?.marketCapUsd || metrics?.total_market_cap_usd_int || remix.market_cap || 0

  // PnL from backend endpoint, recomputed with live price from token_metrics
  const livePriceUsd = Number(metrics?.price_usd ?? 0)
  const { pnl: tokenPnl, invalidate: invalidatePnl } = useTokenPnl(remix.token_address, tokenSwaps, livePriceUsd)

  // Invalidate PnL endpoint when user completes a trade so baseline refreshes.
  // The swap overlay handles instant display; this just reconciles the baseline.
  const onTradeSuccess = useCallback(() => {
    setTimeout(() => invalidatePnl(), 10000)
  }, [invalidatePnl])

  // PnL hook accumulates user's new swaps from shape automatically

  const pnlData = useMemo(() => {
    if (!tokenPnl || (tokenPnl.totalBoughtUsd === 0 && tokenPnl.totalSoldUsd === 0)) return null

    const { totalBoughtUsd, totalSoldUsd, netPnlUsd, pnlPercent } = tokenPnl

    const absPnl = Math.abs(netPnlUsd)
    const isPositive = netPnlUsd >= 0
    const showPnl = absPnl >= 0.01
    const formattedPercent = Number.isFinite(pnlPercent) ? pnlPercent : 0

    const formatPnlDollar = (v: number) => {
      if (v < 1) return v.toFixed(2)
      if (v < 10) return v.toFixed(1)
      if (v < 100) return Math.round(v).toString()
      return formatNumberWithSuffix(v)
    }

    return {
      pnlDollar: showPnl ? `${isPositive ? "+" : "-"}$${formatPnlDollar(absPnl)}` : "+$0",
      pnlPercent: showPnl ? `${formattedPercent >= 0 ? "+" : ""}${formattedPercent.toFixed(1)}%` : "+0.0%",
      isPositive: showPnl ? isPositive : true,
      totalBought: `$${formatNumberWithSuffix(totalBoughtUsd)}`,
      totalSold: `$${formatNumberWithSuffix(totalSoldUsd)}`,
      entryMc: tokenPnl.totalBoughtUsd > 0 ? `$${formatNumberWithSuffix(tokenPnl.totalBoughtUsd)}` : "—",
      exitMc: tokenPnl.holdingValueUsd > 0 ? `$${formatNumberWithSuffix(tokenPnl.holdingValueUsd)}` : "—",
    }
  }, [tokenPnl, displayMarketCap])

  // Check if current token should use CoinGecko TradingView
  const useCoinGeckoChart = COINGECKO_TOKENS.includes(remix.token_address?.toLowerCase?.() ?? "")

  const { data: contractData } = useReadContracts({
    contracts: [
      {
        address: getContractAddress("IPOwnerVault") as `0x${string}`,
        abi: IPOwnerVaultABI,
        functionName: "released",
        args: [remix.token_address],
      },
      {
        address: getContractAddress("IPOwnerVault") as `0x${string}`,
        abi: IPOwnerVaultABI,
        functionName: "releasable",
        args: [remix.token_address],
      },
      {
        address: remix.token_address as `0x${string}`,
        abi: IPTokenABI,
        functionName: "balanceOf",
        args: [getContractAddress("IPWorld") as `0x${string}`],
      },
    ],
    multicallAddress: "0xcA11bde05977b3631167028862bE2a173976CA11",
    query: { staleTime: 30_000 },
  })

  const releasedAmount = contractData?.[0]?.result
  const releasableAmount = contractData?.[1]?.result
  const communityReward = contractData?.[2]?.result

  // Fetch creator profile if this is a creator IP and we have owner_address
  const { data: creatorProfile } = useQuery<{ avatar_url?: string } | null>({
    queryKey: ["creator-profile", remix?.ip?.owner_address],
    queryFn: () => fetchJSONWithAuth(`/users/${remix?.ip?.owner_address}/profile`),
    enabled: remix?.ip?.type === "creator" && !!remix?.ip?.owner_address,
  })

  // Resolve token creator wallet → display username
  const { data: tokenCreatorUsername, isLoading: isTokenCreatorLoading } = useQuery({
    queryKey: ["creator-username", remix.creator],
    queryFn: async () => {
      const res = await fetch(`${getAPIRootUrl()}/users/${remix.creator}/profile`)
      if (!res.ok) return null
      const data = await res.json()
      return (data?.data?.user?.username as string | null) || null
    },
    enabled: !!remix.creator,
    staleTime: 5 * 60_000,
  })
  const tokenCreatorDisplay = isTokenCreatorLoading
    ? null
    : tokenCreatorUsername || (remix.creator ? truncateAddress(remix.creator as `0x${string}`) : null)

  const ipOwnerRewardAmount = useMemo(() => {
    const price = remix.price_usd ?? 0
    const releasableAmountUsd =
      releasableAmount && typeof releasableAmount === "bigint"
        ? bigNumberToFloat(releasableAmount, remix.decimals) * price
        : 0
    const releasedAmountUsd =
      releasedAmount && typeof releasedAmount === "bigint"
        ? bigNumberToFloat(releasedAmount, remix.decimals) * price
        : 0

    return releasableAmountUsd + releasedAmountUsd + (remix.total_weth_to_ip_owner_usd || 0)
  }, [releasableAmount, releasedAmount, remix])

  const communityRewardAmount = useMemo(() => {
    const price = Number(metrics?.price_usd ?? "0")
    return communityReward ? bigNumberToFloat(communityReward as bigint, remix.decimals) * (price || 0) : 0
  }, [communityReward, remix, metrics])

  const getSocialUrl = (type: SOCIAL_TYPE, account: string) => {
    const username = account.startsWith("@") ? account.slice(1) : account

    switch (type) {
      case SOCIAL_TYPE.TWITTER:
        return `https://twitter.com/${username}`
      case SOCIAL_TYPE.INSTAGRAM:
        return `https://instagram.com/${username}`
      case SOCIAL_TYPE.TIKTOK:
        return `https://tiktok.com/@${username}`
      default:
        return null
    }
  }
  // Debug-only override for the UGC card state. `null` = auto-detect from live conditions.
  // Cycle order: auto → no_account → before_bonding → active → auto
  const [ugcDebugState, setUgcDebugState] = useState<UgcCardState | null>(null)
  const cycleUgcDebugState = useCallback(() => {
    setUgcDebugState((prev) => {
      if (prev === null) return "no_account"
      if (prev === "no_account") return "before_bonding"
      if (prev === "before_bonding") return "active"
      return null
    })
  }, [])
  const ugcDebugLabel =
    ugcDebugState === null
      ? "Auto"
      : ugcDebugState === "no_account"
        ? "No Account"
        : ugcDebugState === "before_bonding"
          ? "Before Bonding"
          : "Active"

  const ugcStateCycleButton =
    process.env.NODE_ENV === "development" ? (
      <button
        type="button"
        onClick={cycleUgcDebugState}
        title="Cycle UGC card state — Figma 6119:11516"
        className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-[#a572ed] bg-[#321f4d]/95 px-3 py-2 font-mono text-[11px] font-bold tracking-wide text-[#dfcdf9] shadow-[0_4px_16px_rgba(0,0,0,0.2)] backdrop-blur-md transition-colors hover:bg-[#552d8f]"
      >
        <span className="rounded-sm bg-[#a572ed] px-1.5 py-0.5 text-[10px] uppercase text-[#321f4d]">UGC</span>
        <span className="uppercase">{ugcDebugLabel}</span>
      </button>
    ) : null

  /** Solo UGC bonding rail: hide Top Earners / Trend; height follows bonding card (not 503px). */
  const ugcBondingOnly = useMemo(() => {
    const resolved = resolveUgcViewerCardState({
      isLoggedIn,
      isGraduated: remix.is_graduated,
      remixIsGraduated: remix.is_graduated,
      graduationProgress: displayGraduationProgress ?? remix.graduation_progress ?? 0,
      forceUgcState: ugcDebugState,
    })
    if (resolved !== "before_bonding") return false
    const debugForcesUgcPreview = ugcDebugState != null
    const showIpOwnerCard =
      isLoggedIn && Boolean(remix.ip?.is_verified) && isIpOwner && !debugForcesUgcPreview
    return !showIpOwnerCard
  }, [
    isLoggedIn,
    remix.is_graduated,
    remix.graduation_progress,
    remix.ip?.is_verified,
    displayGraduationProgress,
    ugcDebugState,
    isIpOwner,
  ])

  const [mobileTab, setMobileTab] = useState<string>("feed")
  const [feedSourceOption, setFeedSourceOption] = useState("all")
  const [feedMyPostsEnabled, setFeedMyPostsEnabled] = useState(false)
  const [feedIpWorldCreatorsEnabled, setFeedIpWorldCreatorsEnabled] = useState(false)
  const feedFilters = useMemo<TokenFeedFiltersState>(
    () => ({
      feedSourceOption,
      setFeedSourceOption,
      feedMyPostsEnabled,
      setFeedMyPostsEnabled,
      feedIpWorldCreatorsEnabled,
      setFeedIpWorldCreatorsEnabled,
    }),
    [feedSourceOption, feedMyPostsEnabled, feedIpWorldCreatorsEnabled]
  )

  const mobileTabOptions = [
    { key: "feed", label: "Feed" },
    { key: "txns", label: "Txns" },
    { key: "holders", label: "Holders" },
    { key: "comments", label: "Comments" },
    { key: "treasury", label: "Treasury" },
  ]

  return (
    <>
      {/* ═══════════════════ MOBILE LAYOUT ═══════════════════ */}
      <div className="flex max-w-full flex-col pb-[max(5.5rem,env(safe-area-inset-bottom)+4.5rem)] md:hidden">
        {/* Row 1: Token image + name/ticker (most prominent) */}
        <div className="flex items-center gap-3 px-4 pt-3 pb-2">
          <button
            type="button"
            onClick={() => setTokenImageViewerOpen(true)}
            className="h-[52px] w-[52px] shrink-0 cursor-pointer border-0 bg-transparent p-0"
            aria-label={`View ${remix.name} image`}
            title="View image"
          >
            <Image
              src={remix.image}
              alt={remix.name}
              width={52}
              height={52}
              className="h-[52px] w-[52px] rounded-[10px] object-cover"
            />
          </button>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="truncate text-xl font-bold text-white">{remix.name}</span>
              <span className="shrink-0 text-sm font-medium text-neutral-400 uppercase">${remix.symbol}</span>
            </div>
            {/* Row 2: IP badge + owner + treasure chest */}
            <MobileOwnerTreasure remix={remix} ipOwnerRewardAmount={ipOwnerRewardAmount} />
          </div>
        </div>

        {/* Row 3: Created / Holders / Posts (secondary) */}
        <div className="flex items-center gap-4 px-4 pb-3">
          <div className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 1.75C3.55 1.75 1.75 3.55 1.75 7C1.75 10.45 3.55 12.25 7 12.25C10.45 12.25 12.25 10.45 12.25 7C12.25 3.55 10.45 1.75 7 1.75ZM7 11.08C4.2 11.08 2.92 9.8 2.92 7C2.92 4.2 4.2 2.92 7 2.92C9.8 2.92 11.08 4.2 11.08 7C11.08 9.8 9.8 11.08 7 11.08ZM9.33 8.75H6.42V4.67H7.58V7.58H9.33V8.75Z"
                fill="#666"
              />
            </svg>
            <span className="font-mono text-xs text-neutral-400">{formatTimeAgo(remix.created_at)}</span>
          </div>
          <div className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 1.75C4.1 1.75 1.75 4.1 1.75 7C1.75 9.9 4.1 12.25 7 12.25C9.9 12.25 12.25 9.9 12.25 7C12.25 4.1 9.9 1.75 7 1.75ZM7 3.5C7.69 3.5 8.25 4.06 8.25 4.75C8.25 5.44 7.69 6 7 6C6.31 6 5.75 5.44 5.75 4.75C5.75 4.06 6.31 3.5 7 3.5ZM9.25 9.75H4.75V9.25C4.75 8.01 6.01 7 7 7C7.99 7 9.25 8.01 9.25 9.25V9.75Z"
                fill="#666"
              />
            </svg>
            <span className="font-mono text-xs text-neutral-400">
              {formatNumberWithSuffix(remix.social_stats?.number_of_holders ?? remix.number_of_holders ?? 0)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M2.33 2.33V11.67H11.67V10.5H3.5V2.33H2.33ZM10.83 3.5H8.17L9.24 4.57L7 6.81L5.83 5.65L3.5 7.98L4.33 8.81L5.83 7.31L7 8.48L9.91 5.57L10.83 6.49V3.5Z"
                fill="#666"
              />
            </svg>
            <span className="font-mono text-xs text-neutral-400">
              {formatNumberWithSuffix(remix.social_stats?.total_post_count ?? 0)}
            </span>
          </div>
        </div>

        {/* Row 4: MC / Liquidity / Bonding — big and clear */}
        <div className="px-4 pb-2">
          <div className="rounded-[14px] border border-neutral-700 bg-neutral-800/80 p-3">
            {/* Market Cap — hero stat */}
            <div className="mb-3 flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl font-bold text-white">
                  ${formatNumberWithSuffix(displayMarketCap)}
                </span>
                <span
                  className={cn(
                    "font-mono text-sm font-semibold",
                    displayMarketCapChange >= 0 ? "text-green-neon" : "text-pink-neon"
                  )}
                >
                  {displayMarketCapChange >= 0 ? "+" : ""}
                  {formatNumberWithSuffix(displayMarketCapChange)}%
                </span>
              </div>
              <span className="text-xs text-neutral-400">MC</span>
            </div>
            {/* Liquidity + Bonding row */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400">Liq</span>
                <span className="font-mono text-sm font-semibold text-white">
                  ${formatNumberWithSuffix(displayLiquidity)}
                </span>
              </div>
              <div className="h-3 w-px bg-neutral-600" />
              <div className="flex flex-1 items-center gap-2">
                <span className="text-xs text-neutral-400">Bond</span>
                <div className="flex flex-1 items-center gap-2">
                  <div className="relative h-2 flex-1 rounded-full bg-neutral-600">
                    <div
                      className="bg-green-neon absolute inset-y-0 left-0 rounded-full"
                      style={{ width: `${displayGraduationProgress}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs font-semibold text-white">{displayGraduationProgress.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <RemixChangesByTimeframe remix={remix} swaps={tokenSwaps} electricMetrics={metrics} />
        <div className="h-[min(58vh,580px)] w-full pl-4">
          {useCoinGeckoChart ? (
            <CoinGeckoTradingView tokenAddress={remix.token_address} />
          ) : (
            <TradingView tokenAddress={remix.token_address} tokenSymbol={remix.symbol} hideLeftToolbar />
          )}
        </div>

        <div className="px-4 pb-3">
          <HolderRewardsCard
            tokenAddress={remix.token_address}
            tokenSymbol={remix.symbol}
            swaps={tokenSwaps}
            livePriceUsd={livePriceUsd}
          />
        </div>
        <div className="flex flex-col gap-4 px-3 pb-6">
          <ReferBanner remix={remix} />
          <div className="flex flex-col gap-2">
            <TokenRightRailCarousel
              ugcBondingOnly={ugcBondingOnly}
              rewardsPanel={
                <OwnerEarning
                  remixId={remix.id}
                  tokenAddress={remix.token_address}
                  remix={{ ...remix, owner_endorsement: currentEndorsement }}
                  isGraduated={remix.is_graduated}
                  graduationProgress={displayGraduationProgress}
                  ip={remix.ip}
                  onEndorsementChange={handleEndorsementChange}
                  swaps={tokenSwaps}
                  livePriceUsd={livePriceUsd}
                  forceUgcState={ugcDebugState ?? undefined}
                />
              }
              topEarnersPanel={<TopEarners tokenAddress={remix.token_address} />}
            />
            {ugcStateCycleButton}
          </div>
          {mobileTab === "feed" ? <TokenFeedFiltersPanel filters={feedFilters} /> : null}
        </div>

        {/* Tab bar: Feed / Holders / Comments / Treasury */}
        <div className="flex gap-1 border-b border-neutral-700 px-4 pt-3 pb-0">
          {mobileTabOptions.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setMobileTab(tab.key)}
              className={cn(
                "flex-1 border-b-2 pb-2.5 text-center text-sm font-medium transition-colors",
                mobileTab === tab.key ? "border-white text-white" : "border-transparent text-neutral-400"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="min-h-[300px] pt-3">
          {mobileTab === "feed" && remix.ip && (
            <div className="mobile-feed-wrapper">
              <Feeds ip={remix.ip as any} remix={remix} feedFilters={feedFilters} hideInlineFilters />
            </div>
          )}
          {mobileTab === "txns" && (
            <Transactions remix={remix} swaps={tokenSwaps} />
          )}
          {mobileTab === "holders" && (
            <div className="px-4">
              <Holders />
            </div>
          )}
          {mobileTab === "comments" && (
            <div className="px-4">
              <Comments remix={remix} />
            </div>
          )}
          {mobileTab === "treasury" && remix.ip && <Proposals remix={remix} ip={remix.ip} />}
        </div>
      </div>

      <TokenImageViewerDialog open={tokenImageViewerOpen} onOpenChange={setTokenImageViewerOpen} remix={remix} />

      <PnlCardDialog
        open={pnlCardOpen}
        onOpenChange={setPnlCardOpen}
        data={{
          symbol: remix.symbol,
          imageUrl: remix.image?.startsWith("https") ? remix.image : `/images/ip/${remix.image ?? ""}`,
          pnlPercent: pnlData?.pnlDollar ?? "--",
          pnlChange: pnlData?.pnlPercent,
          isPositive: pnlData?.isPositive ?? true,
          entryPrice: pnlData?.entryMc ?? "—",
          exitPrice:
            pnlData?.exitMc ?? (metrics?.price_usd ? `$${Number(metrics.price_usd).toFixed(4)}` : "—"),
          username: user?.username ? `@${user.username}` : "—",
          avatarUrl: user?.avatar_url ?? undefined,
        }}
      />

      {/* ═══════════════════ MOBILE STICKY — open trade drawer ═══════════════════ */}
      <div className="fixed right-0 bottom-0 left-0 z-50 md:hidden">
        <div className="bg-gradient-to-t from-black via-black/95 to-transparent px-4 pt-3 pb-[max(2rem,env(safe-area-inset-bottom))]">
          <MobileStackTrigger stackId="tokenTrade" className="w-full">
            <button
              type="button"
              className="bg-green-neon min-h-12 w-full rounded-[14px] py-3.5 text-base font-bold text-black"
            >
              Trade
            </button>
          </MobileStackTrigger>
        </div>
      </div>

      {/* ═══════════════════ DESKTOP LAYOUT ═══════════════════ */}
      <div className="hidden md:block">
        <div className="h-12 md:hidden" />
        {showPinnedOwnerCard ? (
          /* Owner layout: right sidebar spans full height, OwnerEarning becomes sticky on scroll */
          <>
            <div className="flex w-full flex-col md:flex-row">
              {/* Left column: chart + TokenData */}
              <div className="flex min-w-0 flex-1 flex-col">
                <ReferBanner remix={remix} />
                <div>
                  <Header remix={{ ...remix, owner_endorsement: currentEndorsement }} />
                </div>
                <TokenChartPanel
                  variant="owner"
                  displayMarketCap={displayMarketCap}
                  displayMarketCapChange={displayMarketCapChange}
                  displayLiquidity={displayLiquidity}
                  displayGraduationProgress={displayGraduationProgress}
                  priceUsd={livePriceUsd}
                  useCoinGeckoChart={useCoinGeckoChart}
                  tokenAddress={remix.token_address}
                  tokenSymbol={remix.symbol}
                  holderCount={metrics?.holder_count || remix.number_of_holders || 0}
                  communityRewardAmount={communityRewardAmount}
                  creator={remix.creator}
                  tokenCreatorDisplay={tokenCreatorDisplay}
                  tokenAge={formatTimeAgo(remix.token_created_at || remix.created_at)}
                  description={remix.description}
                />
                <TokenData remix={remix} swaps={tokenSwaps} feedFilters={feedFilters} />
              </div>

              {/* Right column: continuous sidebar */}
              <div className="w-full shrink-0 px-4 pt-0 pb-4 pl-3 md:w-[23.5rem]">
                {/* Timeframe + buy card: not sticky for owner */}
                <div className="flex flex-col gap-3">
                  <RemixChangesByTimeframe remix={remix} swaps={tokenSwaps} electricMetrics={metrics} />
                  <Trade
                    remix={remix}
                    swaps={tokenSwaps}
                    onTradeSuccess={onTradeSuccess}
                    onOpenPnlCard={() => setPnlCardOpen(true)}
                  />
                  <HolderRewardsCard
                    tokenAddress={remix.token_address}
                    tokenSymbol={remix.symbol}
                    swaps={tokenSwaps}
                    livePriceUsd={livePriceUsd}
                  />
                </div>
                {/* UGC Rewards / Top Earners / Trend Context carousel: sticky when scrolled to */}
                <div className="sticky top-[69px] z-10 mt-3 flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    <TokenRightRailCarousel
                      ugcBondingOnly={ugcBondingOnly}
                      rewardsPanel={
                        <OwnerEarning
                          remixId={remix.id}
                          tokenAddress={remix.token_address}
                          remix={{ ...remix, owner_endorsement: currentEndorsement }}
                          isGraduated={remix.is_graduated}
                          graduationProgress={displayGraduationProgress}
                          ip={remix.ip}
                          onEndorsementChange={handleEndorsementChange}
                          swaps={tokenSwaps}
                          livePriceUsd={livePriceUsd}
                          forceUgcState={ugcDebugState ?? undefined}
                        />
                      }
                      topEarnersPanel={<TopEarners tokenAddress={remix.token_address} />}
                    />
                    {ugcStateCycleButton}
                  </div>
                  <TokenFeedFiltersPanel filters={feedFilters} />
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Non-owner layout: two sections so UGC card stacks up over trade */
          <>
            <div className="flex w-full flex-col md:flex-row">
              <div className="flex min-w-0 flex-1 flex-col">
                <ReferBanner remix={remix} />
                <div>
                  <Header remix={{ ...remix, owner_endorsement: currentEndorsement }} />
                </div>
                <TokenChartPanel
                  variant="viewer"
                  displayMarketCap={displayMarketCap}
                  displayMarketCapChange={displayMarketCapChange}
                  displayLiquidity={displayLiquidity}
                  displayGraduationProgress={displayGraduationProgress}
                  priceUsd={livePriceUsd}
                  useCoinGeckoChart={useCoinGeckoChart}
                  tokenAddress={remix.token_address}
                  tokenSymbol={remix.symbol}
                  holderCount={metrics?.holder_count || remix.number_of_holders || 0}
                  communityRewardAmount={communityRewardAmount}
                  creator={remix.creator}
                  tokenCreatorDisplay={tokenCreatorDisplay}
                  tokenAge={formatTimeAgo(remix.token_created_at || remix.created_at)}
                  description={remix.description}
                />
              </div>

              <div className="w-full shrink-0 px-4 pt-0 pb-4 pl-3 md:w-[23.5rem]">
                <div className="sticky top-[69px] z-10 flex flex-col gap-3">
                  <RemixChangesByTimeframe remix={remix} swaps={tokenSwaps} electricMetrics={metrics} />
                  <Trade
                    remix={remix}
                    swaps={tokenSwaps}
                    onTradeSuccess={onTradeSuccess}
                    onOpenPnlCard={() => setPnlCardOpen(true)}
                  />
                  <HolderRewardsCard
                    tokenAddress={remix.token_address}
                    tokenSymbol={remix.symbol}
                    swaps={tokenSwaps}
                    livePriceUsd={livePriceUsd}
                  />
                </div>
              </div>
            </div>

            <div className="flex w-full md:flex-row">
              <div className="min-w-0 flex-1 border-t border-neutral-600 md:border-t-0">
                <TokenData remix={remix} swaps={tokenSwaps} feedFilters={feedFilters} />
              </div>

              <div className="w-full shrink-0 px-4 pb-4 pl-3 md:w-[23.5rem]">
                <div className="sticky top-17 z-10 flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <TokenRightRailCarousel
                      ugcBondingOnly={ugcBondingOnly}
                      rewardsPanel={
                        <OwnerEarning
                          remixId={remix.id}
                          tokenAddress={remix.token_address}
                          remix={{ ...remix, owner_endorsement: currentEndorsement }}
                          isGraduated={remix.is_graduated}
                          graduationProgress={displayGraduationProgress}
                          ip={remix.ip}
                          onEndorsementChange={handleEndorsementChange}
                          swaps={tokenSwaps}
                          livePriceUsd={livePriceUsd}
                          forceUgcState={ugcDebugState ?? undefined}
                        />
                      }
                      topEarnersPanel={<TopEarners tokenAddress={remix.token_address} />}
                    />
                    {ugcStateCycleButton}
                  </div>
                  <TokenFeedFiltersPanel filters={feedFilters} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom sheets (shared) */}
      <BottomSheetContent id="tokenTrade" height="58%" adjustForKeyboard={true}>
        <div className="flex flex-col gap-3 px-2 pt-0">
          <Trade
            key={tradeDrawerKey}
            remix={remix}
            swaps={tokenSwaps}
            defaultMode={stackPayload?.tradeDefaultMode}
            onTradeSuccess={onTradeSuccess}
            onOpenPnlCard={() => setPnlCardOpen(true)}
          />
        </div>
      </BottomSheetContent>

      <BottomSheetContent id="comments">
        <div className="p-4">
          <Comments remix={remix} />
        </div>
      </BottomSheetContent>

    </>
  )
}

function isMobileChestOpen(remix: Remix): boolean {
  const ip = remix.ip
  if (!ip) return false
  if (ip.type === "community") return remix.is_graduated === true
  return !!ip.owner_address
}

function getMobileOwnerSocialUrl(accountType: SOCIAL_TYPE | undefined, account: string): string | null {
  const username = account.startsWith("@") ? account.slice(1) : account
  switch (accountType) {
    case SOCIAL_TYPE.TWITTER:
      return `https://x.com/${username}`
    case SOCIAL_TYPE.TIKTOK:
      return `https://tiktok.com/@${username}`
    case SOCIAL_TYPE.INSTAGRAM:
      return `https://instagram.com/${username}`
    default:
      return null
  }
}

function MobileOwnerTreasure({ remix, ipOwnerRewardAmount }: { remix: Remix; ipOwnerRewardAmount: number }) {
  const ip = remix.ip
  const isCommunity = ip?.type === "community"
  const showChest = true
  const chestOpen = isMobileChestOpen(remix)
  const ownerOnboarded = !!ip?.owner_address
  const showOwnerTag = !isCommunity && !!ip?.owner_account
  const showSocialBadge = ip?.is_verified && ip?.owner_account_type && !isCommunity
  const ownerUrl = ip?.owner_account ? getMobileOwnerSocialUrl(ip.owner_account_type, ip.owner_account) : null

  const ownerPillClasses = cn(
    "flex items-center gap-1 rounded-[6px] border border-[#484848] px-1.5 py-0.5",
    ownerOnboarded ? "bg-[#3A3A3A]" : "bg-[rgba(90,90,103,0.4)]"
  )

  const handleColor = ownerOnboarded ? "text-white" : "text-[#797979]"

  const ownerPillContent = (
    <>
      {!ownerOnboarded && <OwnerWarning size={11} />}
      {ip?.owner_account_type === SOCIAL_TYPE.TWITTER && (
        <span className={handleColor}>
          <Twitter size={10} />
        </span>
      )}
      {ip?.owner_account_type === SOCIAL_TYPE.TIKTOK && (
        <span className={handleColor}>
          <Tiktok size={10} />
        </span>
      )}
      <span className={cn("text-xs font-medium", handleColor)}>@{ip?.owner_account}</span>
    </>
  )

  return (
    <div className="flex items-center gap-2">
      <IpInfoBadge remix={remix} />
      {showOwnerTag &&
        (ownerUrl ? (
          <Link
            href={ownerUrl}
            target="_blank"
            className={cn(ownerPillClasses, "transition-colors hover:bg-[rgba(90,90,103,0.6)]")}
          >
            {ownerPillContent}
          </Link>
        ) : (
          <div className={ownerPillClasses}>{ownerPillContent}</div>
        ))}
      {showSocialBadge && (
        <div className="flex items-center">
          {ip?.owner_account_type === SOCIAL_TYPE.TWITTER && <TwitterBadge size={18} />}
          {ip?.owner_account_type === SOCIAL_TYPE.TIKTOK && <TikTokBadge size={18} />}
        </div>
      )}
      {showChest && (
        <div
          className={cn(
            "flex items-center gap-1 rounded-[6px] px-1.5 py-0.5",
            chestOpen ? "bg-[#2A2A30] text-[#C093FF]" : "bg-[#2A2A30] text-[#494949]"
          )}
        >
          {chestOpen ? <TreasureChestFilled /> : <TreasureChestLocked size={12} />}
          <span className={cn("font-mono text-xs font-semibold", chestOpen ? "text-[#C093FF]" : "text-[#494949]")}>
            {ip?.owner_rewards_usd != null
              ? `$${formatNumberWithSuffix(ip.owner_rewards_usd)}`
              : ipOwnerRewardAmount > 0
                ? `$${formatNumberWithSuffix(ipOwnerRewardAmount)}`
                : "—"}
          </span>
        </div>
      )}
    </div>
  )
}

const RemixChangesByTimeframe = ({
  remix,
  swaps,
  electricMetrics,
}: {
  remix: Remix
  swaps: SwapRow[]
  electricMetrics?: TokenMetricsPatched
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<number | null>(null)
  const prevSelectedTimeframe = useRef<number | null>(null)
  const startingRatio = useMemo(() => getStartingPriceRatio(remix.token_address), [remix.token_address])
  const liveMetrics = useLiveTradingMetrics(swaps, startingRatio)

  const timeframe = useMemo(() => {
    const intervals: Array<{ key: "5m" | "1h" | "6h" | "24h"; label: string }> = [
      { key: "5m", label: "5m" },
      { key: "1h", label: "1hr" },
      { key: "6h", label: "6hr" },
      { key: "24h", label: "24hr" },
    ]

    return intervals.map(({ key, label }) => {
      const rest = remix.trading_metrics?.[key]
      const live = liveMetrics?.[key]

      // Price change: Electric token_metrics (updated per swap by backend hot path) → REST
      let priceChangePercentage = 0
      if (key === "5m") {
        priceChangePercentage = electricMetrics?.price_change_5m_pct || rest?.price_change || 0
      } else if (key === "1h") {
        priceChangePercentage = electricMetrics?.price_change_1h_pct || rest?.price_change || 0
      } else if (key === "6h") {
        priceChangePercentage = electricMetrics?.price_change_6h_pct || rest?.price_change || 0
      } else if (key === "24h") {
        priceChangePercentage = electricMetrics?.price_change_24h || rest?.price_change || 0
      }

      return {
        label,
        priceChangePercentage,
        // Tx counts + volumes: swap-derived (live aggregation from shape)
        totalTxBuy: live?.buyCount ?? rest?.buy_count ?? 0,
        totalTxSell: live?.sellCount ?? rest?.sell_count ?? 0,
        totalVolumeBuyUSD: live?.buyVolumeUsd ?? rest?.buy_volume ?? 0,
        totalVolumeSellUSD: live?.sellVolumeUsd ?? rest?.sell_volume ?? 0,
      }
    })
  }, [remix.trading_metrics, liveMetrics, electricMetrics])

  useEffect(() => {
    prevSelectedTimeframe.current = selectedTimeframe
  }, [selectedTimeframe])
  return (
    <div className={cn("flex flex-col gap-2 rounded-[12px] mx-2 mb-2 md:m-0 p-2 transition-[margin]", selectedTimeframe !== null && "mx-4 md:m-0 mb-3 border")}>
      <div className="flex items-center justify-between gap-2">
        {timeframe.map((item, index) => (
          <div
            key={item.label}
            className={cn(
              "box-border flex !h-[49px] flex-1 cursor-pointer flex-col items-center gap-1 rounded-[8px] border py-2 transition-all duration-300 hover:border-neutral-200",
              selectedTimeframe === index && "bg-neutral-700"
            )}
            onClick={() => setSelectedTimeframe(selectedTimeframe === index ? null : index)}
          >
            <div className="text-sm text-white">{item.label}</div>
            <div
              className={cn(
                "inline-block text-xs",
                item.priceChangePercentage > 0 ? "text-green-neon" : "text-pink-neon"
              )}
            >
              {item.priceChangePercentage > 0 ? "+" : ""}
              {item.priceChangePercentage.toFixed(1)}%
            </div>
          </div>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {selectedTimeframe !== null && (
          <motion.div
            key={"expanded-timeframe"}
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{
              opacity: 1,
              height: "auto",
              scale: 1,
              transition: { duration: 0.2, opacity: { duration: 0.15, delay: 0.05 } },
            }}
            exit={{ opacity: 0, height: 0, scale: 0.95, transition: { duration: 0.2, opacity: { duration: 0.15 } } }}
            className="flex w-full items-center justify-stretch overflow-hidden"
          >
            <div className="h-fit flex-1 pt-2 text-sm text-white">
              <div className="mb-3 flex w-full flex-col gap-2">
                <div className="font-mono font-semibold text-white">
                  {formatNumberWithSuffix(
                    timeframe[selectedTimeframe].totalTxBuy + timeframe[selectedTimeframe].totalTxSell
                  )}{" "}
                  <span className="font-sans font-medium text-neutral-300">Transactions</span>
                </div>
                <div className="flex w-full flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs text-neutral-300">
                    <div>Buys</div>
                    <div>Sells</div>
                  </div>
                  <div className="flex h-[4px] w-full items-center gap-[2px] rounded-full">
                    <div
                      className="bg-green-neon h-full rounded-full"
                      style={{
                        width: `${timeframe[selectedTimeframe].totalTxBuy + timeframe[selectedTimeframe].totalTxSell > 0
                          ? (timeframe[selectedTimeframe].totalTxBuy /
                            (timeframe[selectedTimeframe].totalTxBuy + timeframe[selectedTimeframe].totalTxSell)) *
                          100
                          : 50
                          }%`,
                      }}
                    ></div>
                    <div
                      className="bg-pink-neon h-full rounded-full"
                      style={{
                        width: `${timeframe[selectedTimeframe].totalTxBuy + timeframe[selectedTimeframe].totalTxSell > 0
                          ? (timeframe[selectedTimeframe].totalTxSell /
                            (timeframe[selectedTimeframe].totalTxBuy + timeframe[selectedTimeframe].totalTxSell)) *
                          100
                          : 50
                          }%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between font-mono text-xs font-medium text-neutral-200">
                    <div>{formatNumberWithSuffix(timeframe[selectedTimeframe].totalTxBuy)}</div>
                    <div>{formatNumberWithSuffix(timeframe[selectedTimeframe].totalTxSell)}</div>
                  </div>
                </div>
              </div>
              <div className="flex w-full flex-col gap-2">
                <div className="font-mono font-semibold text-white">
                  $
                  {formatNumberWithSuffix(
                    timeframe[selectedTimeframe].totalVolumeBuyUSD + timeframe[selectedTimeframe].totalVolumeSellUSD
                  )}{" "}
                  <span className="font-sans font-medium text-neutral-300">Volume</span>
                </div>
                <div className="flex w-full flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs text-neutral-300">
                    <div>Buy Volume</div>
                    <div>Sell Volume</div>
                  </div>
                  <div className="flex h-[4px] w-full items-center gap-[2px] rounded-full">
                    <div
                      className="bg-green-neon h-full rounded-full"
                      style={{
                        width: `${timeframe[selectedTimeframe].totalVolumeBuyUSD +
                          timeframe[selectedTimeframe].totalVolumeSellUSD >
                          0
                          ? (timeframe[selectedTimeframe].totalVolumeBuyUSD /
                            (timeframe[selectedTimeframe].totalVolumeBuyUSD +
                              timeframe[selectedTimeframe].totalVolumeSellUSD)) *
                          100
                          : 50
                          }%`,
                      }}
                    ></div>
                    <div
                      className="bg-pink-neon h-full rounded-full"
                      style={{
                        width: `${timeframe[selectedTimeframe].totalVolumeBuyUSD +
                          timeframe[selectedTimeframe].totalVolumeSellUSD >
                          0
                          ? (timeframe[selectedTimeframe].totalVolumeSellUSD /
                            (timeframe[selectedTimeframe].totalVolumeBuyUSD +
                              timeframe[selectedTimeframe].totalVolumeSellUSD)) *
                          100
                          : 50
                          }%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between font-mono text-xs font-medium text-neutral-200">
                    <div>${formatNumberWithSuffix(timeframe[selectedTimeframe].totalVolumeBuyUSD)}</div>
                    <div>${formatNumberWithSuffix(timeframe[selectedTimeframe].totalVolumeSellUSD)}</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default TokenContentWrapper
