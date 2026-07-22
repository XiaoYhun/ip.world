"use client"

import { ReactNode } from "react"
import { useOnboarding } from "@/context/onboarding-context"

interface OnboardingBlurWrapperProps {
  children: ReactNode
}

export function OnboardingBlurWrapper({ children }: OnboardingBlurWrapperProps) {
  const { isOpen } = useOnboarding()

  return (
    <div
      className="min-h-screen transition-all duration-300"
      style={{
        filter: isOpen ? "blur(8px)" : "none",
        transform: isOpen ? "scale(1.01)" : "scale(1)",
      }}
    >
      {children}
    </div>
  )
}
