"use client"

import { motion } from "framer-motion"
import { useEffect, useRef } from "react"
import { gsap } from "gsap"

interface OnboardingBuildingFeedProps {
  selectedCategories: string[]
  selectedIps: unknown[]
  username?: string
  onComplete: () => void
}

export function OnboardingBuildingFeed({
  username,
  onComplete,
}: OnboardingBuildingFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const welcomeMessageRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => {
    const container = containerRef.current
    const welcomeMessage = welcomeMessageRef.current
    if (!container) return

    if (welcomeMessage) {
      gsap.set(welcomeMessage, { opacity: 0, y: 20 })
    }

    const startAnimation = () => {
      const tl = gsap.timeline()

      // Show welcome message
      if (welcomeMessage) {
        tl.to(welcomeMessage, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
        })

        // Hold
        tl.to({}, { duration: 1.5 })

        // Fade out
        tl.to(welcomeMessage, {
          opacity: 0,
          y: -20,
          duration: 0.5,
          ease: "power2.in",
        })
      }

      // Fade out container and complete
      tl.to(container, {
        opacity: 0,
        duration: 0.4,
        ease: "power2.in",
        onComplete: onComplete,
      })

      timelineRef.current = tl
    }

    const timeoutId = setTimeout(startAnimation, 100)

    return () => {
      clearTimeout(timeoutId)
      if (timelineRef.current) {
        timelineRef.current.kill()
        timelineRef.current = null
      }
    }
  }, [username, onComplete])

  return (
    <motion.div
      ref={containerRef}
      className="fixed inset-0 z-50 flex w-full flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Welcome Message */}
      <div
        ref={welcomeMessageRef}
        className="flex items-center justify-center"
        style={{
          opacity: 0,
          transform: "translateY(20px)",
        }}
      >
        <h2 className="font-archivo text-center text-3xl leading-[1.2] font-semibold text-white">
          Welcome {username ? `@${username}` : ""} to IP.World
        </h2>
      </div>
    </motion.div>
  )
}
