import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { fetchJSONWithAuth } from "@/lib/client/fetcher"
import { REMIX_LIMIT, REMIX_REFETCH_INTERVAL } from "@/lib/constants"
import { Remix } from "@/types/remix"
import { ListResponse } from "@/types/response"

export const useRemixes = (ipId: string, sort_by: string, sort_order: string) => {
  const { data, error, fetchNextPage, hasNextPage, isFetchingNextPage, isFetching, isLoading, isRefetching, refetch } =
    useInfiniteQuery({
      queryKey: ["remixes", ipId, sort_by, sort_order],
      queryFn: ({ pageParam = 0 }) => {
        const offset = Number(pageParam) * REMIX_LIMIT
        return fetchJSONWithAuth<ListResponse<Remix>>(
          `/api/remixes?limit=${REMIX_LIMIT}&offset=${offset}&sort_by=${sort_by}&sort_order=${sort_order}&ip_id=${ipId}`
        )
      },
      getNextPageParam: (lastPage, pages) => {
        if (lastPage.results?.length === REMIX_LIMIT) return pages.length
        return undefined
      },
      initialPageParam: 0,
      refetchInterval: REMIX_REFETCH_INTERVAL,
    })

  const remixes = data?.pages.flatMap((page) => page.results) ?? []
  const total = data?.pages[0]?.total ?? 0

  return {
    total,
    remixes,
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

export const useAllRemixes = (ipId: string, sort_by: string, sort_order: string, limit?: number) => {
  const { data, error, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["all-remixes", ipId, sort_by, sort_order],
    queryFn: () =>
      fetchJSONWithAuth<ListResponse<Remix>>(
        `/api/remixes?limit=${limit || 100}&offset=${0}&sort_by=${sort_by}&sort_order=${sort_order}&ip_id=${ipId}`
      ),
    refetchInterval: REMIX_REFETCH_INTERVAL,
  })

  return {
    total: data?.total ?? 0,
    remixes: data?.results ?? [],
    error,
    isLoading,
    isRefetching,
    isEmpty: (data?.total ?? 0) === 0,
    refetch,
  }
}
