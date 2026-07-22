"use client"
import Link from "next/link"
// useRouter removed — using Link for right-click support
import { Remix } from "@/types/remix"
import Image from "next/image"
import { formatNumber, formatNumberWithSuffix } from "@/lib/number"
import { ArrowRightIcon, ChevronsUpDown, Info } from "lucide-react"
import useGetPrice from "@/hooks/use-get-price"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { START_TICK_LIST, TOTAL_SUPPLY } from "@/lib/utils/token-calculations"
import { cn } from "@/lib/utils"
import SparklineChart from "./sparkline-chart"
import { RankBadge } from "./rank-badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"
import { CATEGORIES } from "@/lib/constants"
import Copy from "@/components/copy"
import VisualizedDelta from "@/components/visualized-delta"
import { IpInfoDialog } from "@/components/remixes/ip-info-badge"
import EndorsementSticker from "@/components/remixes/endorsement-sticker"
import { Ip } from "@/types/ip"
import { useTokenMetricsForAddress } from "@/hooks/use-token-metrics-for-address"
import { useTokenMetrics } from "@/context/token-metrics-context"
import { buildTrendingTokensQuery, type TrendingTimeframeKey } from "../homepage-shelf-queries"

type TimeframeKey = TrendingTimeframeKey

const TIMEFRAME_OPTIONS: { value: TimeframeKey; label: string }[] = [
  { value: "24h", label: "24h" },
  { value: "6h", label: "6h" },
  { value: "1h", label: "1h" },
  { value: "5m", label: "5m" },
]

const VOLUME_KEY: Record<TimeframeKey, string> = {
  "24h": "volume_24h_usd",
  "6h": "vol_6h_usd",
  "1h": "vol_1h_usd",
  "5m": "vol_5m_usd",
}

const PRICE_CHANGE_KEY: Record<TimeframeKey, string> = {
  "24h": "price_change_24h",
  "6h": "price_change_6h",
  "1h": "price_change_1h",
  "5m": "price_change_5m",
}

export default function TrendingTokens({
  trendingTokens,
  aboutToGraduateTokens,
}: {
  trendingTokens: Remix[]
  aboutToGraduateTokens: Remix[]
}) {
  const [timeframe, setTimeframe] = useState<TimeframeKey>("24h")
  const [visibleTrendingTokens, setVisibleTrendingTokens] = useState<Remix[]>(trendingTokens)
  const { data: ipPrice } = useGetPrice()

  // Graduation market cap in IP = price_at_graduation_tick × total_supply
  // price = 1.0001^tick where tick = START_TICK_LIST[1] (graduation threshold)
  const GRADUATION_MCAP_IP = Math.pow(1.0001, START_TICK_LIST[1]) * TOTAL_SUPPLY
  const graduationMcapUsd = GRADUATION_MCAP_IP * (ipPrice || 0)

  useEffect(() => {
    if (timeframe === "24h") {
      setVisibleTrendingTokens(trendingTokens)
      return
    }

    let cancelled = false
    async function loadTimeframeTokens() {
      try {
        const res = await fetch(`/api/remixes?${buildTrendingTokensQuery(timeframe).toString()}`)
        const data = await res.json()
        if (!cancelled) {
          setVisibleTrendingTokens(data?.results || [])
        }
      } catch (error) {
        console.error("Fetch Trending Timeframe Tokens Error:", error)
        if (!cancelled) {
          setVisibleTrendingTokens(trendingTokens)
        }
      }
    }

    loadTimeframeTokens()
    return () => {
      cancelled = true
    }
  }, [timeframe, trendingTokens])

  if ((!trendingTokens || trendingTokens.length === 0) && (!aboutToGraduateTokens || aboutToGraduateTokens.length === 0)) {
    return <div>No tokens</div>
  }

  return (
    <div className="flex flex-col gap-12 lg:grid lg:grid-cols-2">
      {/* Trending Tokens Section */}
      <div className="lg:flex-1">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="flex items-center gap-1.5 text-lg font-medium sm:text-2xl">
              Trending Coins
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex cursor-help opacity-40 transition-opacity hover:opacity-100">
                    <Info size={14} className="text-current" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={6}>
                  Coins trending by market activity and online virality
                </TooltipContent>
              </Tooltip>
            </h2>
            <Select value={timeframe} onValueChange={(v) => setTimeframe(v as TimeframeKey)}>
              <SelectTrigger
                noArrow
                className="h-auto w-auto gap-1 border-none bg-transparent! p-0 text-2xl font-medium text-neutral-400 shadow-none focus:ring-0 sm:text-2xl"
              >
                <SelectValue />
                <ChevronsUpDown className="size-4 text-neutral-300" />
              </SelectTrigger>
              <SelectContent className="min-w-[100px] rounded-[12px] border-neutral-700 bg-[#111111] p-1">
                {TIMEFRAME_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="rounded-[10px] px-3 py-2 pr-3! text-sm text-neutral-300 focus:bg-transparent! focus:text-white data-[state=checked]:text-white [&>[class*=absolute]]:hidden"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Link
            href="/coins"
            className="flex items-center gap-1 text-sm font-medium text-neutral-400 hover:text-neutral-200"
          >
            View All <ArrowRightIcon className="size-3" />
          </Link>
        </div>
        <TokenTable tokens={visibleTrendingTokens.slice(0, 5)} timeframe={timeframe} />
      </div>

      {/* About To Graduate Section - hidden on mobile */}
      <div className="lg:flex-1">
        <div className="mb-6 flex h-[36px] items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="flex items-center gap-1.5 text-lg font-medium sm:text-2xl">
              About To Graduate
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex cursor-help opacity-40 transition-opacity hover:opacity-100">
                    <Info size={14} className="text-current" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={6}>
                  {`Coins close to hitting the graduation threshold (${graduationMcapUsd > 0 ? "$" + formatNumberWithSuffix(graduationMcapUsd) : "..."})`}
                </TooltipContent>
              </Tooltip>
            </h2>
          </div>
          <Link
            href="/coins?sort_by=graduation_progress&sort_order=desc&is_graduated=false"
            className="flex items-center gap-1 text-sm font-medium text-neutral-400 hover:text-neutral-200"
          >
            View All <ArrowRightIcon className="size-3" />
          </Link>
        </div>
        <TokenTable tokens={aboutToGraduateTokens.slice(0, 5)} noRank />
      </div>
    </div>
  )
}

const TokenTableRow = ({
  token,
  rank,
  noRank,
  onSelectIp,
  timeframe = "24h",
}: {
  token: Remix
  rank: number
  noRank: boolean
  onSelectIp: (ip: Ip) => void
  timeframe?: TimeframeKey
}) => {
  const liveMetrics = useTokenMetricsForAddress(token)
  const metricsMap = useTokenMetrics()
  const metrics = metricsMap.get(token.token_address.toLowerCase())
  const metricValues = metrics as Record<string, number | undefined> | undefined
  const pricesData = token.price_7d?.map((item) => ({
    value: item.close_price_usd,
    timestamp: item.timestamp,
  }))

  return (
    <TableRow className="group/row relative cursor-pointer *:px-2! *:py-2! hover:bg-transparent! sm:*:px-3! lg:*:px-1! xl:*:px-2! 2xl:*:px-3! hover:[&>td]:bg-neutral-700 hover:[&>td:first-child]:rounded-l-xl hover:[&>td:last-child]:rounded-r-xl">
      {!noRank && (
        <TableCell className="font-mono text-neutral-300">
          <div className="flex items-center">
            <RankBadge rank={rank} />
          </div>
        </TableCell>
      )}

      <TableCell className="max-w-0">
        <Link
          href={`/token/${token.token_address}`}
          className="flex min-w-0 items-center gap-3 after:absolute after:inset-0 after:content-['']"
        >
          <div className="relative size-[36px] shrink-0 overflow-hidden rounded-[10px] sm:size-[48px] sm:rounded-[12px]">
            <Image src={token.image} alt={token.name} className="object-cover" fill />
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex min-w-0 items-center gap-1 text-sm font-semibold text-white">
              <span className="shrink-0">
                <EndorsementSticker remix={token} size={14} />
              </span>
              <span className="truncate">{token.name}</span>
            </div>
            <Copy
              copy={token.token_address}
              text={`$${token.symbol}`}
              toastLabel={`$${token.symbol}`}
              className="text-xs font-medium text-neutral-400"
              size={10}
            />
          </div>
        </Link>
      </TableCell>

      <TableCell className="align-top max-lg:table-cell md:align-middle lg:hidden xl:table-cell">
        {token.ip ? (
          <div
            className="group/ip relative z-10 inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] bg-neutral-700 px-2 py-1 transition-colors group-hover/row:bg-neutral-600/60 hover:!bg-neutral-600"
            onClick={(e) => {
              e.stopPropagation()
              onSelectIp(token.ip as Ip)
            }}
          >
            {(() => {
              const Icon = CATEGORIES.find((c) => c.key === token.ip?.category)?.icon
              return Icon ? <Icon size={12} /> : null
            })()}
            <span className="max-w-[100px] truncate text-xs font-medium text-neutral-300 group-hover/ip:!text-white group-hover/row:text-neutral-200">
              {token.ip.title}
            </span>
          </div>
        ) : (
          <span className="text-xs text-neutral-500">—</span>
        )}
      </TableCell>

      <TableCell className="hidden text-right sm:table-cell">
        <div className="font-mono text-sm font-semibold">
          <VisualizedDelta dollar>
            {timeframe === "24h"
              ? liveMetrics.volume_24h
              : formatNumberWithSuffix(metricValues?.[VOLUME_KEY[timeframe]] ?? 0)}
          </VisualizedDelta>
        </div>
      </TableCell>

      <TableCell className="text-right">
        <div className="flex flex-col items-end gap-1">
          <div className="font-mono text-sm font-semibold">
            <VisualizedDelta dollar>{liveMetrics.market_cap}</VisualizedDelta>
          </div>
          {(() => {
            const changeKey = PRICE_CHANGE_KEY[timeframe]
            const change = metricValues?.[changeKey] ?? liveMetrics.market_cap_change_24h ?? 0
            return (
              <div className={cn("text-xs font-medium", change > 0 ? "text-green-neon" : "text-pink-neon")}>
                {change > 0 ? "+" : ""}
                {formatNumber(change, 2)}%
              </div>
            )
          })()}
        </div>
      </TableCell>

      <TableCell className="hidden text-right sm:table-cell">
        <div className="w-[60px] lg:w-[60px] xl:w-[80px] 2xl:w-[120px]">
          <SparklineChart data={pricesData} width={120} height={30} strokeWidth={1.5} showTooltip={true} />
        </div>
      </TableCell>
    </TableRow>
  )
}

const TokenTable = ({
  tokens,
  startRank = 1,
  noRank = false,
  timeframe = "24h",
}: {
  tokens: Remix[]
  startRank?: number
  noRank?: boolean
  timeframe?: TimeframeKey
}) => {
  const [selectedIp, setSelectedIp] = useState<Ip | null>(null)

  return (
    <div className="[&>[data-slot=table-container]]:overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-none font-mono *:px-2! hover:bg-transparent! sm:*:px-3! lg:*:px-1! xl:*:px-2! 2xl:*:px-3!">
            {!noRank && (
              <TableHead className="w-[40px] text-left text-[10px] font-semibold tracking-wide text-neutral-400 uppercase sm:w-[50px]">
                RANK
              </TableHead>
            )}
            <TableHead className="w-[30%] text-left text-[10px] font-semibold tracking-wide text-neutral-400 uppercase">
              TOKEN
            </TableHead>
            <TableHead className="w-auto max-w-[160px] text-left text-[10px] font-semibold tracking-wide text-neutral-400 uppercase max-lg:table-cell lg:hidden xl:table-cell">
              Origin
            </TableHead>
            <TableHead className="hidden text-right text-[10px] font-semibold tracking-wide text-neutral-400 uppercase sm:table-cell">
              VOLUME
            </TableHead>
            <TableHead className="min-w-[80px] text-right text-[10px] font-semibold tracking-wide text-neutral-400 uppercase">
              MCAP
            </TableHead>
            <TableHead className="hidden w-[60px] text-right text-[10px] font-semibold tracking-wide text-neutral-400 uppercase sm:table-cell lg:w-[60px] xl:w-[80px] 2xl:w-[120px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tokens.map((token, index) => (
            <TokenTableRow
              key={token.token_address}
              token={token}
              rank={startRank + index}
              noRank={noRank}
              onSelectIp={setSelectedIp}
              timeframe={timeframe}
            />
          ))}
        </TableBody>
      </Table>
      {selectedIp && <IpInfoDialog ip={selectedIp} isOpen={!!selectedIp} onClose={() => setSelectedIp(null)} />}
    </div>
  )
}
