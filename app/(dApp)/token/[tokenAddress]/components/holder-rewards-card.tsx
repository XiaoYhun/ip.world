"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Clock } from "@/components/icons"
import { Skeleton } from "@/components/ui/skeleton"
import { useIpPrice, useTokenMetricsByAddressContext } from "@/context/token-metrics-context"
import { useAccount } from "@/hooks/use-account"
import { useHolderRewardStats } from "@/hooks/use-holder-reward-stats"
import { useHolderClaims, type HolderClaimItem } from "@/hooks/use-holder-claims"
import { useTokenPnl } from "@/hooks/use-token-pnl"
import type { SwapRow } from "@/hooks/use-token-swaps"
import { TOTAL_SUPPLY } from "@/lib/constants"
import { formatNumberWithSuffix } from "@/lib/number"
import { resolveRewardPoolUsd } from "@/lib/utils/reward-pool"
import { cn } from "@/lib/utils"
import HolderPayoutHistoryModal from "./holder-payout-history-modal"

/** Strongest at the card edges, fades toward the center (inward glow frame). */
const INWARD_EDGE_REWARD_GLOW = [
  "radial-gradient(ellipse 108% 108% at 50% 50%, transparent 56%, rgba(122,61,161,0.34) 78%, rgba(23,62,59,0.28) 100%)",
  "linear-gradient(180deg, rgba(122,61,161,0.6) 0%, rgba(122,61,161,0.22) 24%, transparent 52%)",
  "linear-gradient(0deg, rgba(23,62,59,0.58) 0%, rgba(36,75,52,0.24) 26%, transparent 54%)",
  "linear-gradient(90deg, rgba(91,42,99,0.46) 0%, transparent 38%)",
  "linear-gradient(270deg, rgba(91,73,38,0.4) 0%, transparent 36%)",
].join(", ")

type HolderRewardsCardProps = {
  tokenAddress: string
  tokenSymbol: string
  swaps?: SwapRow[]
  livePriceUsd?: number
  className?: string
}

const MY_REWARDS_TITLE_TAG =
  "inline-flex w-fit items-center rounded-[6px] border border-[#313131] bg-[#151515] px-1.5 py-0.5 text-[12px] leading-none font-medium text-[#b3b3b3]"

const SUBTEXT_MUTED = "text-[#797979]" as const

function formatUsd(value: number | undefined | null): string {
  if (value == null || !Number.isFinite(value)) return "--"
  if (value >= 1000) return `$${Math.round(value).toLocaleString("en-US")}`
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: value >= 10 ? 0 : 2 })}`
}

/** Compact USD for secondary lines (e.g. $1.32M, $240). */
function formatUsdSimplified(value: number | undefined | null): string {
  if (value == null || !Number.isFinite(value)) return "--"
  if (value >= 1000) return `$${formatNumberWithSuffix(value, 2)}`
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
}

function formatCountdown(endAt?: string | null): string {
  if (!endAt) return "--"
  const end = new Date(endAt).getTime()
  if (Number.isNaN(end)) return "--"
  const diffMs = end - Date.now()
  if (diffMs <= 0) return "Now"
  const days = Math.floor(diffMs / 86_400_000)
  const hours = Math.floor((diffMs % 86_400_000) / 3_600_000)
  const totalHours = Math.floor(diffMs / 3_600_000)
  const minutes = Math.max(1, Math.floor((diffMs % 3_600_000) / 60_000))
  if (days >= 1) return `${days}d ${hours}h`
  if (totalHours >= 1) return `${totalHours}h ${minutes}m`
  return `${minutes}m`
}

function holderClaimUsd(item: HolderClaimItem): number {
  return (parseFloat(item.holder_meme_token_claimed_usd) || 0) + (parseFloat(item.holder_wip_claimed_usd) || 0)
}

function holderClaimsUsdSince(items: HolderClaimItem[], sinceUnixSeconds: number): number {
  return items.reduce((sum, item) => {
    const claimedAt = Number(item.claimed_timestamp)
    if (!Number.isFinite(claimedAt) || claimedAt < sinceUnixSeconds) return sum
    return sum + holderClaimUsd(item)
  }, 0)
}

export function HolderRewardsCard({
  tokenAddress,
  tokenSymbol,
  swaps,
  livePriceUsd,
  className,
}: HolderRewardsCardProps) {
  const [debugHoldingState, setDebugHoldingState] = useState<"auto" | "with-holdings" | "without-holdings">("auto")
  const [historyOpen, setHistoryOpen] = useState(false)
  const [earnedRange, setEarnedRange] = useState<"all" | "7d">("all")
  const [nowUnixSeconds, setNowUnixSeconds] = useState<number | null>(null)
  const prefersReducedMotion = useReducedMotion()
  const reduceMotion = prefersReducedMotion === true

  const { address } = useAccount()
  const { metrics } = useTokenMetricsByAddressContext()
  const ipPrice = useIpPrice()
  const { data: stats, isLoading } = useHolderRewardStats(tokenAddress)
  const { data: holderClaimsData } = useHolderClaims(tokenAddress, address, tokenSymbol, 100)
  const { pnl } = useTokenPnl(tokenAddress, swaps, livePriceUsd)

  const holderRewardPoolUsd = useMemo(() => {
    if (!stats) return undefined
    return resolveRewardPoolUsd({
      draftedPoolUsd: stats.pool_rewards?.amount_usd,
      computedCurrentPoolUsd:
        stats.current_pool_ip * (ipPrice || 0) + stats.current_pool_token * (livePriceUsd || 0),
      fallbackTotalPoolUsd: stats.current_pool_usd,
    })
  }, [ipPrice, livePriceUsd, stats])

  const holdingsTokens =
    pnl?.currentQuantityTokens ?? (pnl ? Math.max(0, pnl.boughtQtyTokens - pnl.soldQtyTokens) : undefined)
  const estimatedNextPayoutUsd =
    stats?.me?.estimated_payout_usd != null && Number.isFinite(stats.me.estimated_payout_usd)
      ? stats.me.estimated_payout_usd
      : holdingsTokens && holderRewardPoolUsd
        ? (Math.max(0, holdingsTokens) / TOTAL_SUPPLY) * holderRewardPoolUsd
        : undefined

  const currentHolder = useMemo(() => {
    const normalizedAddress = address?.toLowerCase()
    if (!normalizedAddress) return undefined
    return metrics?.top_holders?.find((holder) => holder.owner_address?.toLowerCase() === normalizedAddress)
  }, [address, metrics?.top_holders])

  const tokenMetricsEarnedUsd = currentHolder?.holder_rewards_amount_usd
    ? parseFloat(currentHolder.holder_rewards_amount_usd)
    : undefined
  const countdown = formatCountdown(stats?.window_end_at)
  const hasRealHoldings = !!address && (holdingsTokens ?? 0) > 0
  const hasHoldingState =
    debugHoldingState === "with-holdings" ? true : debugHoldingState === "without-holdings" ? false : hasRealHoldings
  const debugLabel =
    debugHoldingState === "auto"
      ? "Debug: auto"
      : debugHoldingState === "with-holdings"
        ? "Debug: with holdings"
        : "Debug: no holdings"
  const showDebugButton = process.env.NODE_ENV !== "production"
  const displayHoldingsTokens =
    debugHoldingState === "with-holdings" && holdingsTokens == null ? 1_320_000 : holdingsTokens
  const displayNextPayoutUsd =
    debugHoldingState === "with-holdings" && estimatedNextPayoutUsd == null
      ? holderRewardPoolUsd
      : estimatedNextPayoutUsd
  const displayHoldingsUsd =
    displayHoldingsTokens != null && livePriceUsd != null && Number.isFinite(livePriceUsd) && livePriceUsd >= 0
      ? Math.max(0, displayHoldingsTokens) * livePriceUsd
      : undefined
  const holderClaimRows = useMemo(() => holderClaimsData?.raw.items ?? [], [holderClaimsData?.raw.items])
  const allEarnedUsd =
    holderClaimsData?.totalPayoutUsd && holderClaimsData.totalPayoutUsd > 0
      ? holderClaimsData.totalPayoutUsd
      : stats?.me?.total_earned_usd && stats.me.total_earned_usd > 0
        ? stats.me.total_earned_usd
        : tokenMetricsEarnedUsd

  useEffect(() => {
    setNowUnixSeconds(Math.floor(Date.now() / 1000))
  }, [])

  const sevenDayEarnedUsd = useMemo(() => {
    if (nowUnixSeconds == null) return undefined
    if (holderClaimRows.length === 0) return undefined
    const sevenDaysAgo = nowUnixSeconds - 7 * 24 * 60 * 60
    const sum = holderClaimsUsdSince(holderClaimRows, sevenDaysAgo)
    if (allEarnedUsd != null && Number.isFinite(allEarnedUsd)) {
      return Math.min(sum, allEarnedUsd)
    }
    return sum
  }, [allEarnedUsd, holderClaimRows, nowUnixSeconds])
  const sevenDaySharePct =
    allEarnedUsd != null && allEarnedUsd > 0 && sevenDayEarnedUsd != null && sevenDayEarnedUsd > 0
      ? Math.round(Math.min(100, (sevenDayEarnedUsd / allEarnedUsd) * 100))
      : null
  const displayEarnedUsd = earnedRange === "all" ? allEarnedUsd : sevenDayEarnedUsd

  return (
    <div
      className={cn("featured-card-container font-sf-pro-rounded relative w-full", className)}
      style={{ fontVariantNumeric: "lining-nums tabular-nums" }}
    >
      <div className="group relative w-full transition-all duration-300 ease-out hover:z-10">
        <motion.div
          layout
          transition={{ duration: reduceMotion ? 0.16 : 0.32, ease: "easeOut" }}
          className="group/holder-reward bg-background relative isolate overflow-hidden rounded-[16px] border-[0.5px] border-[#242424] shadow-[0_4px_23.4px_rgba(0,0,0,0.25)]"
        >
          <div
            className={cn(
              "relative overflow-hidden px-3 pt-3",
              hasHoldingState ? "border-b border-[#242424] pb-4" : "pb-3"
            )}
          >
            <motion.div
              key="holder-rewards-top-glow"
              aria-hidden
              initial={{ opacity: 0.92 }}
              animate={
                reduceMotion
                  ? { opacity: 1, backgroundSize: "118% 118%", backgroundPosition: "50% 50%" }
                  : {
                      opacity: [0.8, 1, 0.8],
                      backgroundSize: ["112% 112%", "128% 128%", "112% 112%"],
                      backgroundPosition: ["50% 48%", "52% 52%", "50% 48%"],
                    }
              }
              transition={{ duration: reduceMotion ? 0.16 : 9, ease: "easeInOut", repeat: reduceMotion ? 0 : Infinity }}
              className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[72%] blur-xl"
              style={{
                backgroundImage: INWARD_EDGE_REWARD_GLOW,
                backgroundSize: "118% 118%",
                backgroundPosition: "50% 50%",
                ...(hasHoldingState
                  ? {
                      WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 58%, transparent 100%)",
                      maskImage: "linear-gradient(to bottom, black 0%, black 58%, transparent 100%)",
                    }
                  : {}),
              }}
            />

            <div className="relative z-10 flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1">
                <span className="text-[13px] leading-[1.04] font-medium text-[#949494]">Total Holder Rewards</span>
                {isLoading ? (
                  <Skeleton className="h-7 w-24 rounded bg-[#242424]" />
                ) : (
                  <span className="truncate text-[28px] leading-none font-bold text-white">
                    {formatUsd(holderRewardPoolUsd)}
                  </span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1 rounded-[6px] border border-[#242424] px-[5px] py-1 text-[12px] leading-none font-bold text-[#b3b3b3]">
                <Clock size={10} />
                {countdown} Airdrop
              </div>
            </div>
          </div>

          {hasHoldingState ? (
            <motion.div
              key="holder-rewards-expanded-details"
              initial={reduceMotion ? false : { height: 0, opacity: 0, y: -8 }}
              animate={{ height: "auto", opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0.16 : 0.28, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-2 px-3 pt-3 pb-4">
                <div className="flex w-full min-w-0 items-center justify-between gap-2">
                  <span className={MY_REWARDS_TITLE_TAG}>My Rewards</span>
                  <button
                    type="button"
                    onClick={() => setHistoryOpen(true)}
                    disabled={!address}
                    className={cn(
                      "shrink-0 text-[12px] leading-none font-medium transition-colors",
                      address ? "text-[#797979] hover:text-[#D9D9D9]" : "cursor-not-allowed text-[#797979]/50"
                    )}
                  >
                    {"Show history ->"}
                  </button>
                </div>

                <div className="flex w-full min-w-0 gap-2">
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5 border-r-[0.5px] border-[#242424] pr-2">
                    <span className="text-[13px] leading-[1.04] font-semibold text-[#494949]">Holdings</span>
                    {isLoading ? (
                      <Skeleton className="h-5 w-20 rounded bg-[#242424]" />
                    ) : (
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="truncate text-[16px] leading-[1.1] font-bold text-[#D9D9D9]">
                          {displayHoldingsTokens != null ? formatNumberWithSuffix(displayHoldingsTokens, 2) : "--"}
                        </span>
                        <span className={cn("truncate text-[12px] leading-normal font-bold", SUBTEXT_MUTED)}>
                          {formatUsdSimplified(displayHoldingsUsd)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-1.5 border-r-[0.5px] border-[#242424] px-2">
                    <div className="flex min-w-0 items-center justify-between gap-1">
                      <span className="min-w-0 shrink truncate text-[13px] leading-[1.04] font-semibold text-[#494949]">
                        Earned
                      </span>
                      <div className="flex shrink-0 items-center gap-0.5">
                        {(["all", "7d"] as const).map((range) => {
                          const isActive = earnedRange === range
                          return (
                            <button
                              key={range}
                              type="button"
                              onClick={() => setEarnedRange(range)}
                              className={cn(
                                "border-0 bg-transparent p-0 text-[11px] leading-none font-bold uppercase transition-colors select-none focus-visible:rounded focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#494949]",
                                isActive ? "text-[#D9D9D9]" : "text-[#494949] hover:text-[#797979]"
                              )}
                              aria-pressed={isActive}
                            >
                              {range === "all" ? "All" : "7d"}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    {isLoading ? (
                      <Skeleton className="h-5 w-16 rounded bg-[#242424]" />
                    ) : (
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="truncate text-[16px] leading-[1.1] font-bold text-[#D9D9D9]">
                          {formatUsd(displayEarnedUsd)}
                        </span>
                        <p className={cn("text-[12px] leading-normal font-bold", SUBTEXT_MUTED)}>
                          {earnedRange === "all" && sevenDaySharePct != null && sevenDaySharePct > 0 ? (
                            <>
                              <span className="text-[#afff2e]">+{sevenDaySharePct}% </span>
                              7d
                            </>
                          ) : earnedRange === "all" ? (
                            "All"
                          ) : sevenDaySharePct != null && sevenDaySharePct > 0 ? (
                            `${sevenDaySharePct}% of all`
                          ) : (
                            "7d"
                          )}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-1.5 pl-2">
                    <span className="text-[13px] leading-[1.04] font-semibold text-[#494949]">Pending</span>
                    {isLoading ? (
                      <Skeleton className="h-5 w-14 rounded bg-[#242424]" />
                    ) : (
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="truncate text-[16px] leading-[1.1] font-bold text-[#D9D9D9]">
                          {formatUsd(displayNextPayoutUsd)}
                        </span>
                        <div
                          className={cn("flex items-center gap-1 text-[12px] leading-normal font-bold", SUBTEXT_MUTED)}
                        >
                          <Clock size={9} />
                          {countdown}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </motion.div>

        <HolderPayoutHistoryModal
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          totalPayoutUsd={
            holderClaimsData?.totalPayoutUsd ??
            (allEarnedUsd != null && Number.isFinite(allEarnedUsd) ? allEarnedUsd : 0)
          }
          payouts={holderClaimsData?.payouts ?? []}
        />
      </div>

      {showDebugButton ? (
        <button
          type="button"
          onClick={() => {
            setDebugHoldingState((state) =>
              state === "auto" ? "with-holdings" : state === "with-holdings" ? "without-holdings" : "auto"
            )
          }}
          className="mt-1 w-full rounded-[8px] border border-dashed border-[#313131] px-2 py-1 text-[11px] font-semibold text-[#797979] transition-colors hover:border-[#494949] hover:text-[#D9D9D9]"
          title="Cycle holder rewards display state"
        >
          {debugLabel}
        </button>
      ) : null}
    </div>
  )
}
