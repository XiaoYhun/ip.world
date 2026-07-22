"use client"

import { useQuery } from "@tanstack/react-query"

import type { Explore } from "@/types/ip"

const defaultExploreData: Explore = {
  total_remixes: 0,
  total_user_rewards: 0,
  viral_ips: {
    results: [],
    total: 0,
    limit: 0,
    offset: 0,
  },
  top_takes: [],
}

// TODO: fix this fetcher to be client side only
const fetcher = async (url: string): Promise<Explore> => {
  const response = await fetch(url, {
    next: { revalidate: 60 }, // Use Next.js caching instead of no-store
  })

  if (!response.ok) {
    return defaultExploreData
  }

  return (await response.json()) as Explore
}

export default function useExploreData(initialData?: Explore) {
  const { data, error, isLoading, refetch } = useQuery<Explore>({
    queryKey: ["explore"],
    queryFn: () => fetcher("/api/explore"),
    refetchInterval: 120000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    staleTime: 30000,
    initialData: initialData,
    // Remove initialDataUpdatedAt to avoid Date.now() during render
    refetchOnMount: !initialData,
  })

  return {
    data: data ?? initialData ?? defaultExploreData,
    error,
    isLoading: initialData ? false : isLoading,
    mutate: refetch,
  }
}
