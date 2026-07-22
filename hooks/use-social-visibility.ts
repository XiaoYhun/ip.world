"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAccount } from "@/hooks/use-account"
import { fetchJSONWithAuth } from "@/lib/client/fetcher"
import { getAPIRootUrl } from "@/lib/utils"
import { getAuthToken } from "@dynamic-labs/sdk-react-core"

interface SocialVisibility {
  twitter: boolean
  tiktok: boolean
}

interface SocialVisibilityUpdate {
  twitter?: boolean
  tiktok?: boolean
}

export function useSocialVisibility() {
  const { address } = useAccount()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<SocialVisibility>({
    queryKey: ["social-visibility", address],
    queryFn: () => fetchJSONWithAuth<SocialVisibility>(`${getAPIRootUrl()}/users/social-visibility`),
    enabled: !!address,
    staleTime: 60_000,
  })

  const { mutateAsync: updateVisibility } = useMutation({
    mutationFn: async (update: SocialVisibilityUpdate) => {
      const token = getAuthToken()
      const res = await fetch(`${getAPIRootUrl()}/users/social-visibility`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(update),
      })
      if (!res.ok) throw new Error("Failed to update social visibility")
      return res.json() as Promise<SocialVisibility>
    },
    onSuccess: (newData) => {
      queryClient.setQueryData(["social-visibility", address], newData)
      // Invalidate user queries so profile reflects changes
      queryClient.invalidateQueries({ queryKey: ["user"] })
      queryClient.invalidateQueries({ queryKey: ["user-profile"] })
    },
  })

  return {
    visibility: data ?? { twitter: false, tiktok: false },
    isLoading,
    updateVisibility,
  }
}
