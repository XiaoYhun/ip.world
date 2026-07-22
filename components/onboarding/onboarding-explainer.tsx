"use client"

import { motion } from "framer-motion"
import { gsap } from "gsap"
import { useRef, useEffect } from "react"
import { CategoryPet, LicensedBadgeVerified } from "@/components/icons"
import Image from "next/image"

interface OnboardingExplainerProps {
  currentStep: number
  explainerSubStep: number
  totalSteps: number
  isReturningUser: boolean
  onBack: () => void
  onNext: () => void
  onSkip: () => void
}

export function OnboardingExplainer({
  currentStep,
  explainerSubStep,
  totalSteps,
  isReturningUser,
  onBack,
  onNext,
  onSkip,
}: OnboardingExplainerProps) {
  const explainerContainerRef = useRef<HTMLDivElement>(null)

  // Animate blur on mount
  useEffect(() => {
    const container = explainerContainerRef.current
    if (!container) return

    // Set initial heavy blur
    gsap.set(container, {
      filter: "blur(30px)",
    })

    // Animate to unblurred
    gsap.to(container, {
      filter: "blur(0px)",
      duration: 1.2,
      ease: "power2.out",
    })
  }, [])

  return (
    <div
      ref={explainerContainerRef}
      className="flex h-full w-full flex-col items-center justify-center px-4"
    >
      {/* IP Card Showcase */}
      <div className="relative mb-10 w-[1024px] max-w-full aspect-[1024/500]">
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 0.4, opacity: 0, y: 40, rotate: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0, rotate: 4.278 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Image src="/images/onboarding-hero-image.png" alt="Onboarding Hero Image" width={1024} height={500} className="w-full h-auto" />
        </motion.div>
      </div>

      {/* Content */}
      <motion.div
        className="flex w-full max-w-[326px] flex-col items-center gap-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        {/* Text content */}
        <div className="flex w-full flex-col items-center">
          <div className="flex w-full flex-col items-center gap-5">
            {/* Content */}
            <div className="flex flex-col items-center gap-4">
              {/* Title */}
              <h1 className="font-archivo text-center text-2xl leading-[0.95] font-semibold text-white">
                {isReturningUser ? "Welcome back to virality upgraded" : "Welcome to virality upgraded"}
              </h1>

              {/* Subtitle */}
              <p className="font-archivo text-center text-base leading-[0.95] font-normal text-neutral-200">
                {isReturningUser
                  ? "Continue your journey with ip.world"
                  : "Begin your journey with ip.world"}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
