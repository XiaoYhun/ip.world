"use client"

import { AnimatePresence, AnimationGeneratorType, motion } from "framer-motion"
import Link from "next/link"
import React, { ReactElement, useCallback, useEffect, useState } from "react"
import { useWatchUserEvent } from "@/hooks/use-watch-user-event"
import { formatNumberWithSuffix } from "@/lib/number"
import { UserEvent } from "@/lib/schema/user-events-schema"
import { truncateAddress } from "@/lib/strings"

// Particle types based on event_subtype
type ParticleType = "buy" | "sell" | "remix" | "create"

interface ParticleConfig {
  action: string
  color: string
  icon: ReactElement
}

type Particle = {
  id: string
  username: string
  amount: string
  type: ParticleType
  subType: string
  metadataId: string
}
type Particles = Array<Particle>

const LatestEvent = () => {
  const latestEvent = useWatchUserEvent()
  const [ipParticles, setIpParticles] = useState<Particles>([])

  const [remixParticles, setRemixParticles] = useState<Particles>([])

  const [activeIpIndex, setActiveIpIndex] = useState(0)
  const [activeRemixIndex, setActiveRemixIndex] = useState(0)

  useEffect(() => {
    if (latestEvent && latestEvent.length > 0) {
      const tempIpParticles: React.SetStateAction<Particles> = []
      const tempRemixParticles: React.SetStateAction<Particles> = []

      latestEvent?.forEach((event) => {
        const walletAddress = event.user_wallet_address
        const username = walletAddress ? truncateAddress(walletAddress) : "Anonymous"

        const type = event.event_type === "trade" ? event.event_subtype || "" : event.event_type
        const particleType = getParticleType(type)

        const metadataId = event?.metadata?.remix_metadata
          ? event?.metadata?.remix_metadata?.remix_token_address
          : event?.metadata?.ip_metadata?.ip_handle
        const newParticle = {
          id: String(new Date().toString() + event.id + Math.random().toString(36).substring(2, 9)),
          username,
          amount: generateAmount(event),
          type: particleType,
          subType: event.event_subtype || "",
          metadataId: metadataId as string,
        }

        if (particleType === "create") {
          tempIpParticles.push(newParticle)
        } else {
          tempRemixParticles.push(newParticle)
        }
      })

      setIpParticles(tempIpParticles)
      setRemixParticles(tempRemixParticles)

      const intervals: NodeJS.Timeout[] = []

      if (tempIpParticles.length > 1) {
        intervals.push(
          setInterval(() => {
            setActiveIpIndex((prev) => (prev + 1) % tempIpParticles.length)
          }, 3000)
        )
      }

      if (tempRemixParticles.length > 1) {
        // Start the remix animation 1.5 seconds after the ip animation
        intervals.push(
          setTimeout(() => {
            intervals.push(
              setInterval(() => {
                setActiveRemixIndex((prev) => (prev + 1) % tempRemixParticles.length)
              }, 3000)
            )
          }, 1500)
        )
      }

      return () => intervals.forEach((interval) => clearInterval(interval))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestEvent])

  // Particle type configurations
  const getParticleConfig = (type: ParticleType): ParticleConfig => {
    switch (type) {
      case "buy":
        return {
          action: "bought",
          color: "text-green-400",
          icon: (
            <svg className="h-1.5 w-1.5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 4l-6 6h4v10h4V10h4z" />
            </svg>
          ),
        }
      case "sell":
        return {
          action: "sold",
          color: "text-red-400",
          icon: (
            <svg className="h-1.5 w-1.5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 20l6-6h-4v-10h-4v10H6z" />
            </svg>
          ),
        }
      case "remix":
        return {
          action: "remixed",
          color: "text-purple-400",
          icon: (
            <svg className="h-1.5 w-1.5 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
            </svg>
          ),
        }
      case "create":
        return {
          action: "created",
          color: "text-pink-400",
          icon: (
            <svg className="h-1.5 w-1.5 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          ),
        }
      default:
        return {
          action: "bought",
          color: "text-green-400",
          icon: (
            <svg className="h-1.5 w-1.5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 4l-6 6h4v10h4V10h4z" />
            </svg>
          ),
        }
    }
  }

  // Map event_subtype to ParticleType
  const getParticleType = (eventSubtype: string): ParticleType => {
    switch (eventSubtype) {
      case "create_ip":
        return "create"
      case "create_token":
        return "remix"
      case "buy":
        return "buy"
      case "sell":
        return "sell"
      default:
        return "create" // default to create for unknown types
    }
  }

  // Generate display amount based on event data
  const generateAmount = useCallback((event: UserEvent): string => {
    if (event.event_type === "create_token") {
      return "$" + event.metadata?.remix_metadata?.remix_symbol
    }
    if (event.event_type === "create_ip") {
      return event.metadata?.ip_metadata?.ip_title || ""
    }

    if (event.event_type === "trade") {
      return `$${formatNumberWithSuffix(Number(event?.amount_usd || 0))} ${event?.metadata?.remix_metadata?.remix_symbol}`
    }

    return ""
  }, [])

  const particleVariants = {
    enter: { y: 20, opacity: 0 },
    center: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 },
  }

  const transition = {
    y: { type: "spring" as AnimationGeneratorType, stiffness: 300, damping: 30 },
    opacity: { duration: 0.2 },
  }

  return (
    <div className="flex w-full items-center gap-2 px-4 py-4 md:py-0">
      <div className="min-w-0 flex-1">
        <div className="flex w-fit gap-2">
          {/* IP Particles */}
          <div className="relative h-8 w-[14rem]">
            <AnimatePresence mode="wait">
              {ipParticles.length > 0 && (
                <Link href={`/ip/${ipParticles[activeIpIndex]?.metadataId}`}>
                  <motion.div
                    key={ipParticles[activeIpIndex]?.id || "empty"}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    variants={particleVariants}
                    transition={transition}
                    className="absolute w-full max-w-[14rem] cursor-pointer overflow-hidden rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs whitespace-nowrap backdrop-blur-sm"
                  >
                    <span className={`flex items-center gap-1.5`}>
                      <span className="font-medium text-white/90">{ipParticles[activeIpIndex]?.username}</span>
                      <span className={getParticleConfig(ipParticles[activeIpIndex]?.type).color}>
                        {getParticleConfig(ipParticles[activeIpIndex]?.type).action}
                      </span>
                      <span className="rainbow-text max-w-[9rem] truncate font-bold">
                        {ipParticles[activeIpIndex]?.amount}
                      </span>
                    </span>
                  </motion.div>
                </Link>
              )}
            </AnimatePresence>
          </div>

          {/* Remix Particles */}
          <div className="relative h-8 w-[15.5rem]">
            <AnimatePresence mode="wait">
              {remixParticles.length > 0 && (
                <Link href={`/token/${remixParticles[activeRemixIndex]?.metadataId}`}>
                  <motion.div
                    key={remixParticles[activeRemixIndex]?.id || "empty"}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    variants={particleVariants}
                    transition={transition}
                    className="absolute w-full max-w-[15.5rem] cursor-pointer overflow-hidden rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs whitespace-nowrap backdrop-blur-sm"
                  >
                    <span className={`flex items-center gap-1.5`}>
                      <span className="font-medium text-white/90">{remixParticles[activeRemixIndex]?.username}</span>
                      <span className={getParticleConfig(remixParticles[activeRemixIndex]?.type).color}>
                        {getParticleConfig(remixParticles[activeRemixIndex]?.type).action}
                      </span>
                      <span className="rainbow-text max-w-[9rem] truncate font-bold">
                        {remixParticles[activeRemixIndex]?.amount}
                      </span>
                    </span>
                  </motion.div>
                </Link>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LatestEvent
