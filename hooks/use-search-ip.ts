"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchJSONWithAuth } from "@/lib/client/fetcher"
import { Ip } from "@/types/ip"
import { getAPIRootUrl } from "@/lib/utils"

function useSearchIp(query: string, showTrending = false) {
  const url = `${getAPIRootUrl()}/ips?${showTrending && `sort_by=feature_score&sort_order=desc`}${query ? `&query=${query}` : ""}&limit=10`
  const {
    data = [],
    error,
    isLoading,
  } = useQuery({
    queryKey: ["search-ip", query, showTrending],
    queryFn: async () => {
      const res = await fetchJSONWithAuth<{ results?: Ip[] }>(url!)
      return res.results ?? []
    },
    enabled: !!url,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 60000,
  })

  return { data, isLoading, isError: !!error }
}

export default useSearchIp
