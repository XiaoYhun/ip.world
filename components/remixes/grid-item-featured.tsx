import { useState } from "react"
import Image from "@/components/image"
import { cn } from "@/lib/utils"
import { Remix } from "@/types/remix"
import { Ip } from "@/types/ip"
import EndorsementSticker from "./endorsement-sticker"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import Link from "next/link"
import { IpInfoDialog } from "./ip-info-badge"
import {
  ChatBubbleTextSquare,
  Community,
  Crown,
  Instagram,
  TelegramAlt,
  Tiktok,
  Twitter,
  User,
  Website,
  Youtube,
  ChevronTriangle,
  Clock,
} from "../icons"
import { formatNumber, formatNumberWithSuffix } from "@/lib/number"
// Link removed — using router.push to avoid <a> nesting with social links

import { TreasureChestFilled } from "../icons/treasure-chest-filled"
import Copy from "../copy"
import { useTokenMetricsForAddress } from "@/hooks/use-token-metrics-for-address"
import { CATEGORIES } from "@/lib/constants"
import VisualizedDelta from "@/components/visualized-delta"
import { composeSafeSocialUrl } from "@/lib/safe-url"

const composeSocialUrl = {
  telegram: (v: string) => composeSafeSocialUrl("telegram", v) || "#",
  twitter: (v: string) => composeSafeSocialUrl("twitter", v) || "#",
  instagram: (v: string) => composeSafeSocialUrl("instagram", v) || "#",
  tiktok: (v: string) => composeSafeSocialUrl("tiktok", v) || "#",
  youtube: (v: string) => composeSafeSocialUrl("youtube", v) || "#",
  website: (v: string) => composeSafeSocialUrl("website", v) || "#",
}

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

const RemixGridItemFeatured = ({
  data,
  className,
}: {
  data: Remix
  className?: string
}) => {
  const [ipDialogOpen, setIpDialogOpen] = useState(false)

  const formattedMetrics = useTokenMetricsForAddress(data)
  const marketCapDisplay = formattedMetrics.market_cap
  const priceChangePct = formattedMetrics.market_cap_change_24h
  const graduationProgress = formattedMetrics.graduation_progress

  const content = (
    <Link
      href={`/token/${data.token_address}`}
      className={cn(
        "relative flex min-w-0 cursor-pointer flex-col overflow-hidden rounded-[16px] border border-neutral-600 bg-neutral-800 transition-colors duration-200 hover:bg-neutral-700",
        className
      )}
    >
      <div className="flex w-full flex-col gap-2 p-3">
        <div className="flex w-full gap-2">
          <div className="relative h-[78px] w-[78px] shrink-0 overflow-hidden rounded-[8px]">
            <Image src={data.image} alt={data.name} className="object-cover" fill />
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute top-1 left-1 z-10 flex items-center justify-center rounded-[6px] bg-black/70 p-1 backdrop-blur-sm">
                  {data.ip?.type === "creator" ? (
                    <Crown width={12} height={12} />
                  ) : (
                    <Community width={12} height={12} />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {data.ip?.type === "creator" ? "Creator" : "Community"}
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex min-h-[78px] min-w-0 flex-1 flex-col gap-2 sm:min-h-0">
            <div className="flex w-full flex-1 justify-between gap-2">
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-1 sm:justify-start">
                <div>
                  <div className="flex items-baseline gap-x-1.5">
                    {(data.owner_endorsement === "official" || data.owner_endorsement === "liked") && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="shrink-0 translate-y-[2px]">
                            <EndorsementSticker remix={data} size={16} />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {data.owner_endorsement === "official" ? "Official token" : "Creator favorite token"}
                        </TooltipContent>
                      </Tooltip>
                    )}
                    <div className="shrink-0 text-base font-medium">
                      <span className="line-clamp-1 break-all">{data.name}</span>
                    </div>
                    <Copy
                      copy={data.token_address}
                      text={`$${data.symbol}`}
                      toastLabel={`$${data.symbol}`}
                      className="min-w-0 text-[0.9375rem] font-bold text-neutral-400"
                      textClassName="truncate block"
                      size={10}
                    />
                  </div>
                </div>
                <div className="flex w-full translate-y-[2.5px] items-center">
                  <div
                    className="text-xxs flex shrink-0 items-center rounded-[6px] border border-neutral-600 bg-neutral-700 font-mono hover:bg-neutral-600 text-neutral-200 hover:text-neutral-100 hover:border-neutral-500"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setIpDialogOpen(true)
                    }}
                  >
                    {/* Left: category icon + IP name — clickable */}
                    <div className="flex cursor-pointer items-center gap-1 px-1.5 py-1 transition-colors">
                      {(() => {
                        const Icon = CATEGORIES.find((c) => c.key === data.ip?.category)?.icon
                        return Icon ? <Icon size={10} /> : null
                      })()}
                      <span className="max-w-[100px] truncate font-medium">{data.ip?.title || "—"}</span>
                    </div>
                    {/* Divider */}
                    <div className="h-[14px] w-px bg-neutral-600" />
                    {/* Right: treasure chest + amount */}
                    <div className="flex items-center gap-1 px-1.5 py-1 font-semibold text-purple-200">
                      <TreasureChestFilled />
                      <span className="leading-[7px]!">
                        {formattedMetrics.reward_chest_usd != null
                          ? `$${formatNumberWithSuffix(formattedMetrics.reward_chest_usd as number)}`
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <div className="flex items-end gap-1 font-mono">
                  <span className="text-xxs me-0.5 mb-0.5 font-medium text-neutral-300">MC</span>
                  <span className="text-xl font-medium text-white">
                    <VisualizedDelta dollar>{marketCapDisplay}</VisualizedDelta>
                  </span>
                </div>
                <div className="font-mono">
                  <div
                    className={cn(
                      "flex items-center gap-1 text-xs font-medium",
                      priceChangePct >= 0 ? "text-green-neon" : "text-pink-neon"
                    )}
                  >
                    <span className={priceChangePct >= 0 ? "" : "rotate-180"}>
                      <ChevronTriangle />
                    </span>
                    {formatNumber(Math.abs(priceChangePct || 0))}%
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-auto hidden w-full items-end justify-between gap-3 pt-px pb-2 sm:flex">
              <div className="line-clamp-2 h-[25px] text-xs text-neutral-200">{data.description || "\u00A0"}</div>
            </div>
          </div>
        </div>
        <div className="flex justify-between gap-2">
          <div className="flex w-full gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex w-[78px] shrink-0 flex-col gap-0.5 cursor-help">
                  <div className="relative h-[4px] w-full overflow-hidden rounded-full bg-neutral-600">
                    <div className="h-full w-full rounded-full bg-purple-200" style={{ width: `${Math.min(graduationProgress, 100)}%` }} />
                  </div>
                  <div className="font-mono text-xs text-purple-200">{Math.round(graduationProgress)}%</div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={2}>
                {graduationProgress >= 100
                  ? "Coin successfully graduated"
                  : `${Math.round(100 - graduationProgress)}% away from graduation`}
              </TooltipContent>
            </Tooltip>
            <div className="flex w-full flex-1 justify-between gap-2 h-[24px]">
              <div className="flex gap-1">
                {data.socials?.telegram && (
                  <a
                    href={composeSocialUrl.telegram(data.socials.telegram)}
                    className="flex size-6 items-center justify-center rounded-[4px] bg-neutral-700 p-1 text-neutral-300 duration-200 hover:bg-neutral-600"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <TelegramAlt size={10} />
                  </a>
                )}
                {data.socials?.twitter && (
                  <a
                    href={composeSocialUrl.twitter(data.socials.twitter)}
                    className="flex size-6 items-center justify-center rounded-[4px] bg-neutral-700 p-1 text-neutral-300 duration-200 hover:bg-neutral-600"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Twitter size={10} />
                  </a>
                )}
                {data.socials?.instagram && (
                  <a
                    href={composeSocialUrl.instagram(data.socials.instagram)}
                    className="flex size-6 items-center justify-center rounded-[4px] bg-neutral-700 p-1 text-neutral-300 duration-200 hover:bg-neutral-600"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Instagram size={10} />
                  </a>
                )}
                {data.socials?.tiktok && (
                  <a
                    href={composeSocialUrl.tiktok(data.socials.tiktok)}
                    className="flex size-6 items-center justify-center rounded-[4px] bg-neutral-700 p-1 text-neutral-300 duration-200 hover:bg-neutral-600"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Tiktok size={10} />
                  </a>
                )}
                {data.socials?.youtube && (
                  <a
                    href={composeSocialUrl.youtube(data.socials.youtube)}
                    className="flex size-6 items-center justify-center rounded-[4px] bg-neutral-700 p-1 text-neutral-300 duration-200 hover:bg-neutral-600"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Youtube size={10} />
                  </a>
                )}
                {data.socials?.website && (
                  <a
                    href={composeSocialUrl.website(data.socials.website)}
                    className="flex size-6 items-center justify-center rounded-[4px] bg-neutral-700 p-1 text-neutral-300 duration-200 hover:bg-neutral-600"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Website size={10} />
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2 overflow-hidden text-nowrap">
                <div className="flex items-center justify-center gap-1 text-xs leading-[100%] font-normal text-neutral-300">
                  <div className="-translate-y-px">
                    <Clock size={14} />
                  </div>
                  <div>{formatTimeAgo(data.created_at)}</div>
                </div>
                <div className="h-[13px] w-px bg-neutral-600"></div>
                <div className="flex items-center justify-center gap-1 text-xs leading-[100%] font-normal text-neutral-300">
                  <ChatBubbleTextSquare size={14} />
                  <div>{data.number_of_comments ? data.number_of_comments : "0"}</div>
                </div>
                <div className="h-[13px] w-px bg-neutral-600"></div>
                <div className="flex items-center justify-center gap-1 text-xs leading-[100%] font-normal text-neutral-300">
                  <User />
                  <div>{formatNumberWithSuffix(data.number_of_holders)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )

  return (
    <>
      <div>{content}</div>
      {data.ip && ipDialogOpen && (
        <IpInfoDialog ip={data.ip as Ip} isOpen={ipDialogOpen} onClose={() => setIpDialogOpen(false)} />
      )}
    </>
  )
}

export default RemixGridItemFeatured
