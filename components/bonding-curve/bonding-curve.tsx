"use client"

import { memo, useEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"
import { SparkleCanvas } from "./sparkle-canvas"
import { cn } from "@/lib/utils"
import "./bonding-curve.css"

interface BondingCurveProps {
  /** Progress 0–100 */
  value: number
  /** Bar height in px (default: 12) */
  barHeight?: number
  /** Show percentage label (default: true) */
  showLabel?: boolean
  /** Show sparkle particles (default: true) */
  showSparkles?: boolean
  /** Additional class on wrapper */
  className?: string
}

/**
 * Animated bonding curve progress bar with purple-to-pink gradient,
 * shimmer sweep, sparkle particles + emoji eruptions on value change.
 * Static state: clean bar, no glow, no particles.
 */
const BondingCurve = memo(({
  value,
  barHeight = 12,
  showLabel = true,
  showSparkles = true,
  className,
}: BondingCurveProps) => {
  const [animPct, setAnimPct] = useState(value)
  const barRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<number | null>(null)
  const targetRef = useRef(value)
  const currentRef = useRef(value)
  const velocityRef = useRef(0)
  const prevValueRef = useRef(value)

  useEffect(() => {
    const delta = Math.abs(value - prevValueRef.current)
    velocityRef.current = Math.min(10, velocityRef.current + delta * 2)
    prevValueRef.current = value
    targetRef.current = value
  }, [value])

  useEffect(() => {
    const animate = () => {
      const diff = targetRef.current - currentRef.current
      if (Math.abs(diff) > 0.05) {
        currentRef.current += diff * 0.06
        setAnimPct(currentRef.current)
      } else {
        currentRef.current = targetRef.current
        setAnimPct(targetRef.current)
      }
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current)
    }
  }, [])

  const ratio = Math.min(Math.max(animPct, 0), 100) / 100
  const complete = animPct >= 99.5

  const gradientStyle: CSSProperties =
    ratio > 0.001
      ? {
          background: "linear-gradient(90deg, #C093FF 0%, #8945E7 33%, #FC42FF 66%, #FF4297 100%)",
          backgroundSize: `${(1 / ratio) * 100}% 100%`,
          boxShadow: complete
            ? "0 0 20px #FF429788, 0 0 40px #FF429744"
            : "none",
        }
      : { background: "transparent" }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div style={{ position: "relative", flex: 1 }}>
        <div
          ref={barRef}
          className="cmc-bar"
          style={{
            position: "relative",
            width: "100%",
            height: barHeight,
            borderRadius: "32px",
            background: "#1a1a1a",
            overflow: "hidden",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)",
          }}
        >
          {/* Filled portion with gradient */}
          <div
            className={complete ? "cmc-glow-pulse" : ""}
            style={{
              position: "absolute",
              inset: 0,
              width: `${animPct}%`,
              borderRadius: "32px",
              transition: "box-shadow 0.4s ease",
              ...gradientStyle,
            }}
          />
          {/* Shimmer sweep */}
          <div
            className="cmc-shimmer-layer"
            style={{
              position: "absolute",
              inset: 0,
              width: `${animPct}%`,
              borderRadius: "32px",
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
              backgroundSize: "200% 100%",
            }}
          />
          {/* Bright edge at fill tip */}
          {ratio > 0.01 && (
            <div
              className="cmc-edge-glow"
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${Math.max(0, animPct - 2)}%`,
                width: "4%",
                borderRadius: "32px",
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                filter: "blur(2px)",
              }}
            />
          )}
        </div>

        {showSparkles && (
          <SparkleCanvas fillRatio={ratio} velocityRef={velocityRef} barRef={barRef} />
        )}
      </div>

      {showLabel && (
        <span
          style={{
            fontFamily: "var(--font-mono, ui-monospace, monospace)",
            fontWeight: 600,
            fontSize: "inherit",
            color: "#fff",
            lineHeight: 1,
            minWidth: "3em",
            textAlign: "right",
          }}
        >
          {Math.round(animPct)}%
        </span>
      )}
    </div>
  )
})

BondingCurve.displayName = "BondingCurve"

export default BondingCurve
