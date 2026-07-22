"use client"

import { useQuery } from "@tanstack/react-query"
import { getAuthToken } from "@/lib/dynamic"
import { getAPIRootUrl } from "@/lib/utils"
import { TikTokVerificationResponse, TikTokVerificationStatus } from "@/types/tiktok-verification"

export const useTikTokVerificationStatus = () => {
  const { data, error, isLoading, refetch } = useQuery<TikTokVerificationStatus>({
    queryKey: ["tiktok-verification-status"],
    queryFn: async () => {
      const token = getAuthToken()
      const res = await fetch(`${getAPIRootUrl()}/tiktok-verification/status`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      if (!res.ok) {
        if (res.status === 404) {
          return { has_verification: false, can_retry: true }
        }
        throw new Error("Failed to fetch TikTok verification status")
      }

      const verification: TikTokVerificationResponse = await res.json()

      // Check if user can retry (if rejected and more than 24h have passed)
      const canRetry =
        verification.verified === "rejected" &&
        new Date().getTime() - new Date(verification.updated_at).getTime() > 24 * 60 * 60 * 1000

      return {
        has_verification: true,
        verification,
        can_retry: canRetry,
      }
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 1, // Only retry once on failure
    refetchInterval: (query) => {
      // Only poll if verification is pending
      const queryData = query.state.data
      return queryData?.verification?.verified === "pending" ? 30000 : false
    },
    refetchOnWindowFocus: false, // Don't refetch on window focus to reduce requests
  })

  // let testData = data
  // if (testData && testData.verification) {
  //   testData.verification.verified = "verified"
  // }
  return {
    data: data || { has_verification: false, can_retry: true },
    error,
    isLoading,
    refetch,
  }
}
