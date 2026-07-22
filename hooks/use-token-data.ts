"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchJSON } from "@/lib/client/fetcher"

function useTokenData(tokenAddress: string) {
  const { data, error, isLoading } = useQuery({
    queryKey: ["token-data", tokenAddress],
    queryFn: () => fetchJSON(`https://api.geckoterminal.com/api/v2/networks/story/tokens/${tokenAddress}`),
    enabled: !!tokenAddress,
    refetchInterval: () => (document.hidden ? false : 120000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    staleTime: 60000,
    placeholderData: (previousData) => previousData,
  })

  return { data, isLoading, isError: !!error }
}

export default useTokenData
