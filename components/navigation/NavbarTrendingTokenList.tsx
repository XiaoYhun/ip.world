"use client"

import { useRef, useState, useMemo, useEffect, memo } from "react"
import { motion, useAnimationFrame, useMotionValue } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Remix } from "@/types/remix"
import { formatNumber } from "@/lib/number"
import { useTokenMetrics } from "@/context/token-metrics-context"

const SPEED = 15       // px per second at full speed
const LERP = 0.03      // interpolation factor — controls how quickly auto-scroll speed changes
const WHEEL_MULTIPLIER = 0.05
const WHEEL_FRICTION = 0.95  // velocity decay per frame (lower = stops faster)

export default function NavbarTrendingTokenList({ trendingTokens }: { trendingTokens: Remix[] }) {
  const x = useMotionValue(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const setRef = useRef<HTMLDivElement>(null)
  const currentSpeed = useRef(SPEED)
  const wheelVelocity = useRef(0)
  const [hovered, setHovered] = useState(false)
  const metricsMap = useTokenMetrics()

  // Re-sort tokens by live trending score from Electric, falling back to server order
  const sortedTokens = useMemo(() => {
    if (!metricsMap || metricsMap.size === 0) return trendingTokens

    return [...trendingTokens].sort((a, b) => {
      const scoreA = metricsMap.get(a.token_address.toLowerCase())?.trending_score_24h ?? 0
      const scoreB = metricsMap.get(b.token_address.toLowerCase())?.trending_score_24h ?? 0
      return scoreB - scoreA
    })
  }, [trendingTokens, metricsMap])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      // Accumulate into velocity — animation frame applies + decays it smoothly
      wheelVelocity.current -= e.deltaY * WHEEL_MULTIPLIER
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [])

  useAnimationFrame((_, delta) => {
    const setWidth = setRef.current?.offsetWidth ?? 0
    if (setWidth === 0) return

    // Lerp auto-scroll speed toward target (0 when hovered, SPEED when not)
    const target = hovered ? 0 : SPEED
    currentSpeed.current += (target - currentSpeed.current) * LERP

    // Apply auto-scroll + wheel momentum together, then decay wheel velocity
    let next = x.get() - (delta / 1000) * currentSpeed.current + wheelVelocity.current
    wheelVelocity.current *= WHEEL_FRICTION

    // Clamp tiny residual velocity to zero
    if (Math.abs(wheelVelocity.current) < 0.01) wheelVelocity.current = 0

    // Wrap around the duplicate set
    if (next <= -setWidth) next += setWidth
    if (next > 0) next -= setWidth
    x.set(next)
  })

  if (!sortedTokens || sortedTokens.length === 0) return null

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-linear-to-r from-black to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-linear-to-l from-black to-transparent" />

      <motion.div style={{ x, display: "flex" }}>
        {/* Primary set — measured for reset boundary */}
        <div ref={setRef} className="flex shrink-0 items-center gap-2 px-1">
          {sortedTokens.map((token, index) => (
            <TokenItem key={token.token_address} token={token} rank={index + 1} />
          ))}
        </div>
        {/* Duplicate set — fills the gap while primary resets */}
        <div className="flex shrink-0 items-center gap-2 px-1" aria-hidden>
          {sortedTokens.map((token, index) => (
            <TokenItem key={token.token_address} token={token} rank={index + 1} />
          ))}
        </div>
        {/* Duplicate set — fills the gap while primary resets */}
        <div className="flex shrink-0 items-center gap-2 px-1" aria-hidden>
          {sortedTokens.map((token, index) => (
            <TokenItem key={token.token_address} token={token} rank={index + 1} />
          ))}
        </div>
      </motion.div>
    </div>
  )
}

const TokenItem = memo(function TokenItem({ token, rank }: { token: Remix, rank: number }) {
  const metricsMap = useTokenMetrics()
  const metrics = metricsMap.get(token.token_address.toLowerCase())
  const mcapChange24h = metrics?.market_cap_change_24h ?? token.market_cap_change ?? 0
  const isPositive = mcapChange24h > 0
  return (
    <Link href={`/token/${token.token_address}`} className="hover:bg-neutral-700 flex cursor-pointer items-center gap-[3px] rounded-[8px] px-3 py-2 text-xs border group transition-colors duration-200">
      <div className="text-neutral-400 group-hover:text-neutral-300 transition-colors duration-200">#{rank}</div>
      {token.image ? (
        <div className="relative size-4 shrink-0 overflow-hidden rounded-[4px]">
          <Image src={token.image} alt={token.name} fill className="object-cover" />
        </div>
      ) : (
        <div className="size-4 shrink-0 rounded-[4px] bg-neutral-700" />
      )}
      <div className="font-semibold">${token.symbol}</div>
      <div className={cn("font-medium", isPositive ? "text-green-neon" : "text-pink-neon")}>{formatNumber(mcapChange24h, 2)}%</div>
    </Link>
  )
}, (prevProps, nextProps) => {
  return prevProps.token.token_address === nextProps.token.token_address && prevProps.rank === nextProps.rank
})
