"use client"

import { getAuthToken, useIsLoggedIn } from "@dynamic-labs/sdk-react-core"
import { useCallback, useEffect, useState } from "react"
import { favoriteRemixes, getIsRemixesFavorited, unFavoriteRemixes } from "@/actions/remix/favorite"
import Image from "@/components/image"
import { useSidebar } from "@/context/sidebar-context"
import { formatNumber, formatNumberWithSuffix, formatNumberWithSuperscriptZeros } from "@/lib/number"
import { cn } from "@/lib/utils"
import { Remix } from "@/types/remix"
import VisualizedDelta from "@/components/visualized-delta"
import { useTokenMetricsForAddress } from "@/hooks/use-token-metrics-for-address"
import BracketAnimation from "./animation/bracket"
import { SuperscriptNumber } from "./superscript-number"
import { Skeleton } from "./ui/skeleton"
import { ArrowEnter, Community, Crown, Heart, HeartOutlined } from "./icons"

const TokenListItem = ({ token, compact }: { token: Remix; compact?: boolean }) => {
  const { onFavoriteChange } = useSidebar()

  const [remixFavoriteStatus, setRemixFavoriteStatus] = useState(false)

  const isLoggedIn = useIsLoggedIn()
  async function isRemixesFavorited() {
    const { result } = await getIsRemixesFavorited(token.token_address, getAuthToken())
    setRemixFavoriteStatus(result)
  }

  const liveMetrics = useTokenMetricsForAddress(token)
  const pricePercentage = liveMetrics.price_change_24h || token.price_usd_change
  const isPriceUp = Number(pricePercentage) > 0

  useEffect(() => {
    if (token && isLoggedIn) {
      isRemixesFavorited()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isLoggedIn])

  const favorite = useCallback(async () => {
    await favoriteRemixes(token.token_address, getAuthToken())
    await isRemixesFavorited()
    onFavoriteChange("token", true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const unFavorite = useCallback(async () => {
    await unFavoriteRemixes(token.token_address, getAuthToken())
    await isRemixesFavorited()
    onFavoriteChange("token", false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  if (compact) {
    return (
      <div
        className={cn(
          "max-w-full min-w-0 cursor-pointer rounded-[12px] border-y border-transparent px-0.5 py-1.5 transition-all duration-300 hover:bg-neutral-600"
        )}
      >
        <div className="flex min-w-0 max-w-full items-start gap-2">
          {!!token.image && (
            <Image
              src={token.image}
              alt={token.name}
              width={40}
              height={40}
              className="aspect-square h-10 w-10 shrink-0 rounded-full object-cover"
            />
          )}
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="flex min-w-0 items-baseline gap-2">
              <span className="truncate text-sm font-medium text-white">{token.name}</span>
              <span className="shrink-0 text-xs font-semibold text-[#797979]">${token.symbol}</span>
            </div>
            <div className="mt-0.5 flex min-w-0 items-center gap-1">
              <span className="shrink-0 text-neutral-300">
                <ArrowEnter />
              </span>
              <span className="shrink-0 text-neutral-200">
                {token?.ip?.type === "creator" ? <Crown width={12} height={10} /> : <Community width={12} height={10} />}
              </span>
              <span className="min-w-0 truncate text-xs font-medium text-white">{token?.ip?.title}</span>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
            <div className="max-w-[5.5rem] truncate text-sm font-semibold text-white sm:max-w-none">
              ${formatNumberWithSuperscriptZeros(token.price_usd || 0)}
            </div>
            <div
              className={cn(
                "text-xs font-medium",
                pricePercentage > 0 ? "text-green-neon" : pricePercentage < 0 ? "text-red" : "text-white",
              )}
            >
              {pricePercentage ? `${formatNumber(pricePercentage)}%` : "-"}
            </div>
          </div>
        </div>
        <div
          className={cn(
            "mt-2 flex min-w-0 max-w-full flex-wrap gap-x-4 gap-y-1.5 border-t border-neutral-600/30 pt-2 text-xs",
            !!token.image ? "pl-12" : "pl-0",
          )}
        >
          <div className="flex min-w-0 max-w-[32%] items-center gap-1">
            <span className="shrink-0 text-[#797979]">MC</span>
            <span className="min-w-0 truncate font-medium text-white">
              <VisualizedDelta dollar>{liveMetrics.market_cap}</VisualizedDelta>
            </span>
          </div>
          <div className="flex min-w-0 max-w-[32%] items-center gap-1">
            <span className="shrink-0 text-[#797979]">VOL</span>
            <span className="min-w-0 truncate font-medium text-white">
              <VisualizedDelta dollar>{liveMetrics.volume_24h}</VisualizedDelta>
            </span>
          </div>
          <div className="flex min-w-0 max-w-[32%] items-center gap-1">
            <span className="shrink-0 text-[#797979]">LIQ</span>
            <span className="min-w-0 truncate font-medium text-white">${liveMetrics.liquidity}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-[12px] border-y border-transparent px-1.5 py-1 transition-all duration-300 hover:bg-neutral-600"
      )}
    >
      <div className="flex min-w-0 flex-1 items-center">
        {!!token.image && (
          <Image
            src={token.image}
            alt={token.name}
            width={40}
            height={40}
            className="aspect-square h-10 w-10 shrink-0 rounded-full object-cover"
          />
        )}
        {/* Left: name + ticker / IP row */}
        <div className="ml-1.5 flex w-[165px] shrink-0 flex-col gap-1">
          <div className="flex items-baseline gap-2">
            <span className="truncate text-sm font-medium text-white">
              {token.name}
            </span>
            <span className="shrink-0 text-xs font-semibold text-[#797979]">${token.symbol}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-neutral-300">
              <ArrowEnter />
            </span>
            <span className="text-neutral-200">
              {token?.ip?.type === "creator" ? <Crown width={12} height={10} /> : <Community width={12} height={10} />}
            </span>
            <span className="truncate text-xs font-medium text-white">{token?.ip?.title}</span>
          </div>
        </div>

        {/* Middle: MC / VOL / LIQ — fixed width columns for alignment */}
        <div className="ml-12 flex items-center gap-4">
          <div className="flex w-[60px] items-center gap-1">
            <span className="text-xs text-[#797979]">MC</span>
            <span className="text-xs font-medium text-white">
              <VisualizedDelta dollar>{liveMetrics.market_cap}</VisualizedDelta>
            </span>
          </div>
          <div className="flex w-[68px] items-center gap-1">
            <span className="text-xs text-[#797979]">VOL</span>
            <span className="text-xs font-medium text-white">
              <VisualizedDelta dollar>{liveMetrics.volume_24h}</VisualizedDelta>
            </span>
          </div>
          <div className="flex w-[60px] items-center gap-1">
            <span className="text-xs text-[#797979]">LIQ</span>
            <span className="text-xs font-medium text-white">
              ${liveMetrics.liquidity}
            </span>
          </div>
        </div>

        {/* Right: price + change — left aligned within column */}
        <div className="ml-auto flex w-[70px] shrink-0 flex-col gap-1">
          <div className="text-sm font-semibold text-white">${formatNumberWithSuperscriptZeros(token.price_usd || 0)}</div>
          <div className={cn("text-xs font-medium", pricePercentage > 0 ? "text-green-neon" : pricePercentage < 0 ? "text-red" : "text-white")}>
            {pricePercentage ? `${formatNumber(pricePercentage)}%` : "-"}
          </div>
        </div>
      </div>
    </div>
  )
}

export const TokenListItemSkeleton = () => {
  return (
    <div className="hover:bg-accent dark:hover:bg-item-hover-gradient hover:border-accent flex cursor-pointer items-center gap-4 border-y border-transparent py-1 pr-4 pl-9">
      <div className="flex flex-1 items-center gap-1.5 p-1">
        <Skeleton className="h-10 w-10" />
        <div className="flex w-full justify-between">
          <div className="flex flex-col justify-center gap-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-12" />
          </div>
          <div className="flex flex-col items-end justify-center gap-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default TokenListItem
