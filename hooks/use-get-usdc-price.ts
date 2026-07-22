"use client"

import { useQuery } from "@tanstack/react-query"

type PriceResponse = { price: number }

const USDC_FALLBACK_PRICE = 1

export default function useGetUsdcPrice() {
  const { data, isLoading, isError, refetch } = useQuery<PriceResponse>({
    queryKey: ["usdc-price"],
    queryFn: async () => {
      const res = await fetch("/api/prices/usdc", { cache: "no-store" })
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
      return res.json()
    },
    refetchInterval: 120_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    staleTime: 60_000,
  })

  return {
    data: data?.price ?? USDC_FALLBACK_PRICE,
    isLoading,
    isError,
    mutate: refetch,
  }
}
