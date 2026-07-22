"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { dynamicErrorSuppress } from "@/lib/dynamic-error-suppress"

const DYNAMIC_API_ERROR_MESSAGES: Record<string, string> = {
  merge_accounts_invalid: "Unable to link this wallet. It may be associated with another account.",
  reassign_wallet_error: "This wallet is already linked to another account and cannot be transferred.",
  social_account_already_exists: "This social account is already linked to another account.",
  social_account_not_found: "Social account not found.",
  social_account_already_linked: "This social account is already linked.",
  oauth_error: "Authentication failed. Please try again.",
  provider_not_enabled: "This social provider is not enabled.",
  invalid_provider: "Invalid social provider.",
  user_not_found: "User not found.",
  unauthorized: "Session expired. Please log in again.",
  rate_limited: "Too many requests. Please wait a moment.",
  unable_to_get_user_profile: "Unable to fetch your social profile. Your X API tier may not support user reads.",
}

export function DynamicErrorInterceptor() {
  const patchedRef = useRef<typeof window.fetch | null>(null)

  useEffect(() => {
    const originalFetch = window.fetch

    const patched: typeof window.fetch = async (input, init) => {
      const response = await originalFetch(input, init)

      const url = typeof input === "string" ? input : input instanceof Request ? input.url : ""
      if ((url.includes("app.dynamic.xyz") || url.includes("app.dynamicauth.com")) && !response.ok && !dynamicErrorSuppress.current) {
        try {
          const cloned = response.clone()
          const body = await cloned.json()
          const mapped = body?.code && DYNAMIC_API_ERROR_MESSAGES[body.code]
          if (mapped) {
            toast.error(mapped)
          } else if (body?.error && typeof body.error === "string") {
            toast.error(body.error)
          } else if (body?.message && typeof body.message === "string") {
            toast.error(body.message)
          }
        } catch {
          // response wasn't JSON
        }
      }

      return response
    }

    patchedRef.current = patched
    window.fetch = patched

    return () => {
      if (window.fetch === patchedRef.current) {
        window.fetch = originalFetch
      }
    }
  }, [])

  return null
}
