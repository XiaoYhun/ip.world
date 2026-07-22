"use client"

import { useEffect, useRef } from "react"
import { useAccount } from "@/hooks/use-account"
import { useProfile } from "@/hooks/use-profile"
import { useOnboarding } from "@/context/onboarding-context"

const RETURNING_USER_THRESHOLD_MS = 5 * 60 * 1000

/**
 * OnboardingTrigger - Auto-opens onboarding for users that haven't
 * completed or skipped it (localStorage) and whose profile is incomplete.
 *
 * Profile completeness (bio + avatar) replaces the old username === wallet_address
 * check, which broke when auto-generated usernames were introduced.
 *
 * New vs returning distinction (passed to dialog for smart step-skipping):
 *  - Account created ≤ 5 min ago  → new user (full flow with referral)
 *  - Account created > 5 min ago  → returning user (skip referral, skip
 *    completed steps)
 *
 * Existing users with a filled-in profile on a new browser/device won't
 * be bothered because their profile completeness signals prior onboarding.
 */
export function OnboardingTrigger() {
  const { address, isConnected } = useAccount()
  const { user, isUserLoading } = useProfile()
  const { openOnboarding, isOpen } = useOnboarding()
  const hasTriggeredRef = useRef(false)

  useEffect(() => {
    if (isOpen || hasTriggeredRef.current) return
    if (!isConnected || !address || isUserLoading || !user) return

    const hasCompletedOnboarding = localStorage.getItem("onboarding-completed") === "true"
    const hasSkippedOnboarding = localStorage.getItem("onboarding-skipped") === "true"
    if (hasCompletedOnboarding || hasSkippedOnboarding) return

    const isProfileIncomplete = !user.bio || !user.avatar_url
    if (!isProfileIncomplete) return

    const accountAge = user.created_at
      ? Date.now() - new Date(user.created_at).getTime()
      : 0 // Missing created_at → treat as brand new
    const isReturning = accountAge > RETURNING_USER_THRESHOLD_MS

    hasTriggeredRef.current = true
    setTimeout(() => {
      openOnboarding(isReturning)
    }, 500)
  }, [isConnected, address, user, isUserLoading, isOpen, openOnboarding])

  // Reset trigger flag when user disconnects
  useEffect(() => {
    if (!isConnected) {
      hasTriggeredRef.current = false
    }
  }, [isConnected])

  return null
}
