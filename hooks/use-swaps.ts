"use client"

import { useShape } from "@electric-sql/react"
import { env } from "@/config"
import { Swap } from "@/types/swap"
import { useEffect, useMemo, useState } from "react"
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query"
import { getAPIRootUrl, uniqueBy } from "@/lib/utils"

const getStartTimestamp = () => {
  const now = new Date()
  now.setSeconds(0, 0)
  const minutes = now.getMinutes()
  // Round down to nearest 5 minutes
  now.setMinutes(minutes - (minutes % 5))
  return now.getTime() / 1000
}

const fetchSwaps = async ({ offset, token }: { offset: number; token: string }) => {
  const res = await fetch(`${getAPIRootUrl()}/swaps/${token}?limit=100&offset=${offset}`)
  const data = await res.json()
  return data.results ?? []
}

export function useSwaps(token?: string) {
  const addr = token?.toLowerCase() ?? ""
  const queryClient = useQueryClient()

  const [startTimestamp, setStartTimestamp] = useState<number>(getStartTimestamp())
  const endTimestamp = startTimestamp + 6 * 60
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = useInfiniteQuery({
    queryKey: ["swaps", addr],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchSwaps({ offset: pageParam, token: addr }),
    enabled: !!addr,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.length < 100) return undefined
      return lastPageParam + 100
    },
  })

  const { data: liveSwaps } = useShape<Swap>({
    url: env.NEXT_PUBLIC_METRICS_SYNC_CLOUDFLARE_URL,
    params: {
      table: "swaps",
      where: `(token_0 = \'${addr}\' OR token_1 = \'${addr}\') AND timestamp > \'${startTimestamp.toString()}\' AND timestamp < \'${endTimestamp.toString()}\'`,
    },
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setStartTimestamp(getStartTimestamp())
    }, 10000) // every 10 seconds
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!liveSwaps) return
    if (!queryClient.getQueryData(["swaps", addr])) return

    queryClient.setQueryData(["swaps", addr], (oldData: any) => {
      if (!oldData) return { pages: [], pageParams: [0] }
      const newPage0 = uniqueBy([...(oldData.pages[0] || []), ...liveSwaps], (swap) => swap.transaction).sort(
        (a: any, b: any) => b.timestamp - a.timestamp
      )
      return {
        ...oldData,
        pages: [newPage0, ...oldData.pages.slice(1)],
      }
    })
  }, [liveSwaps, queryClient, addr])

  const allSwaps = useMemo(() => uniqueBy(data?.pages.flat() || [], (swap: Swap) => swap.transaction), [data])
  return {
    data: allSwaps,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  }
}
