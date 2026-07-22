"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchJSONWithAuth } from "@/lib/client/fetcher"
import { Holding } from "@/types/holding"
import { ListResponse } from "@/types/response"
import { getAPIRootUrl } from "@/lib/utils"

function useGetTokenBalances(user_address?: string): {
  data: ListResponse<Holding>
  isLoading: boolean
  isError: boolean
  refetch: () => void
} {
  const { data, error, isLoading, refetch } = useQuery<ListResponse<Holding> | null>({
    queryKey: ["token-balances", user_address],
    queryFn: () =>
      fetchJSONWithAuth<ListResponse<Holding>>(
        `${getAPIRootUrl()}/users/${user_address}/holdings?limit=${9999}&offset=${0}`
      ),
    enabled: !!user_address,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })

  return {
    data: data ?? { results: [], total: 0, limit: 9999, offset: 0 },
    isLoading,
    isError: !!error,
    refetch,
  }
}

export default useGetTokenBalances
