"use client"

import { useQuery } from "@tanstack/react-query"
import { Leaderboard } from "@/types/leaderboard"
import { ListResponse } from "@/types/response"

function useSearchUsers(query: string) {
  const { data, error, isLoading } = useQuery({
    queryKey: ["search-users", query],
    queryFn: async () => {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&limit=10`)
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
      return res.json() as Promise<ListResponse<Leaderboard>>
    },
    enabled: query.length > 0,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })

  return {
    data: data?.results ?? [],
    isLoading,
    isError: !!error,
  }
}

export default useSearchUsers
