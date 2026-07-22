"use client"

import { AnimatePresence, Easing, motion } from "framer-motion"
import Link from "next/link"
import React, { ReactElement, useEffect, useState } from "react"
import { useWatchUserEvent } from "@/hooks/use-watch-user-event"
import { formatNumberWithSuffix } from "@/lib/number"
import { UserEvent } from "@/lib/schema/user-events-schema"
import { truncateAddress } from "@/lib/strings"

type ParticleType = "buy" | "sell" | "remix" | "create"

interface ParticleConfig {
  action: string
  color: string
  icon: ReactElement
}

const LatestEventBanner = () => {
  const latestEvent = useWatchUserEvent()
  const [queue, setQueue] = useState<UserEvent[]>([])
  const [particles, setParticles] = useState<
    Array<{
      id: string
      username: string
      amount: string
      type: ParticleType
      content_id: string
    }>
  >([])

  // Helper functions defined before use
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
        return "create"
    }
  }

  const generateAmount = (event: UserEvent): string => {
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
  }

  // Add latestEvent to queue whenever new data comes
  useEffect(() => {
    if (latestEvent && latestEvent.length > 0) {
      setQueue((prev) => [...prev, ...latestEvent])
    }
  }, [latestEvent])

  // Every 2 seconds, move 1 event from queue -> particles
  useEffect(() => {
    if (queue.length === 0) return
    const interval = setInterval(() => {
      setQueue((prevQueue) => {
        if (prevQueue.length === 0) return prevQueue
        const [nextEvent, ...rest] = prevQueue

        const walletAddress = nextEvent.user_wallet_address
        const username = walletAddress ? truncateAddress(walletAddress) : "Anonymous"
        const type = nextEvent.event_type === "trade" ? nextEvent.event_subtype || "" : nextEvent.event_type
        const particleType = getParticleType(type)

        setParticles((prev) => {
          const newParticle = {
            id: `${Date.now()}-${Math.random()}`,
            username,
            amount: generateAmount(nextEvent),
            type: particleType,
            content_id: nextEvent?.metadata?.ip_metadata
              ? nextEvent?.metadata?.ip_metadata?.ip_handle
              : (nextEvent?.metadata?.remix_metadata?.remix_token_address as string),
          }

          // ✅ Keep max 3
          if (prev.length >= 2) {
            return [...prev.slice(1), newParticle]
          }
          return [...prev, newParticle]
        })

        return rest
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [queue, getParticleType, generateAmount])

  // Remove old particles after 10 seconds
  useEffect(() => {
    if (particles.length === 0) return
    const timeout = setTimeout(() => {
      setParticles((prev) => prev.slice(1))
    }, 10000)
    return () => clearTimeout(timeout)
  }, [particles])

  const getParticleConfig = (type: ParticleType): ParticleConfig => {
    switch (type) {
      case "buy":
        return {
          action: "bought",
          color: "text-green-400",
          icon: (
            <svg className="h-2.5 min-h-2.5 w-2.5 min-w-2.5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 4l-6 6h4v10h4V10h4z" />
            </svg>
          ),
        }
      case "sell":
        return {
          action: "sold",
          color: "text-red-400",
          icon: (
            <svg className="h-2.5 min-h-2.5 w-2.5 min-w-2.5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 20l6-6h-4V4h-4v10H6z" />
            </svg>
          ),
        }
      case "remix":
        return {
          action: "remixed",
          color: "text-purple-400",
          icon: (
            <svg className="h-2.5 min-h-2.5 w-2.5 min-w-2.5 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
            </svg>
          ),
        }
      case "create":
        return {
          action: "created",
          color: "text-pink-400",
          icon: (
            <svg className="h-2.5 min-h-2.5 w-2.5 min-w-2.5 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          ),
        }
    }
  }

  const itemVariants = {
    initial: { opacity: 0, x: 100 },
    animate: () => ({
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 1, // slower entrance
        ease: "easeOut" as Easing, // softer easing
      },
    }),
    exit: { opacity: 0, x: -100, transition: { duration: 0.4, ease: "easeInOut" as Easing } },
  }

  return (
    <div className="z-10 flex h-8 w-full flex-1 items-center gap-2 px-1 py-1">
      <div className="group relative h-8 flex-1">
        <div className="absolute left-0 flex w-fit gap-1">
          <AnimatePresence>
            {particles.map((particle, index) => {
              const config = getParticleConfig(particle.type)
              return (
                <Link
                  key={particle.id}
                  href={particle.type === "create" ? `/ip/${particle.content_id}` : `/token/${particle.content_id}`}
                >
                  <motion.div
                    layout
                    custom={index} // ✅ Pass index to variants for stagger
                    variants={itemVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="relative flex max-w-[17.5rem] items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs whitespace-nowrap backdrop-blur-sm"
                  >
                    {config.icon}
                    <span className="font-medium text-white/90">{particle.username}</span>
                    <span className={config.color}>{config.action}</span>
                    <span className="rainbow-text max-w-[11rem] truncate font-bold">{particle.amount}</span>
                  </motion.div>
                </Link>
              )
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default LatestEventBanner
