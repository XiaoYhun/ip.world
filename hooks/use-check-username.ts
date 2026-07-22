"use client"

import { useQuery } from "@tanstack/react-query"
import { getCheckUsername } from "@/actions/users/get-check-username"
import { getAuthToken } from "@/lib/dynamic"
import { isUsernameValid, normalizeUsernameInput } from "@/lib/username"
import { CheckUsernameResponse } from "@/types/check-username"
import { isErrResponse } from "@/types/error"

export const useCheckUsername = (username: string) => {
  const normalizedUsername = normalizeUsernameInput(username)
  const canCheckUsername = isUsernameValid(normalizedUsername)

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["check-username", normalizedUsername],
    queryFn: async () => {
      const response = await getCheckUsername(normalizedUsername, undefined, getAuthToken())

      if (isErrResponse(response)) {
        throw new Error(response.error)
      }

      return response as CheckUsernameResponse
    },
    enabled: canCheckUsername,
  })

  return {
    data,
    error,
    isLoading,
    refetch,
  }
}
