import { useIsLoggedIn } from "@dynamic-labs/sdk-react-core"
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query"
import { fetchJSONWithAuth } from "@/lib/client/fetcher"
import { REMIX_LIMIT, REMIX_REFETCH_INTERVAL } from "@/lib/constants"
import { ListResponse } from "@/types/response"
import { IpFavorite, TokenFavorite } from "@/types/user"

const isIpFavorite = (favorite: IpFavorite | TokenFavorite): favorite is IpFavorite => {
  return "ip_id" in favorite && "ip" in favorite
}

export const useFavorites = (type: string) => {
  const isAuthenticated = useIsLoggedIn()
  const queryClient = useQueryClient()

  const { data, error, fetchNextPage, hasNextPage, isFetchingNextPage, isFetching, isLoading, isRefetching, refetch } =
    useInfiniteQuery({
      queryKey: ["favourites", type],
      queryFn: () =>
        fetchJSONWithAuth<ListResponse<IpFavorite | TokenFavorite>>(
          `/api/favorites?limit=${99999}&offset=${0}&type=${type}`
        ),
      getNextPageParam: (lastPage, pages) => {
        if (lastPage.results?.length === REMIX_LIMIT) return pages.length
        return undefined
      },
      initialPageParam: 0,
      refetchInterval: REMIX_REFETCH_INTERVAL,
      enabled: isAuthenticated,
    })

  const favorites = data?.pages.flatMap((page) => page.results) ?? []
  const total = data?.pages[0]?.total ?? 0

  // Cache invalidation methods
  const invalidateFavorites = () => {
    queryClient.invalidateQueries({ queryKey: ["favourites", type] })
  }

  const invalidateAllFavorites = () => {
    queryClient.invalidateQueries({ queryKey: ["favourites"] })
  }

  const refetchFavorites = () => {
    return queryClient.refetchQueries({ queryKey: ["favourites", type] })
  }

  return {
    total,
    favorites,
    error,
    hasMore: hasNextPage,
    isLoading,
    isFetching,
    isFetchingNextPage,
    isRefetching,
    isEmpty: total === 0,
    refetch,
    fetchNextPage,
    isIpFavorite,
    invalidateFavorites,
    invalidateAllFavorites,
    refetchFavorites,
  }
}
