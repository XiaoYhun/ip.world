"use client"

import { type ReactNode, useEffect, useMemo, useRef, useState, type PointerEvent } from "react"
import Image from "next/image"
import { formatUnits } from "viem"
import { Clock, Eye, Lock, MoneyBag } from "@/components/icons"
import { useAccount } from "@/hooks/use-account"
import { ArrowRight, Trophy } from "lucide-react"
import { useGetRewards } from "@/hooks/use-get-rewards"
import { useIpOwnerActions } from "@/hooks/use-ip-owner-actions"
import { useIpPrice, useTokenMetricsByAddressContext } from "@/context/token-metrics-context"
import { Ip } from "@/types/ip"
import { Holding } from "@/types/holding"
import { useIsIpOwner } from "@/hooks/use-is-ip-owner"
import { Remix } from "@/types/remix"
import IpOwnerActionsDropdown from "./ip-owner-actions-dropdown"
import { RailAnimatedIconFrame, RailAnimatedTitle } from "./rail-carousel-titles"
import UgcPayoutHistoryModal from "./ugc-payout-history-modal"
import { useUGCTokenStats } from "@/hooks/use-ugc-token-stats"
import { useUgcClaims } from "@/hooks/use-ugc-claims"
import { formatNumberWithSuffix } from "@/lib/number"
import { formatPayoutCountdownDisplay } from "@/lib/ugc-display"
import { cn } from "@/lib/utils"
import { resolveRewardPoolUsd } from "@/lib/utils/reward-pool"
import CountUp from "@/components/ui/count-up"
import { Skeleton } from "@/components/ui/skeleton"
import type { SwapRow } from "@/hooks/use-token-swaps"

/**
 * UGC viewer card states (Figma node 6119:11516).
 * - `active`: token bonded & viewer logged in — full chart + payout + stats
 * - `before_bonding`: token not yet bonded — locked payout + bonding progress
 * - `no_account`: viewer logged out / no account — chart + Create Account CTA
 */
export type UgcCardState = "active" | "before_bonding" | "no_account"

/** Same resolution as inside `OwnerEarning` — use for rail chrome (e.g. hide extra carousel slides). */
export function resolveUgcViewerCardState(input: {
  isLoggedIn: boolean
  isGraduated?: boolean
  remixIsGraduated?: boolean
  graduationProgress?: number
  forceUgcState?: UgcCardState | null
}): UgcCardState {
  const liveProgress = input.graduationProgress ?? 0
  const liveBonded = input.isGraduated ?? input.remixIsGraduated ?? liveProgress >= 100
  const auto: UgcCardState = !input.isLoggedIn ? "no_account" : !liveBonded ? "before_bonding" : "active"
  return input.forceUgcState ?? auto
}

interface OwnerEarningProps {
  remixId: string
  tokenAddress: string
  remix: Remix
  isGraduated?: boolean
  graduationProgress?: number
  ip?: Ip | null
  onEndorsementChange?: (newEndorsement: "none" | "official" | "liked" | "flagged") => void
  swaps?: SwapRow[]
  livePriceUsd?: number
  /** Optional nav slot when header is rendered outside (e.g. standalone card). Ignored when `railCarouselBodyOnly`. */
  headerCarouselNav?: ReactNode
  /** When true, UGC / IP owner panels render without outer card chrome (carousel provides the shell). */
  railCarouselEmbedded?: boolean
  /** When true, omit the title/nav header row (carousel renders a fixed header above the swipe track). */
  railCarouselBodyOnly?: boolean
  /** When embedded in the solo bonding rail, omit `h-full` so the shell sizes to content. */
  railCarouselNaturalHeight?: boolean
  /** Debug override — force a specific UGC card state regardless of live conditions. */
  forceUgcState?: UgcCardState
}

function formatUsd(value: number | undefined | null): string {
  if (value == null) return "--"
  return `$${formatNumberWithSuffix(value)}`
}

function formatWholeUsd(value: number | undefined | null): string {
  if (value == null) return "--"
  return `$${Math.round(value).toLocaleString("en-US")}`
}

function formatWindowRange(startAt?: string | null, endAt?: string | null): string {
  if (!startAt || !endAt) return "--"
  const start = new Date(startAt)
  const end = new Date(endAt)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "--"

  const startLabel = start.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  const endLabel = end.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  return `${startLabel} - ${endLabel}`
}

function formatTokenAmount(value: number | undefined | null, symbol: string): string {
  if (value == null) return `-- $${symbol}`
  return `${formatNumberWithSuffix(value, 2)} $${symbol}`
}

function formatPayoutAmountBreakdown(
  ipValue: number | undefined | null,
  tokenValue: number | undefined | null,
  symbol: string
): string {
  const parts: string[] = []
  if (ipValue != null && Number.isFinite(ipValue) && ipValue > 0) {
    parts.push(`${formatNumberWithSuffix(ipValue, 2)} $IP`)
  }
  if (tokenValue != null && Number.isFinite(tokenValue) && tokenValue > 0) {
    parts.push(formatTokenAmount(tokenValue, symbol))
  }
  return parts.length > 0 ? parts.join(" + ") : `-- $${symbol}`
}

const UGC_COLOR = {
  poolBarDefault: "#552d8f",
  poolBarActive: "#a572ed",
  periodDelta: "#afff2e",
} as const

/** One bar in the UGC pool-by-period chart. */
export type UgcPoolPeriodPillar = {
  /** Preformatted range for display, e.g. "Mar 1 - Mar 7". */
  rangeLabel: string
  amountUsd: number
}

/**
 * Mock historical periods (one pillar each) — TODO: replace with API `period` series.
 * Heights scale to `amountUsd`; last item reads as most recent window.
 */
export const MOCK_UGC_POOL_BY_PERIOD: UgcPoolPeriodPillar[] = [
  { rangeLabel: "Jan 6 - Jan 12", amountUsd: 2_200 },
  { rangeLabel: "Jan 13 - Jan 19", amountUsd: 3_450 },
  { rangeLabel: "Jan 20 - Jan 26", amountUsd: 2_800 },
  { rangeLabel: "Jan 27 - Feb 2", amountUsd: 4_100 },
  { rangeLabel: "Feb 3 - Feb 9", amountUsd: 3_350 },
  { rangeLabel: "Feb 10 - Feb 16", amountUsd: 5_600 },
]

function poolPillarHeightRatios(periods: readonly UgcPoolPeriodPillar[]): number[] {
  const maxUsd = Math.max(1, ...periods.map((p) => p.amountUsd))
  return periods.map((p) => p.amountUsd / maxUsd)
}

function barIndexFromChartX(clientX: number, rect: DOMRectReadOnly, barCount: number): number {
  const x = clientX - rect.left
  const w = rect.width
  if (w <= 0) return 0
  return Math.min(barCount - 1, Math.max(0, Math.floor((x / w) * barCount)))
}

export function UgcRewardsRailHeader({
  headerCarouselNav,
  /** Title + icon only — carousel renders nav (arrows/dots) fixed beside this block. */
  titleBlockOnly,
}: {
  headerCarouselNav?: ReactNode
  titleBlockOnly?: boolean
}) {
  const suppress = Boolean(titleBlockOnly)
  const titleRow = (
    <div className="flex min-w-0 items-center gap-2">
      <RailAnimatedIconFrame suppressEnterAnimation={suppress}>
        <MoneyBag size={10} />
      </RailAnimatedIconFrame>
      <RailAnimatedTitle
        suppressEnterAnimation={suppress}
        className="truncate text-[14px] leading-[1.04] font-bold text-[#D9D9D9]"
      >
        UGC Rewards
      </RailAnimatedTitle>
    </div>
  )
  if (titleBlockOnly) return titleRow
  return (
    <div className="flex items-center justify-between gap-2">
      {titleRow}
      <div className="flex shrink-0 items-center">{headerCarouselNav}</div>
    </div>
  )
}

export function IpOwnerRewardsRailHeader({
  remix,
  onEndorsementChange,
  headerCarouselNav,
}: {
  remix: Remix
  onEndorsementChange?: (v: "none" | "official" | "liked" | "flagged") => void
  headerCarouselNav?: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <RailAnimatedTitle
        as="span"
        className="text-xxs min-w-0 truncate font-medium tracking-wide text-[#797979] uppercase"
      >
        IP Owner Earnings
      </RailAnimatedTitle>
      <div className="flex shrink-0 items-center gap-1">
        {headerCarouselNav}
        <IpOwnerActionsDropdown remix={remix} onEndorsementChange={onEndorsementChange} triggerVariant="icon" />
      </div>
    </div>
  )
}

// ── State 3: Logged in, token bonded/graduated (Active) ──────────────────────
function EarnedState({
  estimatedPayout,
  rank,
  allTimeEarned,
  impressions,
  posts,
  countdown,
  isLoading,
  totalPoolUsd,
  currentPeriodPoolUsd,
  estimatedPayoutIpAmount,
  estimatedPayoutTokenAmount,
  tokenSymbol,
  windowStartAt,
  windowEndAt,
  lastPayoutUsd,
  lastPayoutLabel,
  isPayoutLate = false,
  onViewHistory,
  headerCarouselNav,
  railCarouselEmbedded,
  railCarouselBodyOnly,
}: {
  estimatedPayout?: number
  rank?: number
  allTimeEarned?: number
  impressions?: number
  posts?: number
  countdown: string
  isLoading: boolean
  totalPoolUsd?: number
  currentPeriodPoolUsd?: number
  estimatedPayoutIpAmount?: number
  estimatedPayoutTokenAmount?: number
  tokenSymbol: string
  windowStartAt?: string | null
  windowEndAt?: string | null
  lastPayoutUsd?: number
  lastPayoutLabel?: string
  isPayoutLate?: boolean
  onViewHistory?: () => void
  headerCarouselNav?: ReactNode
  railCarouselEmbedded?: boolean
  railCarouselBodyOnly?: boolean
}) {
  const payoutCountdown = formatPayoutCountdownDisplay(countdown, isPayoutLate)

  return (
    <UgcStateFrame
      headerCarouselNav={headerCarouselNav}
      railCarouselEmbedded={railCarouselEmbedded}
      railCarouselBodyOnly={railCarouselBodyOnly}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3">
          <UgcTotalPoolChartBlock
            totalPoolUsd={totalPoolUsd}
            currentPeriodPoolUsd={currentPeriodPoolUsd}
            windowStartAt={windowStartAt}
            windowEndAt={windowEndAt}
            isLoading={isLoading}
            heightPx={97}
          />
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={onViewHistory}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault()
              onViewHistory?.()
            }
          }}
          className="flex cursor-pointer flex-col gap-3 rounded-[12px] bg-[#171717] p-3 text-left transition-opacity hover:opacity-95"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-[12px] leading-[1.04] font-medium text-[#494949]">My Next Payout</span>
              {isLoading ? (
                <Skeleton className="h-9 w-28" />
              ) : (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[32px] leading-none font-bold text-[#D9D9D9]">
                    {formatWholeUsd(estimatedPayout)}
                  </span>
                  <span className="text-[12px] leading-normal font-bold text-[#797979]">
                    {formatPayoutAmountBreakdown(estimatedPayoutIpAmount, estimatedPayoutTokenAmount, tokenSymbol)}
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="text-[12px] leading-[1.04] font-medium text-[#494949]">{payoutCountdown.label}</span>
              <div className="flex items-center gap-1 text-[#797979]">
                <Clock size={12} />
                <span className="text-[16px] leading-none font-bold">{payoutCountdown.value}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex h-6 items-center gap-1 rounded-full border-[0.5px] border-[#313131] bg-[#121212] px-2">
              <Trophy size={12} className="text-[#D9D9D9]" />
              <span className="text-[12px] leading-[1.04] font-semibold text-[#D9D9D9]">
                {rank != null ? `#${rank}` : "#--"}
              </span>
            </div>
            <div className="inline-flex h-6 items-center gap-1 rounded-full border-[0.5px] border-[#313131] bg-[#121212] px-2">
              <Eye size={10} />
              <span className="text-[12px] leading-[1.04] font-medium text-[#D9D9D9]">
                {impressions != null ? formatNumberWithSuffix(impressions) : "--"} Impressions
              </span>
            </div>
            <div className="inline-flex h-6 items-center gap-1 rounded-full border-[0.5px] border-[#313131] bg-[#121212] px-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden
              >
                <path
                  d="M6 0.5C4.9122 0.5 3.84884 0.822567 2.94437 1.42692C2.0399 2.03126 1.33495 2.89025 0.918665 3.89524C0.502383 4.90023 0.393465 6.0061 0.605683 7.073C0.817902 8.1399 1.34173 9.11991 2.11091 9.88909C2.8801 10.6583 3.86011 11.1821 4.92701 11.3943C5.9939 11.6065 7.09977 11.4976 8.10476 11.0813C9.10975 10.6651 9.96874 9.96011 10.5731 9.05564C11.1774 8.15117 11.5 7.0878 11.5 6C11.4984 4.5418 10.9184 3.1438 9.8872 2.1128C8.8562 1.0816 7.4582 0.5016 6 0.5ZM4.35 8.75V3.8L9.3 6.275L4.35 8.75Z"
                  fill="#D9D9D9"
                />
              </svg>
              <span className="text-[12px] leading-[1.04] font-medium text-[#D9D9D9]">
                {posts != null ? posts : "--"} Posts
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex min-w-0 flex-col gap-2 rounded-[12px] border-[0.5px] border-[#242424] bg-[#191919] p-2 shadow-[0_4px_11.7px_rgba(0,0,0,0.25)]">
              <span className="text-[13px] leading-[1.04] font-semibold text-[#494949]">Last Payout</span>
              <div className="flex min-w-0 flex-col gap-1">
                <span className="truncate text-[18px] leading-none font-bold text-[#D9D9D9]">
                  {formatUsd(lastPayoutUsd)}
                </span>
                <span className="truncate text-[12px] leading-[1.04] font-semibold text-[#494949]">
                  {lastPayoutLabel ?? "--"}
                </span>
              </div>
            </div>
            <div className="flex min-w-0 flex-col gap-2 rounded-[12px] border-[0.5px] border-[#242424] bg-[#191919] p-2 shadow-[0_4px_11.7px_rgba(0,0,0,0.25)]">
              <span className="text-[13px] leading-[1.04] font-semibold text-[#494949]">All-Time</span>
              <div className="flex min-w-0 flex-col gap-1">
                <span className="truncate text-[18px] leading-none font-bold text-[#D9D9D9]">
                  {formatUsd(allTimeEarned)}
                </span>
                <div className="flex items-center gap-1 text-[12px] leading-[1.04] font-semibold text-[#494949]">
                  <span>View History</span>
                  <ArrowRight size={8} className="shrink-0" strokeWidth={2.5} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UgcStateFrame>
  )
}

// ── Shared shell for the 3 UGC viewer states ─────────────────────────────────
function UgcStateFrame({
  children,
  headerCarouselNav,
  railCarouselEmbedded,
  railCarouselBodyOnly,
}: {
  children: ReactNode
  headerCarouselNav?: ReactNode
  railCarouselEmbedded?: boolean
  railCarouselBodyOnly?: boolean
}) {
  return (
    <div
      className={cn(
        "font-sf-pro-rounded flex w-full flex-col",
        railCarouselBodyOnly ? "gap-4" : "gap-6",
        railCarouselEmbedded
          ? "h-full min-h-0 min-w-0 justify-start"
          : "justify-center rounded-[16px] border-[0.5px] border-[#242424] bg-[#121212] p-3 shadow-[0_4px_11.7px_rgba(0,0,0,0.25)]"
      )}
      style={{ fontVariantNumeric: "lining-nums tabular-nums" }}
    >
      {!railCarouselBodyOnly ? (
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <RailAnimatedIconFrame>
              <MoneyBag size={10} />
            </RailAnimatedIconFrame>
            <RailAnimatedTitle className="truncate text-[14px] leading-[1.04] font-bold text-[#D9D9D9]">
              UGC Rewards
            </RailAnimatedTitle>
          </div>
          <div className="flex shrink-0 items-center">{headerCarouselNav}</div>
        </div>
      ) : null}

      {children}
    </div>
  )
}

/** Shared "Total UGC Pool" headline — date range from payout window; total animates on chart hover when enabled. */
function TotalUgcPoolHeadline({
  totalPoolUsd,
  currentPeriodPoolUsd,
  windowStartAt,
  windowEndAt,
  isLoading,
  chartHovered,
  countUpKey,
  hoveredPillar,
}: {
  totalPoolUsd?: number
  currentPeriodPoolUsd?: number
  windowStartAt?: string | null
  windowEndAt?: string | null
  isLoading: boolean
  /** When `true`, main total uses `CountUp` (parent ties this to chart hover). */
  chartHovered?: boolean
  countUpKey?: number
  /** When set (pointer on a bar), green line shows this period amount + range. */
  hoveredPillar?: UgcPoolPeriodPillar | null
}) {
  const windowRange = formatWindowRange(windowStartAt, windowEndAt)
  const periodDeltaUsd = hoveredPillar?.amountUsd ?? currentPeriodPoolUsd
  const periodRangeLabel = hoveredPillar?.rangeLabel ?? windowRange
  const showAnimatedTotal = chartHovered === true && totalPoolUsd != null && !isLoading
  const roundedTotal = totalPoolUsd != null ? Math.round(totalPoolUsd) : 0

  return (
    <div className="flex flex-col items-start gap-1">
      <span className="text-[12px] leading-[1.04] font-medium text-[#494949]">Total UGC Pool</span>
      {isLoading ? (
        <Skeleton className="h-8 w-28" />
      ) : (
        <div className="flex flex-col gap-0.5">
          <span className="text-[28px] leading-none font-bold text-white tabular-nums">
            {showAnimatedTotal ? (
              <>
                $
                <CountUp
                  key={countUpKey ?? 0}
                  from={0}
                  to={roundedTotal}
                  separator=","
                  direction="up"
                  duration={0.8}
                  delay={0}
                  startWhen={true}
                />
              </>
            ) : (
              formatWholeUsd(totalPoolUsd)
            )}
          </span>
          <span className="text-[12px] leading-normal font-bold">
            <span style={{ color: UGC_COLOR.periodDelta }}>+{formatWholeUsd(periodDeltaUsd)}</span>
            <span className="ml-1 font-normal text-[#494949]">{periodRangeLabel}</span>
          </span>
        </div>
      )}
    </div>
  )
}

/** Headline + (optional) bar chart — chart/footer commented out until API-backed period series exists. */
function UgcTotalPoolChartBlock({
  totalPoolUsd,
  currentPeriodPoolUsd,
  windowStartAt,
  windowEndAt,
  isLoading,
  heightPx: _heightPx = 97,
  pillars: _pillars = MOCK_UGC_POOL_BY_PERIOD,
}: {
  totalPoolUsd?: number
  currentPeriodPoolUsd?: number
  windowStartAt?: string | null
  windowEndAt?: string | null
  isLoading: boolean
  heightPx?: number
  pillars?: readonly UgcPoolPeriodPillar[]
}) {
  return (
    <>
      <TotalUgcPoolHeadline
        totalPoolUsd={totalPoolUsd}
        currentPeriodPoolUsd={currentPeriodPoolUsd}
        windowStartAt={windowStartAt}
        windowEndAt={windowEndAt}
        isLoading={isLoading}
        chartHovered={false}
        countUpKey={0}
        hoveredPillar={null}
      />
      {/* UGC pool-by-period bar chart was mock data; hide until API-backed series exists.
      <UgcPoolBarChart
        pillars={pillars}
        heightPx={heightPx}
        hoveredPillarIndex={hoveredPillarIndex}
        onHoveredPillarIndexChange={setHoveredPillarIndex}
        onHoverStart={() => {
          setCountUpKey((k) => k + 1)
          setChartHovered(true)
        }}
        onHoverEnd={() => {
          setChartHovered(false)
          setHoveredPillarIndex(null)
        }}
      />
      <div className="flex items-center justify-between border-b-[0.5px] border-[#242424] pb-2 text-[12px] leading-[1.04] font-normal text-[#494949]">
        <span>UGC pool by period</span>
        <span>{footerRangeLabel}</span>
      </div>
      */}
    </>
  )
}

// ── State 1: Logged out / no account (Figma node 6119:11228) ─────────────────
function NoAccountState({
  totalPoolUsd,
  currentPeriodPoolUsd,
  windowStartAt,
  windowEndAt,
  isLoading,
  tokenImage,
  onCreateAccount,
  headerCarouselNav,
  railCarouselEmbedded,
  railCarouselBodyOnly,
}: {
  totalPoolUsd?: number
  currentPeriodPoolUsd?: number
  windowStartAt?: string | null
  windowEndAt?: string | null
  isLoading: boolean
  tokenImage?: string
  onCreateAccount?: () => void
  headerCarouselNav?: ReactNode
  railCarouselEmbedded?: boolean
  railCarouselBodyOnly?: boolean
}) {
  return (
    <UgcStateFrame
      headerCarouselNav={headerCarouselNav}
      railCarouselEmbedded={railCarouselEmbedded}
      railCarouselBodyOnly={railCarouselBodyOnly}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex flex-col gap-3">
          <UgcTotalPoolChartBlock
            totalPoolUsd={totalPoolUsd}
            currentPeriodPoolUsd={currentPeriodPoolUsd}
            windowStartAt={windowStartAt}
            windowEndAt={windowEndAt}
            isLoading={isLoading}
            heightPx={75}
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col items-center justify-between gap-2 rounded-[12px] bg-[#171717] px-3 py-3">
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <CreatorCardStack tokenImage={tokenImage} />
          </div>
          <div className="flex w-full flex-col items-center gap-1 text-center">
            <p className="text-[15px] leading-[1.04] font-bold text-white">Create Content & Earn</p>
            <p className="px-2 text-[12px] leading-[1.3] font-normal text-[#B3B3B3]">
              To start earning points, you need to register for an account.
            </p>
          </div>
          <button
            type="button"
            onClick={onCreateAccount}
            className="relative w-full shrink-0 cursor-pointer rounded-[8px] bg-[#dfcdf9] py-2 text-[14px] font-bold text-[#321f4d] transition-opacity hover:opacity-90"
            style={{ boxShadow: "inset 0px 0px 10px 0px rgba(255,255,255,0.25)" }}
          >
            Create Account
          </button>
        </div>
      </div>
    </UgcStateFrame>
  )
}

/**
 * Stack of three rotated thumbnails representing earnable UGC slots (Figma 6119:11329).
 * Uses the token image as a stand-in for the user's would-be content.
 */
function CreatorCardStack({ tokenImage }: { tokenImage?: string }) {
  const cards: Array<{ rotate: number; left: number; top: number; w: number; h: number; z: number; shadow?: boolean }> =
    [
      { rotate: -5.29, left: 0, top: 8, w: 60, h: 86, z: 1 },
      { rotate: 16.44, left: 100, top: 4, w: 60, h: 86, z: 2 },
      { rotate: 1.72, left: 50, top: 0, w: 66, h: 95, z: 3, shadow: true },
    ]
  return (
    <div className="relative h-[100px] w-[170px]">
      {cards.map((c, i) => (
        <div
          key={i}
          className={cn(
            "absolute overflow-hidden rounded-[6px] border-[0.5px] border-[#313131] bg-[#1A1A1A]",
            c.shadow && "shadow-[0_4px_25.9px_0_rgba(0,0,0,0.69)]"
          )}
          style={{
            left: c.left,
            top: c.top,
            width: c.w,
            height: c.h,
            zIndex: c.z,
            transform: `rotate(${c.rotate}deg)`,
          }}
        >
          {tokenImage ? (
            <Image src={tokenImage} alt="" fill sizes="80px" className="object-cover" unoptimized />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#552d8f] to-[#321f4d]" />
          )}
        </div>
      ))}
    </div>
  )
}

// ── State 2: Token not yet bonded (Figma node 6119:11394) ────────────────────
function BeforeBondingState({
  totalPoolUsd,
  currentPeriodPoolUsd,
  windowStartAt,
  windowEndAt,
  estimatedPayout,
  estimatedPayoutIpAmount,
  estimatedPayoutTokenAmount,
  tokenSymbol,
  graduationProgress,
  isLoading,
  headerCarouselNav,
  railCarouselEmbedded,
  railCarouselBodyOnly,
}: {
  totalPoolUsd?: number
  currentPeriodPoolUsd?: number
  windowStartAt?: string | null
  windowEndAt?: string | null
  estimatedPayout?: number
  estimatedPayoutIpAmount?: number
  estimatedPayoutTokenAmount?: number
  tokenSymbol: string
  graduationProgress: number
  isLoading: boolean
  headerCarouselNav?: ReactNode
  railCarouselEmbedded?: boolean
  railCarouselBodyOnly?: boolean
}) {
  const clampedProgress = Math.min(100, Math.max(0, graduationProgress))

  return (
    <UgcStateFrame
      headerCarouselNav={headerCarouselNav}
      railCarouselEmbedded={railCarouselEmbedded}
      railCarouselBodyOnly={railCarouselBodyOnly}
    >
      <div className="flex flex-col gap-4">
        <TotalUgcPoolHeadline
          totalPoolUsd={totalPoolUsd}
          currentPeriodPoolUsd={currentPeriodPoolUsd}
          windowStartAt={windowStartAt}
          windowEndAt={windowEndAt}
          isLoading={isLoading}
        />

        <div className="flex flex-col gap-4 rounded-[12px] bg-[#171717] p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-[12px] leading-[1.04] font-medium text-[#494949]">My Next Payout</span>
              {isLoading ? (
                <Skeleton className="h-9 w-28" />
              ) : (
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#494949]">
                      <Lock size={20} />
                    </span>
                    <span className="text-[28px] leading-none font-bold text-[#494949]">
                      {formatWholeUsd(estimatedPayout)}
                    </span>
                  </div>
                  <span className="text-[12px] leading-normal font-bold text-[#313131]">
                    {formatPayoutAmountBreakdown(estimatedPayoutIpAmount, estimatedPayoutTokenAmount, tokenSymbol)}
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="text-[12px] leading-[1.04] font-medium text-[#494949]">Payout in</span>
              <div className="flex items-center gap-1 text-[#797979]">
                <Clock size={12} />
                <span className="text-[16px] leading-none font-bold">--</span>
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-[#242424]" />

          <div className="flex flex-col gap-2.5">
            <div className="relative h-6 w-full overflow-hidden rounded-full bg-[#242424]">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#8000ff] to-[#9d57ff] shadow-[4px_0_12px_0_rgba(0,0,0,0.1)] transition-[width] duration-500"
                style={{ width: `${clampedProgress}%` }}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between text-[16px] leading-tight font-semibold text-white">
                <span>Bonding Progress</span>
                <span className="font-bold">{clampedProgress.toFixed(0)}%</span>
              </div>
              <p className="text-[12px] leading-[1.6] font-normal text-[#797979]">
                Upon reaching 100%, you will be able to earn UGC payouts
              </p>
            </div>
          </div>
        </div>
      </div>
    </UgcStateFrame>
  )
}

/** Shared bar chart used by Active + NoAccount states (Figma 6119:11144). */
function UgcPoolBarChart({
  pillars,
  heightPx = 97,
  hoveredPillarIndex,
  onHoveredPillarIndexChange,
  onHoverStart,
  onHoverEnd,
}: {
  pillars: readonly UgcPoolPeriodPillar[]
  heightPx?: number
  hoveredPillarIndex: number | null
  onHoveredPillarIndexChange: (index: number | null) => void
  onHoverStart?: () => void
  onHoverEnd?: () => void
}) {
  const poolChartRef = useRef<HTMLDivElement>(null)
  const heightRatios = useMemo(() => poolPillarHeightRatios(pillars), [pillars])
  const barCount = pillars.length

  function updateBarFromEvent(e: PointerEvent<HTMLDivElement>) {
    const el = poolChartRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const idx = barIndexFromChartX(e.clientX, rect, barCount)
    onHoveredPillarIndexChange(idx)
  }

  return (
    <div
      ref={poolChartRef}
      className="relative w-full cursor-crosshair touch-none"
      style={{ height: heightPx }}
      onPointerMove={updateBarFromEvent}
      onPointerEnter={(e) => {
        updateBarFromEvent(e)
        onHoverStart?.()
      }}
      onPointerLeave={() => {
        onHoveredPillarIndexChange(null)
        onHoverEnd?.()
      }}
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-full items-end justify-between gap-[7px]">
        {heightRatios.map((heightRatio, index) => {
          const isHighlighted = hoveredPillarIndex === index
          return (
            <div
              key={`${pillars[index].rangeLabel}-${index}`}
              className="flex-1 rounded-[8px]"
              style={{
                height: `${heightRatio * heightPx}px`,
                backgroundColor: isHighlighted ? UGC_COLOR.poolBarActive : UGC_COLOR.poolBarDefault,
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

// ── State 4: Current user is the IP owner ────────────────────────────────────
function CreatorEarningsState({
  rewardsUsd,
  rewardsIp,
  tokenAddress,
  remix,
  onEndorsementChange,
  headerCarouselNav,
  railCarouselEmbedded,
  railCarouselBodyOnly,
}: {
  rewardsUsd: number
  rewardsIp: number
  tokenAddress: string
  remix: Remix
  onEndorsementChange?: (newEndorsement: "none" | "official" | "liked" | "flagged") => void
  headerCarouselNav?: ReactNode
  railCarouselEmbedded?: boolean
  railCarouselBodyOnly?: boolean
}) {
  const { metrics } = useTokenMetricsByAddressContext()
  const ipPrice = useIpPrice()
  const tokenPriceUsd = parseFloat(metrics?.price_usd ?? "0") || 0

  const holding = useMemo<Holding>(
    () => ({
      token_address: tokenAddress,
      token_image: "",
      token_name: "",
      token_ticker: "",
      decimals: 18,
      amount: "0",
      value: 0,
      market_cap: 0,
      volume: 0,
      liquidity: 0,
      market_cap_change: 0,
      volume_change: 0,
      liquidity_change: 0,
      ip: { alias: "", type: "", title: "" },
      favorited_remix: false,
    }),
    [tokenAddress]
  )

  const { handleClaim, isLoading, latestClaimableAmount, owdAmount, tokenDecimals } = useIpOwnerActions({ holding })

  const decimals = typeof tokenDecimals === "number" ? tokenDecimals : 18

  // Vested ERC20 tokens → USD
  const claimableTokens =
    latestClaimableAmount != null ? parseFloat(formatUnits(latestClaimableAmount as bigint, decimals)) : 0
  const claimableTokensUsd = claimableTokens * tokenPriceUsd

  // Accumulated ETH/IP from harvests → USD (owdAmount is in native IP, 18 decimals)
  const owdIp = owdAmount != null ? parseFloat(formatUnits(owdAmount as bigint, 18)) : 0
  const owdUsd = owdIp * ipPrice

  const totalClaimableUsd = claimableTokensUsd + owdUsd
  const hasClaimable = totalClaimableUsd >= 0.01

  // rewardsUsd = vestingClaimedUSD + wipToIpOwnerUSD; rewardsIp = wipToIpOwnerUSD only
  const vestingClaimedUsd = Math.max(rewardsUsd - rewardsIp, 0)
  const tokenEarnedAmount = tokenPriceUsd > 0 ? vestingClaimedUsd / tokenPriceUsd : 0
  const ipEarnedAmount = ipPrice > 0 ? rewardsIp / ipPrice : 0

  function fmtUsd(n: number) {
    if (n >= 1_000_000) return { whole: `$${(n / 1_000_000).toFixed(2)}M`, decimal: "" }
    if (n >= 1_000) {
      const s = Math.floor(n).toLocaleString("en-US")
      return { whole: `$${s}`, decimal: ".00" }
    }
    const [int, dec] = n.toFixed(2).split(".")
    return { whole: `$${int}`, decimal: `.${dec}` }
  }

  const earned = fmtUsd(rewardsUsd)
  const claimable = fmtUsd(totalClaimableUsd)

  return (
    <div
      className={cn(
        railCarouselEmbedded
          ? "flex h-full min-h-0 w-full flex-col"
          : "overflow-hidden rounded-[16px] border border-[#242424] bg-[#121212]"
      )}
      style={
        railCarouselEmbedded
          ? { fontVariantNumeric: "lining-nums tabular-nums" }
          : { padding: "14px 14px 16px", fontVariantNumeric: "lining-nums tabular-nums" }
      }
    >
      {!railCarouselBodyOnly ? (
        <div className="mb-3 flex items-center justify-between gap-2">
          <RailAnimatedTitle
            as="span"
            className="text-xxs min-w-0 truncate font-medium tracking-wide text-[#797979] uppercase"
          >
            IP Owner Earnings
          </RailAnimatedTitle>
          <div className="flex shrink-0 items-center gap-1">
            {headerCarouselNav}
            <IpOwnerActionsDropdown remix={remix} onEndorsementChange={onEndorsementChange} triggerVariant="icon" />
          </div>
        </div>
      ) : null}

      <div className="rounded-[12px] border border-[#2E2E33] bg-[#161618]">
        <div className="bg-chessboard flex flex-col gap-1.5 rounded-t-[12px] px-4 py-5">
          <span className="text-[11px] font-semibold tracking-wide text-[#6F6F73] uppercase">Fees Earned</span>
          <div className="flex items-baseline gap-0.5 py-1 font-mono text-[20px] leading-tight font-semibold text-white">
            {earned.whole}
            <span className="text-[#6F6F73]">{earned.decimal}</span>
          </div>
          <span className="font-mono text-[11px] text-[#6F6F73]">
            {formatNumberWithSuffix(tokenEarnedAmount)} ${remix.symbol} &middot;{" "}
            {formatNumberWithSuffix(ipEarnedAmount)} $IP
          </span>
        </div>

        <div className="h-px w-full bg-[#2A2A2E]" />

        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold tracking-wide text-[#6F6F73] uppercase">Claimable</span>
            <div className="flex items-baseline gap-0.5 font-mono text-[20px] leading-tight font-medium text-white">
              {claimable.whole}
              <span className="text-[#6F6F73]">{claimable.decimal}</span>
            </div>
          </div>
          <button
            onClick={handleClaim}
            disabled={isLoading || !hasClaimable}
            className="flex cursor-pointer items-center justify-center gap-1.5 rounded-[10px] px-4 py-2 text-xs font-semibold text-[#321f4d] transition-opacity hover:opacity-90 disabled:!cursor-not-allowed disabled:opacity-40"
            style={{
              background: "#dfcdf9",
              boxShadow: "inset 0px 0px 10px 0px rgba(255,255,255,0.25)",
            }}
          >
            {isLoading ? "Claiming..." : "Claim"}
            {!isLoading && <ArrowRight size={12} color="#321f4d" />}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
export default function OwnerEarning({
  remixId,
  tokenAddress,
  remix,
  isGraduated,
  graduationProgress,
  ip,
  onEndorsementChange,
  swaps,
  livePriceUsd,
  headerCarouselNav,
  railCarouselEmbedded,
  railCarouselBodyOnly,
  railCarouselNaturalHeight,
  forceUgcState,
}: OwnerEarningProps) {
  const { address } = useAccount()
  const isLoggedIn = !!address

  const { data } = useGetRewards(tokenAddress)
  const { isIpOwner } = useIsIpOwner(ip)
  const { data: stats, isLoading: isUgcLoading } = useUGCTokenStats(remixId)
  const { payouts: ugcClaims, totalUsd: ugcClaimsTotal } = useUgcClaims(tokenAddress, address, remix?.symbol)
  const { metrics } = useTokenMetricsByAddressContext()
  const ipPrice = useIpPrice()
  const hasUgcClaimHistory = !!ugcClaims?.length

  const isVerified = ip?.is_verified ?? false
  const me = stats?.me

  const [countdown, setCountdown] = useState("--")
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const allTimeEarnedUsd = hasUgcClaimHistory
    ? (ugcClaimsTotal ?? undefined)
    : (me?.historical_paid_out_usd ?? (stats ? 0 : undefined))
  const tokenPriceUsd = parseFloat(metrics?.price_usd ?? "0") || livePriceUsd || 0
  const currentPeriodPoolUsd =
    stats && (ipPrice || tokenPriceUsd)
      ? stats.current_pool_amount_ip * ipPrice + stats.current_pool_amount_token * tokenPriceUsd
      : undefined
  const displayUgcPoolUsd = resolveRewardPoolUsd({
    draftedPoolUsd: stats?.pool_rewards?.amount_usd,
    computedCurrentPoolUsd: currentPeriodPoolUsd,
    fallbackTotalPoolUsd: stats?.total_pool_usd,
  })
  const displayUgcCurrentPeriodPoolUsd = resolveRewardPoolUsd({
    draftedPoolUsd: stats?.pool_rewards?.amount_usd,
    computedCurrentPoolUsd: currentPeriodPoolUsd,
    fallbackTotalPoolUsd: stats?.total_pool_usd,
  })
  const displayUgcEstimatedPayoutTokenAmount =
    me?.current_window_estimated_payout_token != null && Number.isFinite(me.current_window_estimated_payout_token)
      ? me.current_window_estimated_payout_token
      : undefined
  const displayUgcEstimatedPayoutIPAmount =
    me?.current_window_estimated_payout_ip != null && Number.isFinite(me.current_window_estimated_payout_ip)
      ? me.current_window_estimated_payout_ip
      : undefined

  // Last payout = newest claim from history (already returned newest-first by API)
  const lastPayout = ugcClaims?.[0]
  const lastPayoutUsd = lastPayout?.amountUsd
  const lastPayoutLabel = lastPayout?.rangeLabel

  // Resolved UGC viewer state. `forceUgcState` (debug) wins; otherwise auto-detect.
  const liveProgress = graduationProgress ?? remix?.graduation_progress ?? 0
  const liveBonded = isGraduated ?? remix?.is_graduated ?? liveProgress >= 100
  const autoUgcState: UgcCardState = !isLoggedIn ? "no_account" : !liveBonded ? "before_bonding" : "active"
  const ugcState: UgcCardState = forceUgcState ?? autoUgcState

  useEffect(() => {
    const dateStr = stats?.next_payout_at
    if (!dateStr) {
      setCountdown("--")
      return
    }

    function tick() {
      const diff = new Date(dateStr ?? "").getTime() - Date.now()
      if (diff <= 0) {
        setCountdown("Soon")
        return
      }
      const days = Math.floor(diff / 86_400_000)
      const hours = Math.floor((diff % 86_400_000) / 3_600_000)
      const totalHours = Math.floor(diff / 3_600_000)
      const mins = Math.max(1, Math.floor((diff % 3_600_000) / 60_000))
      setCountdown(days >= 1 ? `${days}d ${hours}h` : totalHours >= 1 ? `${totalHours}h ${mins}m` : `${mins}m`)
    }

    tick()
    const id = setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [stats?.next_payout_at])

  // IP owner card always wins when viewer is the IP owner — debug override is
  // limited to the UGC viewer (non-owner) flow.
  const showIpOwnerCard = isLoggedIn && isVerified && isIpOwner && !forceUgcState

  return (
    <>
      <div
        className={cn(
          "flex flex-col gap-4",
          railCarouselEmbedded && (railCarouselNaturalHeight ? "min-h-0 w-full" : "h-full min-h-0 w-full")
        )}
        style={{ fontVariantNumeric: "lining-nums tabular-nums" }}
      >
        {showIpOwnerCard && (
          <CreatorEarningsState
            rewardsUsd={data?.owner_rewards_usd ?? 0}
            rewardsIp={data?.owner_rewards_ip ?? 0}
            tokenAddress={tokenAddress}
            remix={remix}
            onEndorsementChange={onEndorsementChange}
            headerCarouselNav={headerCarouselNav}
            railCarouselEmbedded={railCarouselEmbedded}
            railCarouselBodyOnly={railCarouselBodyOnly}
          />
        )}
        {!showIpOwnerCard && ugcState === "active" && (
          <>
            <EarnedState
              estimatedPayout={me?.current_window_estimated_payout_usd ?? (stats ? 0 : undefined)}
              estimatedPayoutIpAmount={displayUgcEstimatedPayoutIPAmount}
              rank={me?.current_window_rank || undefined}
              allTimeEarned={allTimeEarnedUsd}
              impressions={me?.total_impressions ?? (stats ? 0 : undefined)}
              posts={me?.post_count ?? (stats ? 0 : undefined)}
              countdown={countdown}
              isLoading={isUgcLoading}
              totalPoolUsd={displayUgcPoolUsd}
              currentPeriodPoolUsd={displayUgcCurrentPeriodPoolUsd}
              estimatedPayoutTokenAmount={displayUgcEstimatedPayoutTokenAmount}
              tokenSymbol={remix.symbol}
              windowStartAt={stats?.window_start_at}
              windowEndAt={stats?.window_end_at}
              lastPayoutUsd={lastPayoutUsd}
              lastPayoutLabel={lastPayoutLabel}
              isPayoutLate={Boolean(stats?.payout_window_is_late)}
              onViewHistory={() => setIsHistoryOpen(true)}
              headerCarouselNav={headerCarouselNav}
              railCarouselEmbedded={railCarouselEmbedded}
              railCarouselBodyOnly={railCarouselBodyOnly}
            />
            <UgcPayoutHistoryModal
              open={isHistoryOpen}
              onOpenChange={setIsHistoryOpen}
              totalPayoutUsd={allTimeEarnedUsd}
              payouts={ugcClaims ?? undefined}
            />
          </>
        )}
        {!showIpOwnerCard && ugcState === "before_bonding" && (
          <BeforeBondingState
            totalPoolUsd={displayUgcPoolUsd}
            currentPeriodPoolUsd={displayUgcCurrentPeriodPoolUsd}
            windowStartAt={stats?.window_start_at}
            windowEndAt={stats?.window_end_at}
            estimatedPayout={me?.current_window_estimated_payout_usd ?? (stats ? 0 : undefined)}
            estimatedPayoutIpAmount={displayUgcEstimatedPayoutIPAmount}
            estimatedPayoutTokenAmount={displayUgcEstimatedPayoutTokenAmount}
            tokenSymbol={remix.symbol}
            graduationProgress={liveProgress}
            isLoading={isUgcLoading}
            headerCarouselNav={headerCarouselNav}
            railCarouselEmbedded={railCarouselEmbedded}
            railCarouselBodyOnly={railCarouselBodyOnly}
          />
        )}
        {!showIpOwnerCard && ugcState === "no_account" && (
          <NoAccountState
            totalPoolUsd={displayUgcPoolUsd}
            currentPeriodPoolUsd={displayUgcCurrentPeriodPoolUsd}
            windowStartAt={stats?.window_start_at}
            windowEndAt={stats?.window_end_at}
            isLoading={isUgcLoading}
            tokenImage={remix.image}
            headerCarouselNav={headerCarouselNav}
            railCarouselEmbedded={railCarouselEmbedded}
            railCarouselBodyOnly={railCarouselBodyOnly}
          />
        )}
      </div>
    </>
  )
}
