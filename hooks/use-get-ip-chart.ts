"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { fetchJSONWithAuth } from "@/lib/client/fetcher"

function useGetIPChartData(
  id?: string,
  metrics?: string,
  initialTimeRange = "7d"
): {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
  isLoading: boolean
  isError: boolean
  currentTimeRange: string
  setTimeRange: (range: string) => void
} {
  const [timeRange, setTimeRange] = useState<string>(initialTimeRange)

  const queryParams = new URLSearchParams()
  if (metrics) queryParams.append("metrics", metrics)

  if (timeRange !== "all") queryParams.append("time_range", timeRange) // Always include time_range

  const queryString = queryParams.toString()
  const url = `/api/ips/${id}/chart-data${queryString ? `?${queryString}` : ""}`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error, isLoading } = useQuery<any>({
    queryKey: ["ip-chart-data", id, metrics, timeRange],
    queryFn: () => fetchJSONWithAuth(url),
    enabled: !!id,
    refetchInterval: 10000,
  })

  return {
    data,
    isLoading,
    isError: !!error,
    currentTimeRange: timeRange,
    setTimeRange,
  }
}

export default useGetIPChartData
