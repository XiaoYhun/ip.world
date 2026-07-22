"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchJSONWithAuth } from "@/lib/client/fetcher"
import { Ip } from "@/types/ip"

function useTrendingIps() {
  const {
    data = [],
    error,
    isLoading,
  } = useQuery({
    queryKey: ["trending-ips"],
    queryFn: () => fetchJSONWithAuth<Ip[]>("/api/ips/top-trending"),
    refetchInterval: 120000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 60000,
  })

  return { data, isLoading, isError: !!error }
}

export default useTrendingIps
