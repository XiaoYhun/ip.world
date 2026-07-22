"use client"

import * as DialogPrimitive from "@radix-ui/react-dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { getAuthToken, useDynamicContext, useSocialAccounts } from "@dynamic-labs/sdk-react-core"
import { ProviderEnum } from "@dynamic-labs/types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { AnimatePresence, motion } from "framer-motion"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { useAccount } from "@/hooks/use-account"
import { useProfile } from "@/hooks/use-profile"
import { updateUser } from "@/actions/users/update"
import { useTikTokVerificationStatus } from "@/hooks/use-tiktok-verification-status"
import { OnboardingStep, useOnboarding } from "@/context/onboarding-context"
import { getUsernameValidationError, normalizeUsernameInput } from "@/lib/username"
import { isErrResponse } from "@/types/error"
import { User } from "@/types/user"
import { OnboardingBackground } from "./onboarding-background"
import { OnboardingExplainer } from "./onboarding-explainer"
import { OnboardingReferral } from "./onboarding-referral"
import { OnboardingProfile } from "./onboarding-profile"
import { OnboardingSocials } from "./onboarding-socials"
import { OnboardingStartTrading } from "./onboarding-start-trading"
import { OnboardingBuildingFeed } from "./onboarding-building-feed"
import { PaginationDots } from "./pagination-dots"
import { gsap } from "gsap"
import { cn } from "@/lib/utils"
import HallidayPaymentDialog from "@/components/dialog/halliday-payment-dialog"

export function OnboardingDialog() {
  const {
    isOpen,
    isReturningUser,
    currentStep,
    explainerSubStep,
    profileData,
    interestsData,
    closeOnboarding,
    nextStep,
    prevStep,
    goToStep,
    setProfileData,
    skipOnboarding,
    totalSteps,
  } = useOnboarding()

  const { address } = useAccount()
  const { user } = useProfile()
  const { showAuthFlow } = useDynamicContext()
  const { getLinkedAccountInformation } = useSocialAccounts()
  const { data: tikTokStatus } = useTikTokVerificationStatus()
  const isTwitterConnected = !!getLinkedAccountInformation(ProviderEnum.Twitter)?.username
  const isTikTokConnected = tikTokStatus?.verification?.verified === "verified"
  const hasBothSocials = isTwitterConnected && isTikTokConnected
  const queryClient = useQueryClient()
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const profileFormDataRef = useRef<{ username: string; bio: string; avatarUrl: string }>({
    username: "",
    bio: "",
    avatarUrl: "",
  })
  const [isHallidayModalOpen, setIsHallidayModalOpen] = useState(false)
  const [referralInput, setReferralInput] = useState("")
  const [referralError, setReferralError] = useState<string | null>(null)
  const [isSubmittingReferral, setIsSubmittingReferral] = useState(false)
  const [canProceedProfile, setCanProceedProfile] = useState(true)

  // Handle user profile update mutation
  const { mutate: updateUserMutation } = useMutation({
    mutationFn: async (userData: Partial<User>) => await updateUser(userData, getAuthToken()),
    onSuccess: (res, variables) => {
      if (isErrResponse(res)) {
        if (res?.error === "username already exists") {
          toast.error("Username already exists")
        } else {
          toast.error("Failed to update profile")
        }
        return
      }

      queryClient.setQueryData<User | null>(["user", address], (old) => (old ? { ...old, ...variables } : null))
      queryClient.invalidateQueries({ queryKey: ["user", address] })
    },
    onError: () => {
      toast.error("Failed to update profile")
    },
  })

  const handleProfileDataChange = useCallback((data: { username: string; bio: string; avatarUrl: string }) => {
    profileFormDataRef.current = data
  }, [])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't close onboarding if Halliday modal or auth flow is open
      if (e.key === "Escape" && !isHallidayModalOpen && !showAuthFlow) {
        skipOnboarding()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, skipOnboarding, isHallidayModalOpen, showAuthFlow])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  // Handlers
  const handleExplainerBack = useCallback(() => {
    // Since explainer has only 1 sub-step, back button skips onboarding
    skipOnboarding()
  }, [skipOnboarding])

  const handleExplainerNext = useCallback(() => {
    if (isReturningUser) {
      const hasAvatar = !!user?.avatar_url
      const hasBio = !!user?.bio
      if (hasAvatar && hasBio) {
        // Skip profile — check if socials also done
        if (hasBothSocials) {
          goToStep(OnboardingStep.START_TRADING)
        } else {
          goToStep(OnboardingStep.SOCIALS)
        }
      } else {
        goToStep(OnboardingStep.PROFILE)
      }
    } else {
      nextStep()
    }
  }, [isReturningUser, goToStep, nextStep, user, hasBothSocials])
  const handleReferralBack = useCallback(() => prevStep(), [prevStep])

  /**
   * Parse referral input — accepts:
   *  - https://ip.world/?ref=xxx
   *  - https://ip.world?ref=xxx
   *  - ip.world/?ref=xxx
   *  - ip.world?ref=xxx
   *  - bare username that matches the username rules
   */
  const parseReferralCode = useCallback((input: string): string | null => {
    const trimmed = input.trim()
    if (!trimmed) return null

    // Try to extract from URL-like input
    if (trimmed.includes("ref=")) {
      const match = trimmed.match(/[?&]ref=([^&\s]+)/)
      if (match && match[1]) {
        let raw = match[1].trim()
        try {
          raw = decodeURIComponent(raw)
        } catch {
          // use raw as-is
        }
        const code = normalizeUsernameInput(raw)
        if (!getUsernameValidationError(code)) return code
      }
      return null // Had ref= but couldn't extract a valid code
    }

    // Treat as bare referral username using the same username rules
    const code = normalizeUsernameInput(trimmed)
    if (!getUsernameValidationError(code)) return code

    return null
  }, [])

  const handleReferralNext = useCallback(async () => {
    const trimmed = referralInput.trim()

    // Skip if empty
    if (!trimmed) {
      setReferralError(null)
      nextStep()
      return
    }

    // Parse and validate
    const code = parseReferralCode(trimmed)
    if (!code) {
      setReferralError("Invalid referral code or link")
      return
    }

    // Submit to API
    setIsSubmittingReferral(true)
    setReferralError(null)

    try {
      const token = getAuthToken()
      const res = await fetch("/api/users/referral", {
        method: "POST",
        headers: {
          "X-Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ referral_code: code }),
      })

      if (res.ok) {
        nextStep()
        return
      }

      const data = await res.json()
      const errorMsg = data?.error || data?.message || ""

      if (res.status === 404) {
        setReferralError("Referral code not found")
      } else if (res.status === 409) {
        setReferralError("You already have a referrer")
      } else if (res.status === 400 && errorMsg.includes("yourself")) {
        setReferralError("You can't refer yourself")
      } else {
        setReferralError("Invalid referral code or link")
      }
    } catch {
      setReferralError("Something went wrong. Try again.")
    } finally {
      setIsSubmittingReferral(false)
    }
  }, [referralInput, parseReferralCode, nextStep])

  const handleProfileBack = useCallback(() => {
    if (isReturningUser) {
      // Skip back to explainer, not referral
      goToStep(OnboardingStep.EXPLAINER)
    } else {
      prevStep()
    }
  }, [isReturningUser, goToStep, prevStep])
  const handleProfileNext = useCallback(
    (data: { username: string; bio: string; avatarUrl: string }) => {
      const username = normalizeUsernameInput(data.username)
      setProfileData({ username, bio: data.bio, avatarUrl: data.avatarUrl })

      // Save immediately if there's anything to save
      const hasUsername = username && username !== address?.toLowerCase()
      if (hasUsername || data.bio || data.avatarUrl) {
        updateUserMutation({
          username: username || undefined,
          bio: data.bio || undefined,
          avatar_url: data.avatarUrl || undefined,
        })
      }

      if (isReturningUser && hasBothSocials) {
        goToStep(OnboardingStep.START_TRADING)
      } else {
        nextStep()
      }
    },
    [nextStep, setProfileData, updateUserMutation, address, isReturningUser, hasBothSocials, goToStep]
  )
  const handleSocialsBack = useCallback(() => {
    if (isReturningUser && user?.avatar_url && user?.bio) {
      // Skipped profile, go back to explainer
      goToStep(OnboardingStep.EXPLAINER)
    } else {
      prevStep()
    }
  }, [isReturningUser, user, goToStep, prevStep])
  const handleSocialsNext = useCallback(() => {
    nextStep()
  }, [nextStep])

  const handleStartTradingBack = useCallback(() => {
    if (isReturningUser && hasBothSocials) {
      // Skipped socials — go back to profile or explainer
      if (user?.avatar_url && user?.bio) {
        goToStep(OnboardingStep.EXPLAINER)
      } else {
        goToStep(OnboardingStep.PROFILE)
      }
    } else {
      prevStep()
    }
  }, [isReturningUser, hasBothSocials, user, goToStep, prevStep])
  const handleOnboardingComplete = useCallback(async () => {
    const latestProfileData = profileFormDataRef.current
    if (latestProfileData.username) {
      updateUserMutation({
        username: normalizeUsernameInput(latestProfileData.username),
        bio: latestProfileData.bio || undefined,
        avatar_url: latestProfileData.avatarUrl || undefined,
      })
    }
    localStorage.setItem("onboarding-completed", "true")

    // Smoothly fade out the onboarding overlay and content
    const overlay = overlayRef.current
    const content = contentRef.current

    if (overlay && content) {
      const tl = gsap.timeline({
        onComplete: () => {
          closeOnboarding()
          toast.success("Welcome to IP.World!")
        },
      })

      tl.to(
        [content, overlay],
        {
          opacity: 0,
          duration: 1,
          ease: "power2.inOut",
        },
        0
      )
    } else {
      closeOnboarding()
      toast.success("Welcome to IP.World!")
    }
  }, [profileData, updateUserMutation, closeOnboarding])

  const handleStartTradingFinish = useCallback(() => {
    goToStep(OnboardingStep.BUILDING_FEED)
  }, [goToStep])

  if (!isOpen) return null

  return (
    <>
      <DialogPrimitive.Root
        open={isOpen}
        onOpenChange={(open) => {
          // Don't close onboarding if Halliday modal or auth flow is open
          if (!open && !isHallidayModalOpen && !showAuthFlow) {
            skipOnboarding()
          }
        }}
      >
        <DialogPrimitive.Portal>
          {/* Overlay with backdrop blur */}
          <DialogPrimitive.Overlay
            className="fixed inset-0 z-[200] bg-black/30 backdrop-blur-md"
            ref={overlayRef as any}
            style={{
              pointerEvents: isHallidayModalOpen || showAuthFlow ? "none" : "auto",
            }}
          />

          {/* Full screen content container */}
          <DialogPrimitive.Content
            ref={contentRef as any}
            className="fixed inset-0 z-[201] flex items-center justify-center overflow-y-auto outline-none"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
              backgroundPosition: "0 0",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              pointerEvents: isHallidayModalOpen || showAuthFlow ? "none" : "auto",
            }}
          >
            <VisuallyHidden>
              <DialogPrimitive.Title>Welcome to IP.World</DialogPrimitive.Title>
              <DialogPrimitive.Description>Complete your onboarding to get started</DialogPrimitive.Description>
            </VisuallyHidden>

            {/* Gradient orbs layer */}
            <OnboardingBackground />

            {/* Content */}
            <div
              className="relative z-10 flex flex-col items-center justify-center gap-8 my-auto py-6 sm:py-0"
              style={{
                pointerEvents: isHallidayModalOpen || showAuthFlow ? "none" : "auto",
              }}
            >
              {/* Animated step content */}
              <div className="h-full">
                <AnimatePresence mode="wait" key="onboarding-steps">
                  {currentStep === OnboardingStep.EXPLAINER && (
                    <motion.div
                      key="explainer"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      style={{ willChange: "auto" }}
                    >
                      <OnboardingExplainer
                        currentStep={currentStep}
                        explainerSubStep={explainerSubStep}
                        totalSteps={totalSteps}
                        isReturningUser={isReturningUser}
                        onBack={handleExplainerBack}
                        onNext={handleExplainerNext}
                        onSkip={skipOnboarding}
                      />
                    </motion.div>
                  )}

                  {currentStep === OnboardingStep.REFERRAL && (
                    <motion.div
                      key="referral"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      style={{ willChange: "auto" }}
                    >
                      <OnboardingReferral
                        currentStep={currentStep}
                        totalSteps={totalSteps}
                        referralInput={referralInput}
                        error={referralError}
                        onReferralChange={(val) => {
                          setReferralInput(val)
                          if (referralError) setReferralError(null)
                        }}
                        onBack={handleReferralBack}
                        onNext={handleReferralNext}
                      />
                    </motion.div>
                  )}

                  {currentStep === OnboardingStep.PROFILE && (
                    <motion.div
                      key="profile"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      style={{ willChange: "auto" }}
                    >
                      <OnboardingProfile
                        currentStep={currentStep}
                        totalSteps={totalSteps}
                        isReturningUser={isReturningUser}
                        onBack={handleProfileBack}
                        onNext={handleProfileNext}
                        onValidationChange={setCanProceedProfile}
                        onDataChange={handleProfileDataChange}
                        initialData={{
                          username: profileData.username || user?.username || "",
                          bio: profileData.bio || user?.bio || "",
                          avatarUrl: profileData.avatarUrl || user?.avatar_url || "",
                        }}
                      />
                    </motion.div>
                  )}

                  {currentStep === OnboardingStep.SOCIALS && (
                    <motion.div
                      key="socials"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      style={{ willChange: "auto" }}
                    >
                      <OnboardingSocials
                        currentStep={currentStep}
                        totalSteps={totalSteps}
                        isReturningUser={isReturningUser}
                        onBack={handleSocialsBack}
                        onNext={handleSocialsNext}
                      />
                    </motion.div>
                  )}

                  {currentStep === OnboardingStep.START_TRADING && (
                    <motion.div
                      key="start-trading"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      style={{ willChange: "auto" }}
                    >
                      <OnboardingStartTrading
                        currentStep={currentStep}
                        totalSteps={totalSteps}
                        isReturningUser={isReturningUser}
                        onBack={handleStartTradingBack}
                        onFinish={handleStartTradingFinish}
                        isHallidayModalOpen={isHallidayModalOpen}
                        setIsHallidayModalOpen={setIsHallidayModalOpen}
                      />
                    </motion.div>
                  )}

                  {currentStep === OnboardingStep.BUILDING_FEED && (
                    <motion.div
                      key="building-feed"
                      className="h-full"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <OnboardingBuildingFeed
                        selectedCategories={interestsData.selectedCategories}
                        selectedIps={interestsData.selectedIpObjects}
                        username={profileData.username}
                        onComplete={handleOnboardingComplete}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Static navigation - only show for steps with navigation */}
              {currentStep !== OnboardingStep.BUILDING_FEED && (
                <div className="onboarding-navigation flex flex-col items-center gap-4">
                  {/* Pagination dots */}
                  <PaginationDots totalSteps={totalSteps} currentStep={currentStep} />

                  {/* Buttons */}
                  <div className="flex items-center gap-3">
                    {/* Back button - show for all steps except EXPLAINER */}
                    {currentStep !== OnboardingStep.EXPLAINER && (
                      <button
                        onClick={
                          currentStep === OnboardingStep.REFERRAL
                            ? handleReferralBack
                            : currentStep === OnboardingStep.PROFILE
                              ? handleProfileBack
                              : currentStep === OnboardingStep.SOCIALS
                                ? handleSocialsBack
                                : handleStartTradingBack
                        }
                        className="flex items-center gap-2.5 rounded-full border border-neutral-300 px-6 py-4 transition-colors hover:bg-white/5 cursor-pointer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" style={{ rotate: "180deg" }} fill="none">
                          <g clipPath="url(#clip0_1207_3857)">
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M12.8335 5.99707H0.583496V7.99707H12.8335V5.99707Z"
                              fill="#797979"
                            />
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M11.4194 7.00008L6.00148 1.58218L7.4157 0.167969L14.2478 7.00008L7.4157 13.8322L6.00148 12.418L11.4194 7.00008Z"
                              fill="#797979"
                            />
                          </g>
                          <defs>
                            <clipPath id="clip0_1207_3857">
                              <rect width="14" height="14" fill="white" transform="matrix(-1 0 0 1 14 0)" />
                            </clipPath>
                          </defs>
                        </svg>
                        <span className="text-base font-semibold text-neutral-300">Back</span>
                      </button>
                    )}

                    {/* Next/Finish button */}
                    {currentStep === OnboardingStep.EXPLAINER && (
                      <button
                        onClick={handleExplainerNext}
                        className="flex items-center gap-2.5 rounded-full bg-white px-6 py-4 transition-colors hover:bg-white/90 cursor-pointer"
                      >
                        <span className="text-base font-medium text-neutral-800">Start</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <g clipPath="url(#clip0_1207_3857)">
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M12.8335 5.99707H0.583496V7.99707H12.8335V5.99707Z"
                              fill="#080808"
                            />
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M11.4194 7.00008L6.00148 1.58218L7.4157 0.167969L14.2478 7.00008L7.4157 13.8322L6.00148 12.418L11.4194 7.00008Z"
                              fill="#080808"
                            />
                          </g>
                          <defs>
                            <clipPath id="clip0_1207_3857">
                              <rect width="14" height="14" fill="white" transform="matrix(-1 0 0 1 14 0)" />
                            </clipPath>
                          </defs>
                        </svg>
                      </button>
                    )}

                    {currentStep === OnboardingStep.REFERRAL && (
                      <button
                        onClick={handleReferralNext}
                        disabled={isSubmittingReferral}
                        className="flex items-center gap-2.5 rounded-full bg-white px-6 py-4 transition-colors hover:bg-white/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="text-base font-medium text-neutral-800">
                          {isSubmittingReferral ? "Submitting..." : referralInput.trim() ? "Next" : "Skip"}
                        </span>
                        {!isSubmittingReferral && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <g clipPath="url(#clip0_1207_3857)">
                              <path fillRule="evenodd" clipRule="evenodd" d="M12.8335 5.99707H0.583496V7.99707H12.8335V5.99707Z" fill="#080808" />
                              <path fillRule="evenodd" clipRule="evenodd" d="M11.4194 7.00008L6.00148 1.58218L7.4157 0.167969L14.2478 7.00008L7.4157 13.8322L6.00148 12.418L11.4194 7.00008Z" fill="#080808" />
                            </g>
                            <defs>
                              <clipPath id="clip0_1207_3857">
                                <rect width="14" height="14" fill="white" transform="matrix(-1 0 0 1 14 0)" />
                              </clipPath>
                            </defs>
                          </svg>
                        )}
                      </button>
                    )}

                    {currentStep === OnboardingStep.PROFILE && (
                      <button
                        onClick={() => {
                          if (canProceedProfile) {
                            handleProfileNext(profileFormDataRef.current)
                          }
                        }}
                        disabled={!canProceedProfile}
                        className={cn(
                          "flex items-center gap-2.5 rounded-full px-6 py-4 transition-colors cursor-pointer",
                          canProceedProfile ? "bg-white hover:bg-white/90" : "bg-white/50 cursor-not-allowed"
                        )}
                      >
                        <span
                          className={cn(
                            "text-base font-medium",
                            canProceedProfile ? "text-neutral-800" : "text-neutral-400"
                          )}
                        >
                          Next
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <g clipPath="url(#clip0_1207_3857)">
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M12.8335 5.99707H0.583496V7.99707H12.8335V5.99707Z"
                              fill="#080808"
                            />
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M11.4194 7.00008L6.00148 1.58218L7.4157 0.167969L14.2478 7.00008L7.4157 13.8322L6.00148 12.418L11.4194 7.00008Z"
                              fill="#080808"
                            />
                          </g>
                          <defs>
                            <clipPath id="clip0_1207_3857">
                              <rect width="14" height="14" fill="white" transform="matrix(-1 0 0 1 14 0)" />
                            </clipPath>
                          </defs>
                        </svg>
                      </button>
                    )}

                    {currentStep === OnboardingStep.SOCIALS && (
                      <button
                        onClick={handleSocialsNext}
                        className="flex items-center gap-2.5 rounded-full bg-white px-6 py-4 transition-colors hover:bg-white/90 cursor-pointer"
                      >
                        <span className="text-base font-medium text-neutral-800">Next</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <g clipPath="url(#clip0_1207_3857)">
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M12.8335 5.99707H0.583496V7.99707H12.8335V5.99707Z"
                              fill="#080808"
                            />
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M11.4194 7.00008L6.00148 1.58218L7.4157 0.167969L14.2478 7.00008L7.4157 13.8322L6.00148 12.418L11.4194 7.00008Z"
                              fill="#080808"
                            />
                          </g>
                          <defs>
                            <clipPath id="clip0_1207_3857">
                              <rect width="14" height="14" fill="white" transform="matrix(-1 0 0 1 14 0)" />
                            </clipPath>
                          </defs>
                        </svg>
                      </button>
                    )}

                    {currentStep === OnboardingStep.START_TRADING && (
                      <button
                        onClick={handleStartTradingFinish}
                        className="flex items-center gap-2.5 rounded-full bg-white px-6 py-4 transition-colors hover:bg-white/90"
                      >
                        <span className="text-base font-medium text-neutral-800">Finish</span>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-neutral-800">
                          <path
                            d="M5.5 3L9.5 7L5.5 11"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
      {/* HallidayPaymentDialog uses its own Radix portal so it renders above everything */}
      <HallidayPaymentDialog isOpen={isHallidayModalOpen} onOpenChange={setIsHallidayModalOpen} />
    </>
  )
}
