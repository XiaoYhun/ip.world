"use client"

import { type ReactNode } from "react"
import { Trophy } from "lucide-react"
import { User } from "@/components/icons"
import { useUGCLeaderboard } from "@/hooks/use-ugc-leaderboard"
import { truncateAddress, truncateUsername } from "@/lib/strings"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { formatTopEarnerPostCount, formatTopEarnerUSD } from "@/lib/ugc-display"
import { cn } from "@/lib/utils"
import { TOKEN_RAIL_CARD_HEIGHT_PX } from "../token-layout"
import { RailAnimatedIconFrame, RailAnimatedTitle } from "./rail-carousel-titles"

const cardShellStandalone =
  "font-sf-pro-rounded flex min-h-0 w-full flex-col gap-4 overflow-hidden rounded-[16px] border-[0.5px] border-[#242424] bg-[#121212] p-3 shadow-[0_4px_11.7px_rgba(0,0,0,0.25)]"

const cardShellEmbedded =
  "font-sf-pro-rounded flex h-full min-h-0 w-full flex-col gap-4 overflow-hidden"

const railCardFrameStyle = {
  fontVariantNumeric: "lining-nums tabular-nums" as const,
  height: TOKEN_RAIL_CARD_HEIGHT_PX,
  minHeight: TOKEN_RAIL_CARD_HEIGHT_PX,
  maxHeight: TOKEN_RAIL_CARD_HEIGHT_PX,
}

interface TopEarnersProps {
  tokenAddress: string
  headerCarouselNav?: ReactNode
  /** Outer card is provided by TokenRightRailCarousel. */
  railCarouselEmbedded?: boolean
  /** Title row rendered by carousel; body only. */
  railCarouselBodyOnly?: boolean
}

function TopEarnersHeader({
  headerCarouselNav,
  suppressEnterAnimation,
  titleBlockOnly,
}: {
  headerCarouselNav?: ReactNode
  suppressEnterAnimation?: boolean
  titleBlockOnly?: boolean
}) {
  const suppress = Boolean(suppressEnterAnimation || titleBlockOnly)
  const iconTitle = (
    <div className="flex min-w-0 items-center gap-2">
      <RailAnimatedIconFrame suppressEnterAnimation={suppress}>
        <Trophy size={12} className="text-[#D9D9D9]" />
      </RailAnimatedIconFrame>
      <RailAnimatedTitle
        suppressEnterAnimation={suppress}
        className="truncate text-[14px] leading-[1.04] font-bold text-[#D9D9D9]"
      >
        Top Earners
      </RailAnimatedTitle>
    </div>
  )
  const allTimePill = (
    <div className="shrink-0 rounded-full bg-[#171717] px-2 py-[6px] text-[12px] leading-[1.04] font-bold text-[#797979]">
      All time
    </div>
  )
  if (titleBlockOnly) {
    return (
      <div className="flex min-w-0 items-center gap-2">
        {iconTitle}
        {allTimePill}
      </div>
    )
  }
  return (
    <div className="flex shrink-0 items-center justify-between gap-2">
      {iconTitle}
      <div className="flex shrink-0 items-center gap-1.5">
        {allTimePill}
        {headerCarouselNav}
      </div>
    </div>
  )
}

export function TopEarnersRailHeader(props: {
  headerCarouselNav?: ReactNode
  suppressEnterAnimation?: boolean
  titleBlockOnly?: boolean
}) {
  return <TopEarnersHeader {...props} />
}

export default function TopEarners({
  tokenAddress,
  headerCarouselNav,
  railCarouselEmbedded,
  railCarouselBodyOnly,
}: TopEarnersProps) {
  const { data: entries, isLoading } = useUGCLeaderboard(tokenAddress)

  const shellClass = railCarouselEmbedded ? cardShellEmbedded : cardShellStandalone
  const frameStyle = railCarouselEmbedded
    ? { fontVariantNumeric: "lining-nums tabular-nums" as const }
    : railCardFrameStyle

  if (isLoading) {
    return (
      <div className={cn(shellClass)} style={frameStyle}>
        {!railCarouselBodyOnly ? <TopEarnersHeader headerCarouselNav={headerCarouselNav} /> : null}
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-4 w-5 rounded bg-[#242424]" />
              <Skeleton className="h-8 w-8 shrink-0 rounded-full bg-[#242424]" />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Skeleton className="h-3.5 w-24 rounded bg-[#242424]" />
                <Skeleton className="h-3 w-20 rounded bg-[#242424]" />
              </div>
              <Skeleton className="h-3.5 w-14 rounded bg-[#242424]" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!entries?.length) {
    return (
      <div className={cn(shellClass)} style={frameStyle}>
        {!railCarouselBodyOnly ? <TopEarnersHeader headerCarouselNav={headerCarouselNav} /> : null}
        <p className="flex flex-1 items-center justify-center py-2 text-center text-[13px] font-medium leading-snug text-[#494949]">
          No top earners yet.
        </p>
      </div>
    )
  }

  return (
    <div className={cn(shellClass)} style={frameStyle}>
      {!railCarouselBodyOnly ? <TopEarnersHeader headerCarouselNav={headerCarouselNav} /> : null}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
        {entries.map((entry) => {
          const postCountLabel = formatTopEarnerPostCount(entry.post_count)

          return (
            <div key={entry.creator_id} className="flex items-center gap-2">
              <div className="w-5 shrink-0 text-[12px] leading-[1.04] font-bold text-[#494949]">#{entry.rank}</div>

              <Link
                href={`/@${entry.username || entry.creator_id}`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[0.5px] border-[#313131] bg-[#191919]"
              >
                <User size={18} />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <Link
                  href={`/@${entry.username || entry.creator_id}`}
                  className="truncate text-[13px] font-bold leading-tight text-[#D9D9D9] hover:underline"
                >
                  {entry.username ? truncateUsername(entry.username) : truncateAddress(entry.creator_id)}
                </Link>
                <Link
                  href={`/@${entry.username || entry.creator_id}`}
                  className="truncate text-[12px] leading-[1.04] font-medium text-[#797979] hover:text-[#D9D9D9]"
                >
                  {truncateAddress(entry.creator_id)}
                </Link>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-0.5">
                <div className="text-[13px] leading-tight font-bold text-white">
                  ${formatTopEarnerUSD(entry.ugc_earnings_usd)}
                </div>
                {postCountLabel ? (
                  <div className="text-[11px] leading-tight font-medium text-[#494949]">{postCountLabel}</div>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
