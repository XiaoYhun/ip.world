"use client"

import Link from "next/link"
import Image from "@/components/image"
import defaultUserImage from "@/public/images/default-user.png"
import EmptyState from "@/components/ui/empty-state"
import Spinner from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { isWalletAddress, truncateAddress } from "@/lib/strings"
import { formatNumberWithSuffix, formatCompactUSD } from "@/lib/number"
import { PAGINATION_LIMIT } from "@/lib/constants"
import { useCallback, useEffect, useRef, useState } from "react"
import { useInView } from "react-intersection-observer"
import { fetchUGCLeaderboard, UGCLeaderboardEntry } from "../actions"

interface UGCTableProps {
  initialLeaderboard: any[]
  initialTotal: number
}

const formatUsername = (username: string | null | undefined, fallbackAddress?: string): string => {
  if (!username) {
    return fallbackAddress ? truncateAddress(fallbackAddress, 10, 8) : "Unknown"
  }
  if (isWalletAddress(username)) {
    return truncateAddress(username, 10, 8)
  }
  return `@${username}`
}

export default function UGCTable({ initialLeaderboard, initialTotal }: UGCTableProps) {
  const [items, setItems] = useState<UGCLeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const offsetRef = useRef(0)

  // Initial load from UGC endpoint
  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const res = await fetchUGCLeaderboard({ limit: PAGINATION_LIMIT, offset: 0 })
        const newItems = res.items ?? []
        setItems(newItems)
        offsetRef.current = newItems.length
        setHasMore(newItems.length >= PAGINATION_LIMIT)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return
    setIsLoading(true)
    try {
      const res = await fetchUGCLeaderboard({ limit: PAGINATION_LIMIT, offset: offsetRef.current })
      const newItems = res.items ?? []
      if (newItems.length > 0) {
        setItems((prev) => [...prev, ...newItems])
        offsetRef.current += newItems.length
        setHasMore(newItems.length >= PAGINATION_LIMIT)
      } else {
        setHasMore(false)
      }
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, hasMore])

  const { ref: sentinelRef, inView } = useInView({ threshold: 0, rootMargin: "100px" })

  useEffect(() => {
    if (inView && !isLoading) loadMore()
  }, [inView, loadMore, isLoading])

  if (items.length === 0 && !isLoading) {
    return <EmptyState />
  }

  const renderItem = (entry: UGCLeaderboardEntry) => (
    <>
      <TableCell className="text-sm !py-4 !pl-0 font-mono text-neutral-300">
        {entry.rank}&nbsp;
        {entry.rank === 1 && "🏆"}
        {entry.rank === 2 && "🥈"}
        {entry.rank === 3 && "🥉"}
      </TableCell>
      <TableCell className="!py-4 overflow-hidden">
        <Link href={`/@${entry.username || entry.creator_id}`}>
          <div className="flex h-9 min-w-0 items-center justify-start gap-2">
            <Image
              src={entry.avatar_url || defaultUserImage}
              alt={"user-image"}
              variant="avatar"
              className="aspect-square h-8 w-8 rounded-full object-cover"
              width={32}
              height={32}
            />
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex items-center gap-2 text-sm">
                <div className="truncate text-white">
                  {formatUsername(entry.username || entry.display_name, entry.creator_id)}
                </div>
              </div>
              <div className="hidden font-mono text-sm font-medium text-neutral-300 sm:block">
                {truncateAddress(entry.creator_id)}
              </div>
            </div>
          </div>
        </Link>
      </TableCell>
      <TableCell className="text-sm !py-4 font-mono">${formatCompactUSD(entry.ugc_earnings_usd)}</TableCell>
      <TableCell className="text-sm !py-4 font-mono">{formatNumberWithSuffix(entry.impressions)}</TableCell>
      <TableCell className="text-sm hidden !py-4 font-mono sm:table-cell">{entry.post_count}</TableCell>
      <TableCell className="text-sm hidden !py-4 font-mono lg:table-cell">
        {entry.joined_at
          ? new Date(entry.joined_at).toLocaleDateString("en-US", { month: "2-digit", year: "2-digit" })
          : "—"}
      </TableCell>
      <TableCell className="text-sm hidden !py-4 sm:table-cell">{entry.referral_count}</TableCell>
    </>
  )

  const headerRow = (
    <TableRow className="font-mono">
      <TableHead className="!pl-0 w-[5%] text-left text-xs text-neutral-300 uppercase">RANK</TableHead>
      <TableHead className="w-[30%] max-w-[280px] text-left text-xs text-neutral-300 uppercase">USER</TableHead>
      <TableHead className="w-[12%] text-left text-xs text-neutral-300 uppercase">
        <span className="sm:hidden">EARNINGS</span>
        <span className="hidden sm:inline">EARNINGS</span>
      </TableHead>
      <TableHead className="w-[12%] text-left text-xs text-neutral-300 uppercase">VIEWS</TableHead>
      <TableHead className="hidden w-[12%] text-left text-xs text-neutral-300 uppercase sm:table-cell">POSTS</TableHead>
      <TableHead className="hidden w-[10%] text-left text-xs text-neutral-300 uppercase lg:table-cell">JOINED</TableHead>
      <TableHead className="hidden w-[10%] text-left text-xs text-neutral-300 uppercase sm:table-cell">REFS</TableHead>
    </TableRow>
  )

  return (
    <div className="overflow-x-auto">
      <Table className="table-fixed">
        <TableHeader>{headerRow}</TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={`${item.creator_id}-${index}`}>{renderItem(item)}</TableRow>
          ))}
        </TableBody>
      </Table>
      {(hasMore || isLoading) && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          {isLoading && (
            <div className="text-muted-foreground flex items-center gap-2">
              <Spinner size={20} />
              <span>Loading more users...</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
