"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchJSONWithAuth } from "@/lib/client/fetcher"

export type PriceResponse = {
  price: number
}

function useGetPrice() {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["ip-price"],
    queryFn: () => fetchJSONWithAuth<PriceResponse>("/api/prices/ip"),
    refetchInterval: 25000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    staleTime: 1000,
  })

  return {
    data: data?.price ?? 0,
    isLoading,
    isError: !!error,
    mutate: refetch,
  }
}

export default useGetPrice
