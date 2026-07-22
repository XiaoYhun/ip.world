"use client"

import { useMutation } from "@tanstack/react-query"
import { Address } from "viem"
import { getAuthToken } from "@dynamic-labs/sdk-react-core"
import { errorReporter } from "@/lib/error-reporting"
import { isErrResponse } from "@/types/error"
import { claimAndRegisterOwnership } from "@/actions/ip/claim-ownership"

interface UseClaimApiResult {
  executeApiCall: (ipId: string, claimer: Address, ipaId: Address) => Promise<any>
  isLoading: boolean
  error: string | null
}

/**
 * Hook for handling API calls after successful blockchain transactions
 * Uses React Query for consistent error handling and caching
 */
export const useClaimApi = (): UseClaimApiResult => {
  const mutation = useMutation({
    mutationFn: async ({ ipId, claimer, ipaId }: { ipId: string; claimer: Address; ipaId: Address }) => {
      try {
        const result = await claimAndRegisterOwnership(
          { ip_id: ipId, user_address: claimer, ipa_id: ipaId },
          getAuthToken()
        )

        // Check if the result is an error response
        if (isErrResponse(result)) {
          const errorMessage = result.error || "API call failed"

          errorReporter.reportError(new Error(errorMessage), {
            component: "useClaimApi",
            action: "claimIp",
            severity: "high",
            ipId,
            claimer,
            status: result.status,
          })

          throw new Error(errorMessage)
        }

        // Success case - return the actual result data
        return result
      } catch (error) {
        // Handle both thrown errors and our custom errors
        const errorMessage = error instanceof Error ? error.message : "Unknown API error"

        // Only report if it's not already reported (avoid double reporting)
        if (!(error instanceof Error && error.message.includes("API call failed"))) {
          errorReporter.reportError(error instanceof Error ? error : new Error(errorMessage), {
            component: "useClaimApi",
            action: "claimIp",
            severity: "high",
            ipId,
            claimer,
          })
        }

        throw new Error(errorMessage)
      }
    },
    retry: 2, // Retry failed API calls twice
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  })

  const executeApiCall = async (ipId: string, claimer: Address, ipaId: Address): Promise<any> => {
    try {
      const result = await mutation.mutateAsync({ ipId, claimer, ipaId })
      return result
    } catch (error) {
      // Error is already logged in mutationFn
      throw error
    }
  }

  return {
    executeApiCall,
    isLoading: mutation.isPending,
    error: mutation.error?.message || null,
  }
}
