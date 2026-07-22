"use client"

import CategoryPills from "@/components/category-pills"
import { formatNumber, formatNumberWithSuffix } from "@/lib/number"
import Link from "next/link"
import Image from "next/image"
import { Creator, Community, ChevronTriangle } from "@/components/icons"
import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronRightIcon } from "lucide-react"
import { Remix } from "@/types/remix"
import EndorsementSticker from "@/components/remixes/endorsement-sticker"
import { TreasureChestFilled } from "@/components/icons/treasure-chest-filled"
import { useTokenMetricsForAddress } from "@/hooks/use-token-metrics-for-address"
import VisualizedDelta from "@/components/visualized-delta"

/*
  Responsive card count:
  sm (640px): 2 cards
  md (768px): 3 cards
  lg (1024px): 4 cards
  xl (1280px): 5 cards
*/

export default function TiktokTokens({ tokens, customTitle }: { tokens: Remix[]; customTitle?: string }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isScrolling = useRef(false)

  const updateScrollState = useCallback(() => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setCanScrollLeft(scrollLeft > 2)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    updateScrollState()
    el.addEventListener("scroll", updateScrollState, { passive: true })
    window.addEventListener("resize", updateScrollState)
    return () => {
      el.removeEventListener("scroll", updateScrollState)
      window.removeEventListener("resize", updateScrollState)
    }
  }, [updateScrollState, tokens])

  const handleHover = useCallback((index: number | null) => {
    if (isScrolling.current) return
    setHoveredIndex(index)
  }, [])

  const scroll = useCallback((direction: "left" | "right") => {
    if (!scrollRef.current) return
    isScrolling.current = true
    setHoveredIndex(null)
    const cardWidth = scrollRef.current.firstElementChild?.getBoundingClientRect().width ?? 300
    scrollRef.current.scrollBy({ left: direction === "right" ? cardWidth * 2 : -cardWidth * 2, behavior: "smooth" })
    setTimeout(() => { isScrolling.current = false }, 600)
  }, [])

  return (
    <div className="relative" ref={containerRef} onMouseLeave={() => handleHover(null)}>
      <div className="mb-4 flex justify-between">
        <h2 className="text-lg font-medium sm:text-2xl">{customTitle || "Trending IPs"}</h2>
      </div>
      <div className="group relative w-full">
        <div
          ref={scrollRef}
          className="no-scrollbar flex gap-2 overflow-x-auto pt-2 sm:gap-3"
        >
          {tokens && tokens.length > 0 ? (
            tokens.map((token, index) => (
              <TokenItem
                key={index}
                token={token}
                isHovered={hoveredIndex === index}
                onHover={() => handleHover(index)}
              />
            ))
          ) : (
            <div className="flex h-20 w-full items-center justify-center text-sm font-medium text-neutral-300">
              No Tokens
            </div>
          )}
        </div>
        {/* Left scroll arrow */}
        {canScrollLeft && (
          <div
            className="group/navigate absolute top-0 bottom-0 left-0 z-100 flex w-14 cursor-pointer items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            onClick={() => scroll("left")}
          >
            <ChevronRightIcon className="size-8 rotate-180 transition-all group-hover/navigate:scale-125" />
          </div>
        )}
        {/* Right scroll arrow */}
        {canScrollRight && (
          <div
            className="group/navigate absolute top-0 right-0 bottom-0 z-100 flex w-14 cursor-pointer items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            onClick={() => scroll("right")}
          >
            <ChevronRightIcon className="size-8 transition-all group-hover/navigate:scale-125" />
          </div>
        )}
      </div>
    </div>
  )
}

const TokenItem = ({
  token,
  isHovered,
  onHover,
}: {
  token: Remix
  isHovered: boolean
  onHover: () => void
}) => {
  const liveMetrics = useTokenMetricsForAddress(token)

  // Card 0: no border, no gradient div — inset box-shadow on the outer container
  // Card 1: no border, gradient div WITHOUT rounded-[12px] (outer overflow-hidden clips it)
  // Card 2: outline instead of ring/border, gradient without rounded-[12px]
  // Card 3: ring-1 ring-white/10, gradient without rounded-[12px], image without rounded-[12px]
  return (
    <div className="relative aspect-video shrink-0 cursor-pointer overflow-hidden rounded-[12px] bg-[#151515] w-[calc(50%-0.25rem)] sm:w-[calc(50%-0.375rem)] md:w-[calc(33.333%-0.5rem)] lg:w-[calc(25%-0.5625rem)] xl:w-[calc(20%-0.6rem)]">
      <Link
        href={`/token/${token.token_address}`}
        className="relative block h-full w-full transition-all duration-200 hover:z-20 hover:brightness-110"
        onMouseEnter={onHover}
      >
        <Image
          src={token.image}
          alt={token.name}
          fill
          className="rounded-[11px] object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
        />
        <div className="absolute inset-0 rounded-[11px]" style={{ background: 'linear-gradient(to top, #262626, transparent 60%)' }} />

        {token.ip && (
          <div className="absolute top-3 left-3">
            <div className="flex items-center gap-1 rounded-[6px] bg-[#1515159C] px-1.5 py-1 text-purple-200">
              <TreasureChestFilled />
              <div className="font-mono text-xs font-semibold">
                {token?.reward_chest_usd != null ? `$${formatNumberWithSuffix(token?.reward_chest_usd)}` : "—"}
              </div>
            </div>
          </div>
        )}

        {/* Top right category */}
        {token.ip && (
          <div className="absolute top-3 right-3">
            <CategoryPills ip={token.ip} className="h-5 border-black/30 bg-black/40 text-neutral-100 shadow-none!" />
          </div>
        )}

        {/* Bottom left — verified icon + name, ticker below */}
        <div className="absolute bottom-3 left-3">
          <div className="flex items-center gap-1">
            {(token.owner_endorsement === "official" || token.owner_endorsement === "liked") && <EndorsementSticker remix={token} size={14} />}
            <div className="font-archivo text-sm font-medium sm:text-base">{token.name}</div>
          </div>
          <div className="mt-1 flex items-center gap-1 text-neutral-200">
            {token.ip?.type === "creator" && <span className="-translate-y-px"><Creator size={10} /></span>}
            {token.ip?.type === "community" && <Community width={12} height={10} />}
            <div className="text-xs font-medium uppercase sm:text-sm">${token.symbol}</div>
          </div>
        </div>

        {/* Bottom right market cap */}
        <div className="absolute bottom-3 right-3">
          <div className="flex flex-col items-end gap-1">
            <div className="font-mono"><VisualizedDelta dollar>{liveMetrics.market_cap}</VisualizedDelta></div>
            <div className={cn("flex items-center gap-1 text-neutral-200 rounded-[4px] px-1 py-0.5 text-xs", liveMetrics.market_cap_change_24h > 0 ? "text-green-neon bg-green-neon/10" : "text-pink-neon bg-pink-neon/10")}>
              <ChevronTriangle />
              <div>{formatNumber(liveMetrics.market_cap_change_24h, 2)}%</div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}
