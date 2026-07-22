"use client"

import { createContext, ReactNode, useCallback, useContext, useState } from "react"
import { Ip } from "@/types/ip"

export enum OnboardingStep {
  EXPLAINER = 0,
  REFERRAL = 1,
  PROFILE = 2,
  SOCIALS = 3,
  START_TRADING = 4,
  BUILDING_FEED = 5,
}

export interface OnboardingProfileData {
  username: string
  bio: string
  avatarUrl: string
}

export interface OnboardingInterestsData {
  selectedCategories: string[]
  selectedIps: string[]
  selectedIpObjects: Ip[]
}

interface OnboardingContextType {
  isOpen: boolean
  isReturningUser: boolean
  currentStep: OnboardingStep
  explainerSubStep: number
  profileData: OnboardingProfileData
  interestsData: OnboardingInterestsData
  openOnboarding: (returning?: boolean) => void
  closeOnboarding: () => void
  nextStep: () => void
  prevStep: () => void
  nextExplainerSubStep: () => void
  prevExplainerSubStep: () => void
  goToStep: (step: OnboardingStep) => void
  setProfileData: (data: Partial<OnboardingProfileData>) => void
  setInterestsData: (data: Partial<OnboardingInterestsData>) => void
  skipOnboarding: () => void
  totalSteps: number
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

const TOTAL_STEPS = 5 // Still 5 visible steps, BUILDING_FEED is a transition

const initialProfileData: OnboardingProfileData = {
  username: "",
  bio: "",
  avatarUrl: "",
}

const initialInterestsData: OnboardingInterestsData = {
  selectedCategories: [],
  selectedIps: [],
  selectedIpObjects: [],
}

const EXPLAINER_SUB_STEPS = 1

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isReturningUser, setIsReturningUser] = useState(false)
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(OnboardingStep.EXPLAINER)
  const [explainerSubStep, setExplainerSubStep] = useState(0)
  const [profileData, setProfileDataState] = useState<OnboardingProfileData>(initialProfileData)
  const [interestsData, setInterestsDataState] = useState<OnboardingInterestsData>(initialInterestsData)

  const openOnboarding = useCallback((returning?: boolean) => {
    setIsOpen(true)
    setIsReturningUser(returning ?? false)
    setCurrentStep(OnboardingStep.EXPLAINER)
    setExplainerSubStep(0)
    setProfileDataState(initialProfileData)
    setInterestsDataState(initialInterestsData)
  }, [])

  const closeOnboarding = useCallback(() => {
    setIsOpen(false)
    // Reset state after closing
    setTimeout(() => {
      setCurrentStep(OnboardingStep.EXPLAINER)
      setExplainerSubStep(0)
      setProfileDataState(initialProfileData)
      setInterestsDataState(initialInterestsData)
    }, 300) // Wait for exit animation
  }, [])

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev < TOTAL_STEPS - 1) {
        return prev + 1
      }
      return prev
    })
  }, [])

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev > 0) {
        return prev - 1
      }
      return prev
    })
  }, [])

  const nextExplainerSubStep = useCallback(() => {
    setExplainerSubStep((prev) => {
      if (prev < EXPLAINER_SUB_STEPS - 1) {
        return prev + 1
      }
      return prev
    })
  }, [])

  const prevExplainerSubStep = useCallback(() => {
    setExplainerSubStep((prev) => {
      if (prev > 0) {
        return prev - 1
      }
      return prev
    })
  }, [])

  const goToStep = useCallback((step: OnboardingStep) => {
    // Allow BUILDING_FEED (step 5) even though TOTAL_STEPS is 5 (it's a transition step)
    if (step >= 0 && (step < TOTAL_STEPS || step === OnboardingStep.BUILDING_FEED)) {
      setCurrentStep(step)
    }
  }, [])

  const setProfileData = useCallback((data: Partial<OnboardingProfileData>) => {
    setProfileDataState((prev) => ({ ...prev, ...data }))
  }, [])

  const setInterestsData = useCallback((data: Partial<OnboardingInterestsData>) => {
    setInterestsDataState((prev) => ({ ...prev, ...data }))
  }, [])

  const skipOnboarding = useCallback(() => {
    // Mark as skipped in localStorage so it doesn't show again
    localStorage.setItem("onboarding-skipped", "true")
    closeOnboarding()
  }, [closeOnboarding])

  return (
    <OnboardingContext.Provider
      value={{
        isOpen,
        isReturningUser,
        currentStep,
        explainerSubStep,
        profileData,
        interestsData,
        openOnboarding,
        closeOnboarding,
        nextStep,
        prevStep,
        nextExplainerSubStep,
        prevExplainerSubStep,
        goToStep,
        setProfileData,
        setInterestsData,
        skipOnboarding,
        totalSteps: TOTAL_STEPS,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider")
  }
  return context
}