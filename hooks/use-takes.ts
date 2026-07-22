import { useInfiniteQuery } from "@tanstack/react-query"
import { fetchJSONWithAuth } from "@/lib/client/fetcher"
import { ListResponse } from "@/types/response"
import { Take } from "@/types/take"
import { TAKE_LIMIT, TAKE_REFETCH_INTERVAL } from "@/lib/constants"

export const useTakes = (ipId: string, sort_by: string, sort_order: string) => {
  const { data, error, fetchNextPage, hasNextPage, isFetchingNextPage, isFetching, isLoading, isRefetching, refetch } =
    useInfiniteQuery({
      queryKey: ["takes", ipId, sort_by, sort_order],
      queryFn: ({ pageParam = 0 }) => {
        const offset = Number(pageParam) * TAKE_LIMIT
        return fetchJSONWithAuth<ListResponse<Take>>(
          `/api/ips/${ipId}/takes?limit=${TAKE_LIMIT}&offset=${offset}&sort_by=${sort_by}&sort_order=${sort_order}`
        )
      },
      getNextPageParam: (lastPage, pages) => {
        if (lastPage.results?.length === TAKE_LIMIT) return pages.length
        return undefined
      },
      initialPageParam: 0,
      refetchInterval: TAKE_REFETCH_INTERVAL,
    })

  const takes = data?.pages.flatMap((page) => page.results) ?? []
  const total = data?.pages[0]?.total ?? 0

  return {
    total,
    takes,
    error,
    hasMore: hasNextPage,
    isLoading,
    isFetching,
    isFetchingNextPage,
    isRefetching,
    isEmpty: total === 0,
    refetch,
    fetchNextPage,
  }
}
