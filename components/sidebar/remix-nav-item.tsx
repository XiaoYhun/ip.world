"use client"

import Link from "next/link"
import { useIsMobileView } from "@/context/mobile-ui-context"
import { useSidebar } from "@/context/sidebar-context"
import { formatNumber } from "@/lib/number"
import { cn } from "@/lib/utils"
import { Remix } from "@/types/remix"
import Image from "../image"
import { useTokenMetricsForAddress } from "@/hooks/use-token-metrics-for-address"

type RemixNavItemProps = {
  remix: Remix
  itemClassName?: string
}

const RemixNavItem = ({ remix, itemClassName }: RemixNavItemProps) => {
  const { isExpanded } = useSidebar()
  const isMobile = useIsMobileView() ?? false
  const liveMetrics = useTokenMetricsForAddress(remix)

  const pricePercentage = liveMetrics.market_cap_change_24h
  const isPriceUp = Number(pricePercentage) > 0
  const isNeutral = Number(pricePercentage) === 0

  return (
    <Link
      key={`sidebar-remix-${remix.id}`}
      className={cn(
        "ease-out-quint hover:bg-neutral-600 flex h-9 w-full cursor-pointer flex-nowrap items-center gap-2 rounded-l-[2px] rounded-r-md ps-[2px] no-underline transition-colors duration-200 group-hover:pe-2 disabled:pointer-events-none disabled:opacity-40"
      )}
      href={`/token/${remix.token_address}`}
      aria-current="page"
    >
      <Image
        src={remix.image}
        alt={remix.id}
        width={32}
        height={32}
        className="flex aspect-square size-8 items-center justify-center rounded-[2px] object-cover"
      />
      <div className="order-2 flex flex-auto flex-col items-start justify-center self-stretch overflow-hidden">
        <div
          className={cn(
            "text-neutral-200 text-md font-inherit flex w-full items-center justify-start gap-1 leading-normal whitespace-nowrap transition-opacity",
            // Always show on mobile or when expanded
            isMobile || isExpanded ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            itemClassName
          )}
        >
          <div className="flex w-full justify-between overflow-hidden text-sm text-ellipsis whitespace-nowrap text-white">
            <div className="flex flex-col justify-start gap-1">
              <span className="w-[80px] truncate">{remix.name}</span>
              <span className="text-xs text-neutral-300">${remix.symbol}</span>
            </div>
            <span
              className={cn("text-sm", {
                "text-green": isPriceUp,
                "text-red": !isPriceUp && !isNeutral,
              })}
            >
              {formatNumber(remix.price_usd_change)}%
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default RemixNavItem
