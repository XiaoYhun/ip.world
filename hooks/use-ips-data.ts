"use client"

import { useQuery, useQueryClient, useInfiniteQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import type { Ip } from "@/types/ip"
import type { ListResponse } from "@/types/response"
import { PAGINATION_LIMIT } from "@/lib/constants"

interface UseGetIpsParams {
  query?: string
  sort: string
  sort_order: string
  limit: number
  offset: number
  licensed?: boolean
  community?: boolean
  verified?: boolean
  socials?: boolean
  claimed?: boolean
  category?: string
  type?: string
  initialData?: ListResponse<Ip>
}

interface UseInfiniteIpsParams extends Omit<UseGetIpsParams, "limit" | "offset" | "initialData"> {
  limit?: number
  initialData?: Ip[]
  initialTotal?: number
}

// Query key factory for better cache management and type safety
const ipsQueryKeys = {
  all: ["ips"] as const,
  lists: () => [...ipsQueryKeys.all, "list"] as const,
  list: (params: Omit<UseGetIpsParams, "initialData">) => [...ipsQueryKeys.lists(), params] as const,
  infinite: (params: Omit<UseInfiniteIpsParams, "initialData">) => [...ipsQueryKeys.all, "infinite", params] as const,
}

// Optimized fetcher with better error handling
const fetchIps = async (url: string): Promise<ListResponse<Ip>> => {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    // Throw error for proper TanStack Query error handling
    throw new Error(`Failed to fetch IPs: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as ListResponse<Ip>

  // Validate response structure
  if (!data || typeof data !== "object") {
    throw new Error("Invalid response format")
  }

  return {
    results: data.results || [],
    total: data.total || 0,
    limit: data.limit || 0,
    offset: data.offset || 0,
  }
}

// Build URL helper
const buildIpsUrl = (params: Omit<UseGetIpsParams, "initialData">): string => {
  const { query, sort, sort_order, limit, offset, licensed, community, verified, socials, claimed, category, type } =
    params

  // Use search endpoint only if there's a non-empty query
  const hasQuery = query && query.trim().length > 0
  const baseUrl = hasQuery ? `/api/ips/search?tag=${encodeURIComponent(query.trim())}&` : "/api/ips?"

  const searchParams = new URLSearchParams({
    sort_by: sort,
    sort_order: sort_order,
    limit: limit.toString(),
    offset: offset.toString(),
  })

  if (category) searchParams.set("category", category)
  if (licensed) searchParams.set("is_licensed", "true")
  if (community) searchParams.set("is_licensed", "false")
  if (verified) searchParams.set("is_verified", "true")
  if (socials) searchParams.set("has_socials_attached", "true")
  if (claimed) searchParams.set("is_claimed", "true")
  if (type) searchParams.set("type", type)
  return `${baseUrl}${searchParams.toString()}`
}

export default function useGetIps(params: UseGetIpsParams): {
  data: ListResponse<Ip>
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
  isFetching: boolean
  isStale: boolean
} {
  const queryClient = useQueryClient()

  const queryParams = useMemo(() => {
    const { initialData, ...rest } = params
    return rest
  }, [params])

  const url = useMemo(() => buildIpsUrl(queryParams), [queryParams])

  const { data, error, isLoading, refetch, isFetching, isStale } = useQuery<ListResponse<Ip>, Error>({
    queryKey: ipsQueryKeys.list(queryParams),
    queryFn: () => fetchIps(url),

    staleTime: 1000 * 30, // 30 seconds - shorter for landing page freshness
    gcTime: 1000 * 60 * 5, // 5 minutes - shorter cache time to prevent stale errors

    retry: (failureCount, error) => {
      // Don't retry on final attempt
      if (failureCount >= 3) return false

      const errorMessage = error.message.toLowerCase()

      // Don't retry on specific 4xx client errors (except timeout and rate limit)
      if (
        errorMessage.includes("400") ||
        errorMessage.includes("401") ||
        errorMessage.includes("403") ||
        errorMessage.includes("404") ||
        errorMessage.includes("410")
      ) {
        return false
      }

      // DO retry on timeout, rate limit, and server errors
      if (
        errorMessage.includes("408") || // Request timeout
        errorMessage.includes("429") || // Rate limit
        errorMessage.includes("5") || // 5xx server errors
        errorMessage.includes("timeout") ||
        errorMessage.includes("network") ||
        errorMessage.includes("fetch")
      ) {
        return true
      }

      // Default to not retry for unknown errors to prevent infinite loops
      return false
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff

    initialData: params.initialData,
    // Remove initialDataUpdatedAt to avoid Date.now() during render

    refetchOnMount: params.initialData ? false : true, // no refetch on mount if initial data is provided
    refetchOnWindowFocus: false, // Don't refetch on window focus to reduce requests
    refetchOnReconnect: true,
    refetchInterval: false, // no automatic refetching

    networkMode: "online",

    meta: {
      errorMessage: "Failed to fetch IPs data",
    },
  })

  const shouldPrefetchNext = useMemo(() => {
    if (!data) return false
    const hasMoreData = data.total > queryParams.offset + queryParams.limit
    return hasMoreData && data.results.length === queryParams.limit
  }, [data, queryParams.offset, queryParams.limit])

  useMemo(() => {
    if (shouldPrefetchNext) {
      const nextParams = {
        ...queryParams,
        offset: queryParams.offset + queryParams.limit,
      }
      const nextUrl = buildIpsUrl(nextParams)

      queryClient.prefetchQuery({
        queryKey: ipsQueryKeys.list(nextParams),
        queryFn: () => fetchIps(nextUrl),
        staleTime: 1000 * 60 * 2,
      })
    }
  }, [shouldPrefetchNext, queryParams, queryClient])

  return {
    data: data ?? {
      results: [],
      total: 0,
      limit: 0,
      offset: 0,
    },
    isLoading: params.initialData ? false : isLoading,
    isError: !!error,
    error: error || null,
    refetch,
    isFetching,
    isStale,
  }
}

export function useInfiniteIps(params: UseInfiniteIpsParams): {
  data: Ip[]
  total: number
  isLoading: boolean
  isError: boolean
  error: Error | null
  fetchNextPage: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  isFetching: boolean
  refetch: () => void
} {
  const limit = params.limit || PAGINATION_LIMIT
  const { initialData, initialTotal, ...restParams } = params

  const queryParams = useMemo(
    () => ({
      ...restParams,
      limit,
    }),
    [restParams, limit]
  )

  // If provided, create initial data for TanStack useInfiniteQuery
  const initialInfiniteData = useMemo(() => {
    if (!initialData || initialData.length === 0) return undefined

    return {
      pages: [
        {
          results: initialData,
          total: initialTotal || initialData.length,
          limit: limit,
          offset: 0,
        },
      ],
      pageParams: [0],
    }
  }, [initialData, initialTotal, limit])

  const { data, error, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, isFetching, refetch } =
    useInfiniteQuery<ListResponse<Ip>, Error>({
      queryKey: ipsQueryKeys.infinite(queryParams),
      queryFn: async ({ pageParam = 0 }) => {
        const offset = Number(pageParam) * limit
        const url = buildIpsUrl({ ...queryParams, offset })
        return fetchIps(url)
      },
      getNextPageParam: (lastPage, pages) => {
        const totalFetched = pages.length * limit
        return totalFetched < lastPage.total ? pages.length : undefined
      },
      initialPageParam: 0,

      initialData: initialInfiniteData,
      // Remove initialDataUpdatedAt to avoid Date.now() during render

      staleTime: 1000 * 30, // 30 seconds - shorter for landing page freshness
      gcTime: 1000 * 60 * 5, // 5 minutes - shorter cache time to prevent stale errors

      refetchOnWindowFocus: false, // Don't refetch on window focus to reduce requests
      refetchOnMount: !initialInfiniteData, // don't refetch on mount if we have initial data
      refetchOnReconnect: true,

      retry: (failureCount, error) => {
        // Don't retry on final attempt
        if (failureCount >= 3) return false

        const errorMessage = error.message.toLowerCase()

        // Don't retry on specific 4xx client errors (except timeout and rate limit)
        if (
          errorMessage.includes("400") ||
          errorMessage.includes("401") ||
          errorMessage.includes("403") ||
          errorMessage.includes("404") ||
          errorMessage.includes("410")
        ) {
          return false
        }

        // DO retry on timeout, rate limit, and server errors
        if (
          errorMessage.includes("408") || // Request timeout
          errorMessage.includes("429") || // Rate limit
          errorMessage.includes("5") || // 5xx server errors
          errorMessage.includes("timeout") ||
          errorMessage.includes("network") ||
          errorMessage.includes("fetch")
        ) {
          return true
        }

        // Default to not retry for unknown errors to prevent infinite loops
        return false
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      networkMode: "online",

      meta: {
        errorMessage: "Failed to fetch infinite IPs data",
      },
    })

  const ips = useMemo(() => data?.pages.flatMap((page) => page.results || []) || [], [data])

  const total = data?.pages[0]?.total || initialTotal || 0

  return {
    data: ips,
    total,
    isLoading: initialInfiniteData ? false : isLoading, // don't show loading if we have initial data
    isError: !!error,
    error: error || null,
    fetchNextPage,
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    isFetching,
    refetch,
  }
}

export const ipsQueryUtils = {
  // Invalidate all IPs queries
  invalidateAll: (queryClient: ReturnType<typeof useQueryClient>) => {
    return queryClient.invalidateQueries({ queryKey: ipsQueryKeys.all })
  },

  // Invalidate specific IPs list
  invalidateList: (queryClient: ReturnType<typeof useQueryClient>, params: Omit<UseGetIpsParams, "initialData">) => {
    return queryClient.invalidateQueries({ queryKey: ipsQueryKeys.list(params) })
  },

  // Prefetch IPs data
  prefetch: (queryClient: ReturnType<typeof useQueryClient>, params: UseGetIpsParams) => {
    const { initialData, ...queryParams } = params
    const url = buildIpsUrl(queryParams)

    return queryClient.prefetchQuery({
      queryKey: ipsQueryKeys.list(queryParams),
      queryFn: () => fetchIps(url),
      staleTime: 1000 * 60 * 2,
    })
  },

  // Set query data manually (useful for optimistic updates)
  setData: (
    queryClient: ReturnType<typeof useQueryClient>,
    params: Omit<UseGetIpsParams, "initialData">,
    data: ListResponse<Ip>
  ) => {
    queryClient.setQueryData(ipsQueryKeys.list(params), data)
  },

  // Get cached data
  getData: (queryClient: ReturnType<typeof useQueryClient>, params: Omit<UseGetIpsParams, "initialData">) => {
    return queryClient.getQueryData<ListResponse<Ip>>(ipsQueryKeys.list(params))
  },
}
