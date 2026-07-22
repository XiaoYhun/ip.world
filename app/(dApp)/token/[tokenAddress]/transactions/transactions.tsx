"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import SwapTable from "@/components/swap-table"
import { Remix } from "@/types/remix"
import { useSwaps } from "@/hooks/use-swaps"
import type { SwapRow } from "@/hooks/use-token-swaps"

type TransactionsProps = {
  remix: Remix
  swaps?: SwapRow[]
}

const PREFETCH_PAGES = 2

export const Transactions = ({ remix, swaps: shapeSwaps }: TransactionsProps) => {
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const {
    data: restSwaps,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSwaps(remix.token_address)

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
  }

  // Prefetch a couple of extra pages on mount for instant first scroll
  const prefetchCount = useRef(0)
  useEffect(() => {
    if (prefetchCount.current < PREFETCH_PAGES && hasNextPage && !isFetchingNextPage) {
      prefetchCount.current++
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const hasNextPageRef = useRef(hasNextPage)
  const isFetchingRef = useRef(isFetchingNextPage)

  useEffect(() => {
    hasNextPageRef.current = hasNextPage
    isFetchingRef.current = isFetchingNextPage
  }, [hasNextPage, isFetchingNextPage])

  // Single stable observer — reads state from refs so the observer never
  // re-creates (re-creation immediately re-checks visibility → loading loop).
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasNextPageRef.current &&
          !isFetchingRef.current
        ) {
          fetchNextPage()
        }
      },
      { rootMargin: "600px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [fetchNextPage])

  const mergedSwaps = useMemo(() => {
    const seen = new Map<string, SwapRow>()

    for (const swap of shapeSwaps ?? []) {
      if (swap.transaction) seen.set(swap.transaction, swap)
    }

    for (const swap of restSwaps ?? []) {
      if (swap.transaction && !seen.has(swap.transaction)) {
        seen.set(swap.transaction, swap as unknown as SwapRow)
      }
    }

    const all = Array.from(seen.values())
    all.sort((a, b) => {
      const tA = Number(a.created_at || a.timestamp || 0)
      const tB = Number(b.created_at || b.timestamp || 0)
      return sortOrder === "desc" ? tB - tA : tA - tB
    })
    return all
  }, [shapeSwaps, restSwaps, sortOrder])

  if (mergedSwaps.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <p className="text-neutral-300">No transaction data</p>
      </div>
    )
  }

  return (
    <div className="px-3 pb-4">
      <SwapTable
        swaps={mergedSwaps}
        remix={remix}
        toggleSortOrder={toggleSortOrder}
        sortOrder={sortOrder}
      />
      <div ref={sentinelRef} className="flex justify-center py-4">
        {isFetchingNextPage && (
          <div className="text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs text-neutral-400">Loading transactions...</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default Transactions
