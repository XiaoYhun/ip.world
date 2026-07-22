"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchJSON } from "@/lib/client/fetcher"

type PoolData = {
  data?: {
    attributes?: {
      price_change_percentage?: {
        h24?: string
      }
    }
  }
}

// Skip empty or zero addresses
const isValidAddress = (address: string) => !!address && !/^0x0+$/.test(address)

function usePoolData(poolAddress: string) {
  const { data, error, isLoading } = useQuery<PoolData | null>({
    queryKey: ["pool-data", poolAddress],
    queryFn: () => fetchJSON<PoolData>(`https://api.geckoterminal.com/api/v2/networks/story/pools/${poolAddress}`),
    enabled: isValidAddress(poolAddress),
    refetchInterval: 5000,
    placeholderData: (previousData) => previousData,
  })

  return { data, isLoading, isError: !!error }
}

export default usePoolData
