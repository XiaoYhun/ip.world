"use client"

import { useQuery } from "@tanstack/react-query"

type PriceResponse = { price: number }

export default function useGetSolPrice() {
  const { data, isLoading, isError, refetch } = useQuery<PriceResponse>({
    queryKey: ["sol-price"],
    queryFn: async () => {
      const res = await fetch("/api/prices/sol", { cache: "no-store" })
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
      return res.json()
    },
    refetchInterval: 25_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    staleTime: 1000,
  })

  return {
    data: data?.price ?? 0,
    isLoading,
    isError,
    mutate: refetch,
  }
}
