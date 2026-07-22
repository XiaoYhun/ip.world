import { useQuery } from "@tanstack/react-query"
import { getAPIRootUrl } from "@/lib/utils"
import { Feed } from "@/types/feed"

/**
 * Lightweight hook that fetches the 3 most recent feed thumbnails for a token.
 * Used for the UGC "earn from posting" card art.
 */
export function useFeedThumbnails(tokenAddress: string, limit = 3) {
  const { data } = useQuery({
    queryKey: ["feed-thumbnails", tokenAddress],
    queryFn: async () => {
      const res = await fetch(
        `${getAPIRootUrl()}/remixes/${tokenAddress}/feed?limit=${limit}&offset=0&sort_by=created_at&sort_order=asc&source=all`
      )
      if (!res.ok) return []
      const json = await res.json()
      const feeds: Feed[] = []
      if (json.tiktok_post_list?.results) feeds.push(...json.tiktok_post_list.results)
      if (json.x_post_list?.results) feeds.push(...json.x_post_list.results)
      // Already fetched oldest-first from API; just take first `limit`
      feeds.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      return feeds.slice(0, limit)
    },
    enabled: !!tokenAddress,
    staleTime: 60_000,
  })

  // Extract thumbnail URLs: TikTok has dynamic_cover_url, X has media.images
  const thumbnails: string[] = (data ?? [])
    .map((feed) => {
      if (feed.dynamic_cover_url) return feed.dynamic_cover_url
      if (feed.media?.images?.[0]) return feed.media.images[0]
      if (feed.author_avatar) return feed.author_avatar
      return null
    })
    .filter((url): url is string => !!url)

  return thumbnails
}
