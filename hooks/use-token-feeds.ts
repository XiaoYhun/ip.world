import { useInfiniteQuery } from "@tanstack/react-query"
import { getAuthToken } from "@dynamic-labs/sdk-react-core"
import { Feed } from "@/types/feed"
import { FEED_LIMIT, FEED_REFETCH_INTERVAL } from "@/lib/constants"
import { getAPIRootUrl } from "@/lib/utils"

type TokenFeedPage = {
  x_post_list: { results: Feed[]; total: number }
  tiktok_post_list: { results: Feed[]; total: number }
  results?: Feed[]
  total?: number
  has_more?: boolean
  next_cursor?: string
}

/** True when API returns merged featured feed + cursor pagination (not legacy x/tiktok lists). */
function isMergedCursorFeedResponse(data: TokenFeedPage): boolean {
  if (!Array.isArray(data.results)) return false
  return typeof data.has_more === "boolean" || typeof data.next_cursor === "string"
}

export const useTokenFeeds = (
  tokenAddress: string,
  sort_by: string,
  sort_order: string,
  source: string,
  sort_mode?: string,
  ugc?: boolean
) => {
  const wantsMergedFeatured = source === "all" && sort_mode === "featured" && !ugc

  const { data, error, fetchNextPage, hasNextPage, isFetchingNextPage, isFetching, isLoading, isRefetching, refetch } =
    useInfiniteQuery<TokenFeedPage, Error>({
      queryKey: ["token-feeds", tokenAddress, sort_by, sort_order, source, sort_mode, ugc],
      queryFn: async ({ pageParam }) => {
        const sortModeParam = sort_mode ? `&sort_mode=${sort_mode}` : ""
        const ugcParam = ugc ? "&ugc=true" : ""
        const token = getAuthToken()

        let url = `${getAPIRootUrl()}/remixes/${tokenAddress}/feed?limit=${FEED_LIMIT}&sort_by=${sort_by}&sort_order=${sort_order}&source=${source}${ugcParam}${sortModeParam}`

        if (wantsMergedFeatured && typeof pageParam === "string" && pageParam.length > 0) {
          url += `&cursor=${encodeURIComponent(pageParam)}`
        } else {
          const offset = Number(pageParam ?? 0) * FEED_LIMIT
          url += `&offset=${offset}`
        }

        const res = await fetch(url, {
          cache: "no-store",
          headers: token ? { "X-Authorization": `Bearer ${token}` } : {},
        })
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
        const data: TokenFeedPage = await res.json()
        return (
          data ?? {
            x_post_list: { results: [], total: 0 },
            tiktok_post_list: { results: [], total: 0 },
          }
        )
      },
      getNextPageParam: (lastPage, pages) => {
        if (wantsMergedFeatured && isMergedCursorFeedResponse(lastPage)) {
          if (lastPage.has_more && typeof lastPage.next_cursor === "string" && lastPage.next_cursor.length > 0) {
            return lastPage.next_cursor
          }
          return undefined
        }
        if (lastPage.x_post_list?.results && lastPage.x_post_list.results.length === FEED_LIMIT) {
          return pages.length
        }
        if (lastPage.tiktok_post_list?.results && lastPage.tiktok_post_list.results.length === FEED_LIMIT) {
          return pages.length
        }
        return undefined
      },
      initialPageParam: 0 as number | string,
      enabled: !!tokenAddress,
      refetchInterval: FEED_REFETCH_INTERVAL,
    })

  const feeds: Feed[] = []
  if (data) {
    data.pages.forEach((page) => {
      if (wantsMergedFeatured && isMergedCursorFeedResponse(page)) {
        if (page.results!.length) feeds.push(...page.results!)
        return
      }
      if (page.x_post_list?.results?.length) {
        feeds.push(...page.x_post_list.results.map((feed: Feed) => ({ ...feed, type: "x" })))
      }
      if (page.tiktok_post_list?.results?.length) {
        feeds.push(...page.tiktok_post_list.results.map((feed: Feed) => ({ ...feed, type: "tiktok" })))
      }
    })
  }

  const first = data?.pages[0]
  const total = (() => {
    if (!first) return 0
    if (wantsMergedFeatured && isMergedCursorFeedResponse(first)) {
      if (typeof first.total === "number") return first.total
      return first.results?.length ?? 0
    }
    return (first.x_post_list?.total || 0) + (first.tiktok_post_list?.total || 0)
  })()

  const hasMore = hasNextPage
  const isEmpty = !isLoading && !isFetching && feeds.length === 0

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
