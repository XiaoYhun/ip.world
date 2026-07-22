"use client"

import { motion } from "framer-motion"
import { gsap } from "gsap"
import { useEffect, useRef } from "react"
import Image from "next/image"

interface OnboardingReferralProps {
  currentStep: number
  totalSteps: number
  referralInput: string
  error: string | null
  onReferralChange: (value: string) => void
  onBack: () => void
  onNext: () => void
}

export function OnboardingReferral({
  currentStep,
  totalSteps,
  referralInput,
  error,
  onReferralChange,
  onBack,
  onNext,
}: OnboardingReferralProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Animate blur on mount
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    gsap.set(container, { filter: "blur(30px)" })
    gsap.to(container, {
      filter: "blur(0px)",
      duration: 1.2,
      ease: "power2.out",
    })
  }, [])

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full max-w-[380px] flex-col items-center justify-center px-4"
    >
      {/* Header */}
      <motion.div
        className="mb-9 flex flex-col items-center gap-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <h1 className="font-archivo text-center text-2xl leading-[0.95] font-semibold text-white">
          Enter referral code
        </h1>
        <p className="font-archivo text-center text-base leading-[0.95] font-normal text-[#b3b3b3]">
          Earn extra rewards with your referrer
        </p>
      </motion.div>

      <motion.div
        className="flex w-full max-w-[380px] flex-col items-center gap-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        {/* Decorative Image */}
        <div className="relative h-[250px] w-full max-w-[480px] overflow-hidden rounded-2xl">
          <Image
            src="/images/onboarding-referral-image.png"
            alt="IP.World"
            fill
            className="object-cover object-center"
          />
        </div>

        {/* Referral Input */}
        <div className="flex w-full flex-col gap-2">
          <label
            htmlFor="referral-link"
            className="text-xxs font-normal leading-[1.04] text-[#494949]"
          >
            Referral Code or Link
          </label>
          <div
            className="flex w-full items-center rounded-[12px] bg-[rgba(25,25,25,0.7)] px-3 py-3 shadow-[0px_2px_12px_0px_rgba(0,0,0,0.2)] backdrop-blur-[10px] transition-colors focus-within:border-[#C093FF]/50"
            style={{ border: error ? "0.5px solid #ea4949" : "0.5px solid #313131" }}
          >
            <input
              id="referral-link"
              type="text"
              value={referralInput}
              onChange={(e) => onReferralChange(e.target.value)}
              placeholder="username or ip.world/?ref=username"
              className="flex-1 bg-transparent text-sm leading-[1.04] text-white placeholder:text-[#494949] outline-none"
            />
          </div>
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[10px] text-[#ea4949]"
            >
              {error}
            </motion.p>
          )}
        </div>
      </motion.div>
    </div>
  )
}
