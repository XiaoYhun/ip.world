"use client"

import { useState } from "react"
import { useOnboarding } from "@/context/onboarding-context"
import { useProfile } from "@/hooks/use-profile"

/**
 * Debug button to test onboarding flow without logging in
 * Only renders in development mode
 */
export function OnboardingDebugButton() {
  const { openOnboarding } = useOnboarding()
  const { user } = useProfile()
  const [isExpanded, setIsExpanded] = useState(false)

  const isDevelopment = process.env.NODE_ENV === "development"
  const isVercelPreview = process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" || process.env.VERCEL_ENV === "preview"

  if (!isDevelopment && !isVercelPreview) {
    return null
  }

  const clearAndOpen = (returning?: boolean) => {
    localStorage.removeItem("onboarding-completed")
    localStorage.removeItem("onboarding-skipped")
    openOnboarding(returning)
    setIsExpanded(false)
  }

  const autoDetect = (): boolean => {
    if (!user?.created_at) return false
    const FIVE_MINUTES = 5 * 60 * 1000
    return Date.now() - new Date(user.created_at).getTime() > FIVE_MINUTES
  }

  return (
    <div className="fixed right-4 bottom-8 z-[200] flex flex-col items-end gap-1">
      {isExpanded && (
        <div className="flex flex-col gap-1 rounded-[10px] bg-neutral-900 p-1.5 shadow-lg border border-neutral-700">
          <button
            onClick={() => clearAndOpen(false)}
            className="rounded-[6px] px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 cursor-pointer text-left"
          >
            🆕 New User
          </button>
          <button
            onClick={() => clearAndOpen(true)}
            className="rounded-[6px] px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 cursor-pointer text-left"
          >
            🔄 Returning User
          </button>
          <button
            onClick={() => clearAndOpen(autoDetect())}
            className="rounded-[6px] px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 cursor-pointer text-left"
          >
            🔍 Auto-detect {user?.created_at ? `(${autoDetect() ? "returning" : "new"})` : "(no user)"}
          </button>
        </div>
      )}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="rounded-[10px] bg-purple-600 px-3 py-2 text-xs font-medium text-white shadow-lg transition-all hover:scale-105 hover:bg-purple-500 cursor-pointer"
        title="Test Onboarding Flow"
      >
        🧪 Test Onboarding
      </button>
    </div>
  )
}
