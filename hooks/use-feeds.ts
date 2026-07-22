import { useInfiniteQuery } from "@tanstack/react-query"
import { fetchJSONWithAuth } from "@/lib/client/fetcher"
import { Feed } from "@/types/feed"
import { FEED_LIMIT, FEED_REFETCH_INTERVAL } from "@/lib/constants"

export const useFeeds = (ipId: string, sort_by: string, sort_order: string, source: string) => {
  const { data, error, fetchNextPage, hasNextPage, isFetchingNextPage, isFetching, isLoading, isRefetching, refetch } =
    useInfiniteQuery<
      { x_post_list: { results: Feed[]; total: number }; tiktok_post_list: { results: Feed[]; total: number } },
      Error
    >({
      queryKey: ["feeds", ipId, sort_by, sort_order, source],
      queryFn: async ({ pageParam = 0 }) => {
        const offset = Number(pageParam) * FEED_LIMIT
        type FeedResponse = {
          x_post_list: { results: Feed[]; total: number }
          tiktok_post_list: { results: Feed[]; total: number }
        }
        const data = await fetchJSONWithAuth<FeedResponse>(
          `/api/ips/${ipId}/feed?limit=${FEED_LIMIT}&offset=${offset}&sort_by=${sort_by}&sort_order=${sort_order}&source=${source}`
        )
        return data ?? { x_post_list: { results: [], total: 0 }, tiktok_post_list: { results: [], total: 0 } }
      },
      getNextPageParam: (lastPage, pages) => {
        if (
          lastPage.x_post_list &&
          lastPage.x_post_list.results &&
          lastPage.x_post_list.results.length === FEED_LIMIT
        ) {
          return pages.length
        }
        if (
          lastPage.tiktok_post_list &&
          lastPage.tiktok_post_list.results &&
          lastPage.tiktok_post_list.results.length === FEED_LIMIT
        ) {
          return pages.length
        }
        return undefined
      },
      initialPageParam: 0,
      refetchInterval: FEED_REFETCH_INTERVAL,
    })

  const feeds: Feed[] = []
  if (data) {
    data.pages.forEach((page) => {
      const pageFeeds: Feed[] = []

      if (page.x_post_list && page.x_post_list.results) {
        pageFeeds.push(...page.x_post_list.results.map((feed: Feed) => ({ ...feed, type: "x" })))
      }
      if (page.tiktok_post_list && page.tiktok_post_list.results) {
        pageFeeds.push(...page.tiktok_post_list.results.map((feed: Feed) => ({ ...feed, type: "tiktok" })))
      }

      pageFeeds.sort((a, b) => {
        if (a.created_at && b.created_at) {
          if (sort_order === "asc") {
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          } else {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          }
        }
        return 0
      })

      feeds.push(...pageFeeds)
    })
  }

  const total = (data?.pages[0]?.x_post_list.total || 0) + (data?.pages[0]?.tiktok_post_list.total || 0)
  const hasMore = hasNextPage
  const isEmpty = total === 0

  return {
    total,
    feeds,
    error,
    hasMore,
    isLoading,
    isFetching,
    isFetchingNextPage,
    isRefetching,
    isEmpty,
    fetchNextPage,
    refetch,
  }
}
