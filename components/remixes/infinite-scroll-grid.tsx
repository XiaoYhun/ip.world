"use client"

import { ArrowDown, ArrowUp, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import React, { useEffect, useRef } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { fetchRemixesClient } from "@/app/(dApp)/coins/client-actions"
import Image from "@/components/image"
import { PAGINATION_LIMIT } from "@/lib/constants"
import { formatNumber, formatNumberWithSuffix } from "@/lib/number"
import { cn } from "@/lib/utils"
import { Remix } from "@/types/remix"
import RemixGridItemFeatured from "./grid-item-featured"
import Copy from "../copy"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import Timer from "../timer"
import { AnimatedProgressRainbowCanvas } from "../ui/animated-progress"
import SparklineChart from "@/app/(dApp)/components/sparkline-chart"
import IpInfoBadge from "@/components/remixes/ip-info-badge"
import { Token } from "@/components/icons"
import VisualizedDelta from "@/components/visualized-delta"
import { useTokenMetricsForAddress } from "@/hooks/use-token-metrics-for-address"

type InfiniteScrollGridProps = {
  initialRemixes: Remix[]
  total: number
  searchParams: {
    query: string
    sort: string
    sort_order: string
    licensed: boolean
    community: boolean
    claimed: boolean
    verified: boolean
    socials: boolean
    category: string
    is_graduated?: boolean
    hide_spam?: boolean
  }
  isIpOwner?: boolean
  /** CSS top value for the sticky list header (e.g. "120px") */
  stickyHeaderTop?: string
}

export default function InfiniteScrollGrid({
  initialRemixes,
  total,
  searchParams,
  isIpOwner = false,
  stickyHeaderTop = "120px",
}: InfiniteScrollGridProps) {
  const observerTarget = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const params = useSearchParams()
  const currentView = params.get("view") || "grid"
  // Handle column sorting with three states: desc -> asc -> default
  const handleSort = (column: string) => {
    const newParams = new URLSearchParams(params.toString())
    const currentSort = searchParams.sort
    const currentOrder = searchParams.sort_order

    if (currentSort === column) {
      // Currently sorting by this column
      if (currentOrder === "desc") {
        // First click was desc, now set to asc
        newParams.set("sort_order", "asc")
      } else {
        // Second click was asc, now remove sort to return to default
        newParams.delete("sort_by")
        newParams.delete("sort_order")
      }
    } else {
      // New column, set to desc
      newParams.set("sort_by", column)
      newParams.set("sort_order", "desc")
    }

    router.replace(`?${newParams.toString()}`, { scroll: false })
  }

  // Get sort indicator icon
  const getSortIcon = (column: string) => {
    if (searchParams.sort !== column) {
      return null
    }
    return searchParams.sort_order === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    )
  }

  // Create a query key from search params to trigger refetch on change
  const queryKey = ["remixes", searchParams]

  // Use react-query's useInfiniteQuery for client-side fetching with server action
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 0 }) =>
      fetchRemixesClient({
        ...searchParams,
        limit: PAGINATION_LIMIT,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const totalFetched = allPages.reduce((sum, page) => sum + (page.results?.length ?? 0), 0)
      return totalFetched < lastPage.total ? totalFetched : undefined
    },
    ...(initialRemixes.length > 0 ? {
      initialData: {
        pages: [{ results: initialRemixes, total, limit: PAGINATION_LIMIT, offset: 0 }],
        pageParams: [0],
      },
    } : {}),
    staleTime: 30000, // Consider data fresh for 30 seconds
  })

  // Flatten all pages into a single array of remixes
  const remixes = data?.pages.flatMap((page) => page.results ?? []) ?? []

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  // Handle error state
  if (isError) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Failed to load remixes</p>
          <p className="text-muted-foreground text-sm">Please try again later</p>
        </div>
      </div>
    )
  }

  if (!isLoading && remixes.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-neutral-700/60 py-20">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-800 text-neutral-500">
          <Token size={24} />
        </div>
        <div className="flex flex-col items-center gap-1.5 text-center">
          <p className="text-sm font-medium text-neutral-300">No coins found</p>
          <p className="text-xs text-neutral-500">Try adjusting your filters or check back later</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {currentView === "grid" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 min-[1800px]:grid-cols-4">
          {remixes.map((item, index) => (
            <RemixGridItemFeatured
              data={item}
              key={`remix-${item.id}-${index}`}
              className=""
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col">
          <div style={{ top: stickyHeaderTop }} className="sticky z-20 grid grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] bg-background px-2 pt-3 pb-3 text-xs font-semibold tracking-wide text-neutral-400 uppercase sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.3fr)] lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.7fr)_minmax(0,0.7fr)_minmax(0,1.2fr)_minmax(0,1fr)]">
            <div className="text-left">COIN</div>
            <button
              onClick={() => handleSort("market_cap")}
              className="hover:text-neutral-200 flex cursor-pointer items-center justify-start text-left transition-colors"
            >
              MCAP
              {getSortIcon("market_cap")}
            </button>
            <button
              onClick={() => handleSort("total_volume_usd")}
              className="hover:text-neutral-200 flex max-w-sm cursor-pointer items-center justify-start truncate text-left transition-colors sm:max-w-none"
            >
              VOL
              {getSortIcon("total_volume_usd")}
            </button>
            <button
              onClick={() => handleSort("pool_size")}
              className="hover:text-neutral-200 flex max-w-sm cursor-pointer items-center justify-start truncate text-left transition-colors sm:max-w-none"
            >
              LIQ
              {getSortIcon("pool_size")}
            </button>
            <button
              onClick={() => handleSort("number_of_holders")}
              className="hover:text-neutral-200 hidden cursor-pointer items-center justify-start text-left transition-colors lg:flex"
            >
              HOLDERS
              {getSortIcon("number_of_holders")}
            </button>
            <button
              onClick={() => handleSort("created_at")}
              className="hover:text-neutral-200 hidden cursor-pointer items-center justify-start text-left transition-colors lg:flex"
            >
              AGE
              {getSortIcon("created_at")}
            </button>
            <div className="hidden text-left sm:block">Origin</div>
            <div className="hidden text-right lg:block">PROGRESS</div>
          </div>
          {remixes.map((item, index) => (
            <ListRow key={`remix-${item.id}-list-${index}`} item={item} />
          ))}
        </div>
      )}

      {/* Intersection observer target */}
      {hasNextPage && (
        <div ref={observerTarget} className="flex justify-center py-8">
          {isFetchingNextPage && (
            <div className="text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading more coins...</span>
            </div>
          )}
        </div>
      )}

    </div>
  )
}

const ListRow = ({ item }: { item: Remix }) => {
  const liveMetrics = useTokenMetricsForAddress(item)

  return (
    <Link
      href={`/token/${item.token_address}`}
      className="grid cursor-pointer grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] items-center rounded-[12px] px-2 py-1.5 text-sm font-medium tabular-nums transition-colors hover:bg-neutral-800/80 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.3fr)] lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.7fr)_minmax(0,0.7fr)_minmax(0,1.2fr)_minmax(0,1fr)]"
    >
      {/* TOKEN */}
      <div className="flex items-center gap-2.5">
        <Image
          src={item.image}
          alt={item.name}
          className="aspect-square h-8 w-8 rounded-[10px] object-cover"
          width={32}
          height={32}
        />
        <span className="flex flex-col gap-0.5">
          <div className="text-sm text-white">{item.name}</div>
          <Copy copy={item.token_address} text={`$${item.symbol}`} toastLabel={`$${item.symbol}`} className="text-xs font-medium text-neutral-400" size={10} />
        </span>
      </div>

      {/* MCAP + change + sparkline */}
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-white"><VisualizedDelta dollar>{liveMetrics.market_cap}</VisualizedDelta></span>
          <span
            className={cn(
              "text-xs",
              liveMetrics.market_cap_change_24h >= 0 ? "text-[#AEFF2D]" : "text-red-400"
            )}
          >
            {liveMetrics.market_cap_change_24h >= 0 ? "+" : ""}
            {formatNumber(liveMetrics.market_cap_change_24h || 0)}%
          </span>
        </div>
        <div className="hidden lg:block">
          <SparklineChart data={[]} width={74} height={29} strokeWidth={1.5} showTooltip={false} />
        </div>
      </div>

      {/* VOL */}
      <div className="flex items-center text-sm text-white">
        <VisualizedDelta dollar>{liveMetrics.volume_24h}</VisualizedDelta>
      </div>

      {/* LIQ */}
      <div className="flex items-center text-sm text-white">
        ${formatNumberWithSuffix(item?.pool_size)}
      </div>

      {/* HOLDERS */}
      <div className="hidden items-center text-sm text-white lg:flex">
        {formatNumberWithSuffix(item.number_of_holders)}
      </div>

      {/* AGE */}
      <div className="hidden items-center text-sm text-white lg:flex">
        <Timer startTime={item.created_at || ""} />
      </div>

      {/* IP / Topic Card */}
      <div className="relative z-10 hidden sm:flex items-center" onClick={(e) => { e.stopPropagation(); e.preventDefault() }}>
        <IpInfoBadge
          remix={item}
          className="gap-2 rounded-[10px] bg-[#191919] px-2 py-1.5 hover:bg-[#242424]"
          typeIconClassName="text-neutral-400"
        />
      </div>

      {/* PROGRESS */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="hidden items-center justify-end gap-2 lg:flex cursor-help">
            <span className="text-sm font-medium text-neutral-300">
              {Math.round(liveMetrics.graduation_progress || 0)}%
            </span>
            <div className="w-[100px]">
              <div className="relative h-2 rounded-full bg-neutral-700">
                <div
                  className="absolute left-0 top-0 h-2 rounded-full bg-neutral-200"
                  style={{ width: `${Math.min(liveMetrics.graduation_progress || 0, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={2}>
          {(liveMetrics.graduation_progress || 0) >= 100
            ? "Coin successfully graduated"
            : `${Math.round(100 - (liveMetrics.graduation_progress || 0))}% away from graduation`}
        </TooltipContent>
      </Tooltip>
    </Link>
  )
}
