"use client"

import { Loader2 } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import RemixGridItemFeatured from "@/components/remixes/grid-item-featured"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Image from "@/components/image"
import Link from "next/link"
import { formatNumberWithSuffix } from "@/lib/number"
import { ChevronTriangle } from "@/components/icons"
import { cn } from "@/lib/utils"
import { PAGINATION_LIMIT } from "@/lib/constants"
import { Remix } from "@/types/remix"
import { fetchUserRemixes } from "../[wallet_address]/actions"

type InfiniteScrollGridProps = {
  address: string
  initialRemixes: Remix[]
  total: number
  isIpOwner?: boolean
  view?: "grid" | "list"
}

export default function InfiniteScrollRemix({
  address,
  initialRemixes,
  total,
  isIpOwner = false,
  view = "grid",
}: InfiniteScrollGridProps) {
  const [remixes, setRemixes] = useState<Remix[]>(initialRemixes)
  const [offset, setOffset] = useState(PAGINATION_LIMIT)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialRemixes.length < total)
  const observerTarget = useRef<HTMLDivElement>(null)
  const lastAddressRef = useRef<string>("")
  const scrollPositionRef = useRef<number>(0)
  const isLoadingMoreRef = useRef<boolean>(false)

  // Reset when address actually changes (not just data refresh)
  useEffect(() => {
    const hasAddressChanged = lastAddressRef.current !== "" && lastAddressRef.current !== address

    if (hasAddressChanged) {
      // Address changed - reset everything and scroll to top
      setRemixes(initialRemixes)
      setOffset(PAGINATION_LIMIT)
      setHasMore(initialRemixes.length < total)
      scrollPositionRef.current = 0
      window.scrollTo({ top: 0, behavior: "smooth" })
    } else if (lastAddressRef.current === address && remixes.length > PAGINATION_LIMIT && !isLoadingMoreRef.current) {
      // Data refresh with same address, we have loaded data, and we're NOT in the middle of loading more
      // This means it's an external refresh - preserve state and scroll position
      const preservedRemixes = [...remixes]
      preservedRemixes.splice(0, PAGINATION_LIMIT, ...initialRemixes)
      setRemixes(preservedRemixes)
      setHasMore(preservedRemixes.length < total)

      // Preserve scroll position only if we're not at the top
      if (scrollPositionRef.current > 200) {
        requestAnimationFrame(() => {
          window.scrollTo({ top: scrollPositionRef.current, behavior: "auto" })
        })
      }
    } else if (lastAddressRef.current === "" || remixes.length <= PAGINATION_LIMIT) {
      // First load or we only have initial data
      setRemixes(initialRemixes)
      setOffset(PAGINATION_LIMIT)
      setHasMore(initialRemixes.length < total)
    }

    lastAddressRef.current = address
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRemixes, total, address])

  // Save scroll position periodically, but only when not loading
  useEffect(() => {
    const handleScroll = () => {
      if (!loading && !isLoadingMoreRef.current) {
        scrollPositionRef.current = window.scrollY
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [loading])

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return

    isLoadingMoreRef.current = true
    setLoading(true)
    try {
      const response = await fetchUserRemixes({
        userAddress: address,
        limit: PAGINATION_LIMIT,
        offset,
      })

      if (response.results.length > 0) {
        setRemixes((prev) => [...prev, ...response.results])
        setOffset((prev) => prev + PAGINATION_LIMIT)
        setHasMore(remixes.length + response.results.length < response.total)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error("Failed to load more remixes:", error)
      setHasMore(false)
    } finally {
      setLoading(false)
      // Small delay to ensure loading state is properly reset
      setTimeout(() => {
        isLoadingMoreRef.current = false
      }, 100)
    }
  }, [loading, hasMore, address, offset, remixes.length])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
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
  }, [loadMore])

  if (total === 0) {
    return (
      <div className="flex w-full justify-center py-10">
        <p className="text-neutral-300">No tokens data</p>
      </div>
    )
  }

  const loaderEl = hasMore && (
    <div ref={observerTarget} className="flex justify-center py-8">
      {loading && (
        <div className="text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading more tokens...</span>
        </div>
      )}
    </div>
  )

  if (view === "list") {
    return (
      <div className="w-full">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-neutral-600 bg-black! font-mono">
              <TableHead className="px-0 text-left text-xs text-neutral-300 uppercase">Coin</TableHead>
              <TableHead className="px-0 text-left text-xs text-neutral-300 uppercase">MCap</TableHead>
              <TableHead className="px-0 text-left text-xs text-neutral-300 uppercase">24H %</TableHead>
              <TableHead className="px-0 text-left text-xs text-neutral-300 uppercase">Holders</TableHead>
              <TableHead className="px-0 text-right text-xs text-neutral-300 uppercase">Volume</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {remixes.map((item, index) => (
              <TableRow key={`remix-list-${item.id}-${index}`} className="border-b border-neutral-700/50">
                <TableCell className="px-0! py-2! font-mono">
                  <Link href={`/token/${item.token_address}`} className="flex w-fit cursor-pointer">
                    <div className="flex h-10 items-center gap-2">
                      <Image
                        src={item.image}
                        alt={item.name}
                        className="aspect-square h-8 w-8 rounded-[4px] object-cover"
                        width={32}
                        height={32}
                      />
                      <div className="flex flex-col gap-0.5">
                        <div className="text-sm">{item.name}</div>
                        <div className="text-xs font-medium text-neutral-300 uppercase">${item.symbol}</div>
                      </div>
                    </div>
                  </Link>
                </TableCell>
                <TableCell className="px-0! py-2! font-mono text-sm">
                  ${formatNumberWithSuffix(item.market_cap || 0)}
                </TableCell>
                <TableCell className="px-0! py-2! font-mono text-sm">
                  <span className={cn("flex items-center gap-0.5", item.price_usd_change >= 0 ? "text-green-neon" : "text-pink-neon")}>
                    <span className={item.price_usd_change >= 0 ? "" : "rotate-180"}>
                      <ChevronTriangle />
                    </span>
                    {Math.abs(item.price_usd_change || 0).toFixed(2)}%
                  </span>
                </TableCell>
                <TableCell className="px-0! py-2! font-mono text-sm">
                  {formatNumberWithSuffix(item.number_of_holders || 0)}
                </TableCell>
                <TableCell className="px-0! py-2! text-right font-mono text-sm">
                  ${formatNumberWithSuffix(item.total_volume_usd || item.daily_volume || 0)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {loaderEl}
      </div>
    )
  }

  return (
    <div className="w-full px-2 py-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {remixes.map((item, index) => (
          <RemixGridItemFeatured key={`remix-${item.id}-${index}`} data={item} isIpOwner={isIpOwner} />
        ))}
      </div>
      {loaderEl}
    </div>
  )
}
