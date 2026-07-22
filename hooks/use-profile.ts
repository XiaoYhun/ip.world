"use client"

import { useQuery } from "@tanstack/react-query"
import { useAccount } from "@/hooks/use-account"
import { fetchJSONWithAuth } from "@/lib/client/fetcher"
import { User } from "@/types/user"
import { UserProfile } from "@/types/profile"
import { getAPIRootUrl } from "@/lib/utils"

export function useProfile() {
  const { address } = useAccount()

  const { data: user, isLoading: isUserLoading, error, isError } = useQuery<User | null>({
    queryKey: ["user", address],
    queryFn: () => fetchJSONWithAuth<User>(`${getAPIRootUrl()}/users/current`),
    enabled: !!address,
  })


  return { user: user ?? null, isUserLoading }
}

export function useUserProfileData(userAddress: string | undefined) {
  const { data, isLoading, isError } = useQuery<UserProfile | null>({
    queryKey: ["user-profile", userAddress],
    queryFn: () =>
      fetch(`${getAPIRootUrl()}/users/${userAddress}/profile`)
        .then((res) => {
          if (!res.ok) return null
          return res.json().then((json) => (json?.data ?? json) as UserProfile)
        }),
    enabled: !!userAddress,
    staleTime: 60_000,
  })

  return { data: data ?? null, isLoading, isError }
}
