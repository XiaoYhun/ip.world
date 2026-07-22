"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchJSONWithAuth } from "@/lib/client/fetcher"
import { Remix } from "@/types/remix"

function useSearchToken(query: string, showTrending = false) {
  const url = query ? `/api/tokens/search?tag=${query}` : showTrending ? `/api/tokens/trending` : null

  const {
    data = [],
    error,
    isLoading,
  } = useQuery({
    queryKey: ["search-token", query, showTrending],
    queryFn: () => fetchJSONWithAuth<Remix[]>(url!),
    enabled: !!url,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 60000,
  })

  return { data, isLoading, isError: !!error }
}

export default useSearchToken
