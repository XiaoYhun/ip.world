"use client"

import type React from "react"
import { ReactElement, useCallback, useEffect, useRef, useState } from "react"
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

export function LivePurchaseParticles() {
  const latestEvent = useWatchUserEvent()

  const [particles, setParticles] = useState<
    Array<{
      id: string
      username: string
      amount: string
      x: number
      y: number
      delay: number
      duration: number
      xOffset: number
      type: ParticleType
    }>
  >([])

  const maxParticles = 9999999999
  const containerRef = useRef<HTMLDivElement>(null)
  const particlesCountRef = useRef(0)

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
              <path d="M12 20l6-6h-4V4h-4v10H6z" />
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
    // return token.symbol ? `${event.amount_usd || "0"} ${token.symbol}` : ""
  }, [])

  // Add a new particle based on real event data
  const addParticle = useCallback(
    (event: UserEvent[]) => {
      if (!containerRef.current || particlesCountRef.current >= maxParticles) return

      // Handle both array and single event cases
      const events = Array.isArray(event) ? event : [event]

      for (const singleEvent of events) {
        if (particlesCountRef.current >= maxParticles) break

        const containerRect = containerRef.current.getBoundingClientRect()
        const cardWidth = containerRect.width
        const cardHeight = containerRect.height

        // Calculate position to be around the card
        let x, y
        const position = Math.floor(Math.random() * 4)

        switch (position) {
          case 0: // Left side
            x = -cardWidth * 0.3 - Math.random() * (cardWidth * 0.2)
            y = Math.random() * cardHeight
            break
          case 1: // Right side
            x = cardWidth + Math.random() * (cardWidth * 0.2)
            y = Math.random() * cardHeight
            break
          case 2: // Bottom
            x = Math.random() * cardWidth
            y = cardHeight + Math.random() * (cardHeight * 0.2)
            break
          case 3: // Top
            x = Math.random() * cardWidth
            y = -cardHeight * 0.3 - Math.random() * (cardHeight * 0.2)
            break
          default:
            x = Math.random() * cardWidth
            y = Math.random() * cardHeight
        }

        const randomXOffset = Math.floor(Math.random() * 20 - 10)
        const type = singleEvent.event_type === "trade" ? singleEvent.event_subtype || "" : singleEvent.event_type
        const particleType = getParticleType(type)

        // Shorten wallet address for display
        const walletAddress = singleEvent.user_wallet_address
        const username = walletAddress ? truncateAddress(walletAddress) : "Anonymous"

        const newParticle = {
          id: String(new Date().toString() + singleEvent.id + Math.random().toString(36).substring(2, 9)),
          username,
          amount: generateAmount(singleEvent),
          x,
          y,
          delay: 0.1,
          duration: 5,
          xOffset: randomXOffset,
          type: particleType,
          subType: singleEvent.event_subtype,
        }

        setParticles((prev) => [...prev, newParticle])
      }
    },
    [generateAmount]
  )

  // Add particles when new events come in
  useEffect(() => {
    if (latestEvent && latestEvent.length > 0) {
      const timeoutIds: NodeJS.Timeout[] = [] // To store timeout IDs for cleanup

      latestEvent.forEach((event: UserEvent, index) => {
        const timeoutId = setTimeout(() => {
          addParticle([event])
        }, index * 2000) // Each subsequent event gets an additional 2s delay

        timeoutIds.push(timeoutId)
      })

      // Cleanup function to clear any pending timeouts
      return () => {
        timeoutIds.forEach((id) => clearTimeout(id))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestEvent])

  // Add initial particles when token changes
  useEffect(() => {
    setParticles([])
    particlesCountRef.current = 0
  }, [])

  // Mock particles for development were here. They are commented out to avoid
  // extra visual noise in production and rely solely on live user events.

  return (
    <div ref={containerRef} key={"live-price"} className="pointer-events-none absolute inset-0 z-20 overflow-visible w-full">
      {particles.slice(-15).map((particle) => {
        const config = getParticleConfig(particle.type)
        return (
          <div
            key={particle.id}
            className="absolute flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-2 py-1 text-xs whitespace-nowrap backdrop-blur-sm"
            style={
              {
                left: `${particle.x}px`,
                top: `${particle.y}px`,
                opacity: 0,
                animation: `float-up-bounce ${particle.duration}s forwards ${particle.delay}s`,
                "--random-x": particle.xOffset,
              } as React.CSSProperties
            }
          >
            {config.icon}
            <span className="font-medium text-white/90">{particle.username}</span>
            <span className={config.color}>{config.action}</span>
            <span className="rainbow-text font-bold">{particle.amount}</span>
          </div>
        )
      })}
    </div>
  )
}
