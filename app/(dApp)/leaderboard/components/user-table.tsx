"use client"

import Link from "next/link"
import Image from "@/components/image"
import defaultUserImage from "@/public/images/default-user.png"
import EmptyState from "@/components/ui/empty-state"
import Spinner from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { isWalletAddress, truncateAddress } from "@/lib/strings"
import { Leaderboard } from "@/types/leaderboard"
import { formatCompactUSD, formatNumberWithSuffix } from "@/lib/number"
import { PAGINATION_LIMIT } from "@/lib/constants"
import { useCallback, useEffect, useRef, useState } from "react"
import { useInView } from "react-intersection-observer"
import { fetchLeaderboard } from "../actions"

interface UserTableProps {
  initialLeaderboard: Leaderboard[]
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

export default function UserTable({ initialLeaderboard, initialTotal }: UserTableProps) {
  const [items, setItems] = useState<Leaderboard[]>(initialLeaderboard)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialLeaderboard.length < initialTotal)
  const offsetRef = useRef(initialLeaderboard.length)

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return
    setIsLoading(true)
    try {
      const res = await fetchLeaderboard({ query: "", limit: PAGINATION_LIMIT, offset: offsetRef.current })
      const newItems = res.results ?? []
      if (newItems.length > 0) {
        setItems((prev) => [...prev, ...newItems])
        offsetRef.current += newItems.length
        setHasMore(offsetRef.current < (res.total ?? 0))
      } else {
        setHasMore(false)
      }
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, hasMore])

  const { ref: sentinelRef, inView } = useInView({ threshold: 0, rootMargin: "100px" })

  useEffect(() => {
    if (inView) loadMore()
  }, [inView, loadMore])

  if (items.length === 0 && !isLoading) {
    return <EmptyState />
  }

  const renderItem = (leaderboardData: Leaderboard) => (
    <>
      <TableCell className="text-sm !py-4 !pl-0 font-mono text-neutral-300">
        {leaderboardData.rank}&nbsp;
        {leaderboardData.rank === 1 && "🏆"}
        {leaderboardData.rank === 2 && "🥈"}
        {leaderboardData.rank === 3 && "🥉"}
      </TableCell>
      <TableCell className="!py-4 overflow-hidden">
        <Link href={`/@${leaderboardData.username || leaderboardData.wallet_address}`}>
          <div className="flex h-9 min-w-0 items-center justify-start gap-2">
            <Image
              src={leaderboardData.avatar_url || defaultUserImage}
              alt={"user-image"}
              variant="avatar"
              className="aspect-square h-8 w-8 rounded-full object-cover"
              width={32}
              height={32}
            />
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex items-center gap-2 text-sm">
                <div className="truncate text-white">
                  {formatUsername(
                    leaderboardData.username || leaderboardData.display_name,
                    leaderboardData.wallet_address
                  )}
                </div>
              </div>
              <div className="hidden font-mono text-sm font-medium text-neutral-300 sm:block">
                {truncateAddress(leaderboardData.wallet_address)}
              </div>
            </div>
          </div>
        </Link>
      </TableCell>
      <TableCell className="text-sm !py-4 font-mono">{formatNumberWithSuffix(leaderboardData.total_points)}</TableCell>
      <TableCell className="text-sm !py-4 font-mono">${formatCompactUSD(leaderboardData.trading_volume ?? 0)}</TableCell>
      <TableCell className="text-sm hidden !py-4 font-mono sm:table-cell">
        {formatNumberWithSuffix(leaderboardData.trading_points)}
      </TableCell>
      <TableCell className="text-sm hidden !py-4 font-mono lg:table-cell">
        {leaderboardData.joined_at
          ? new Date(leaderboardData.joined_at).toLocaleDateString("en-US", { month: "2-digit", year: "2-digit" })
          : "—"}
      </TableCell>
      <TableCell className="text-sm hidden !py-4 sm:table-cell">{leaderboardData.referral_amount}</TableCell>
    </>
  )

  const headerRow = (
    <TableRow className="font-mono">
      <TableHead className="!pl-0 w-[5%] text-left text-xs text-neutral-300 uppercase">RANK</TableHead>
      <TableHead className="w-[30%] max-w-[280px] text-left text-xs text-neutral-300 uppercase">USER</TableHead>
      <TableHead className="w-[12%] text-left text-xs text-neutral-300 uppercase">
        <span className="sm:hidden">PTS</span>
        <span className="hidden sm:inline">TOTAL PTS</span>
      </TableHead>
      <TableHead className="w-[12%] text-left text-xs text-neutral-300 uppercase">
        <span className="sm:hidden">VOL</span>
        <span className="hidden sm:inline">VOLUME</span>
      </TableHead>
      <TableHead className="hidden w-[12%] text-left text-xs text-neutral-300 uppercase sm:table-cell">TRADING PTS</TableHead>
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
            <TableRow key={`${item.wallet_address}-${index}`}>{renderItem(item)}</TableRow>
          ))}
        </TableBody>
      </Table>
      {hasMore && (
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
