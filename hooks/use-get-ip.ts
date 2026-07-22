"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchWithRetry } from "@/lib/retry-utils"
import type { Ip } from "@/types/ip"
import { getAPIRootUrl } from "@/lib/utils"

const fetchIp = async (id: string): Promise<Ip | null> => {
  try {
    const response = await fetchWithRetry(`${getAPIRootUrl()}/ips/${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
    })

    const data = (await response.json()) as Ip
    return data || null
  } catch (error) {
    // If it's a 4xx error, return null (IP not found)
    if (error instanceof Error && error.message.includes("4")) {
      return null
    }
    // Re-throw other errors for retry handling
    throw error
  }
}

export default function useGetIp(
  id: string,
  initialData: Ip
): {
  data: Ip
  error: Error | null
  isLoading: boolean
  mutate: () => void
} {
  const shouldFetch = !!id

  const { data, error, isLoading, refetch } = useQuery<Ip | null, Error>({
    queryKey: ["ip", id],
    queryFn: () => fetchIp(id),
    enabled: shouldFetch,
    // Retry configuration matching existing patterns
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (IP not found)
      if (error.message.includes("4")) return false
      // Retry up to 3 times for other errors
      return failureCount < 3
    },
    refetchInterval: 30000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    initialData: initialData,
    networkMode: "online",
    meta: {
      errorMessage: "Failed to fetch IP data",
    },
  })

  return {
    data: data ?? initialData,
    error,
    isLoading: shouldFetch ? isLoading : false,
    mutate: refetch,
  }
}
