"use client"

import React, { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface AnimatedProgressProps {
  value: number
  className?: string
  hideText?: boolean
  textInside?: boolean
  barHeight?: number
  speed?: number
}

// Static rainbow progress bar (no animation)
export const AnimatedProgress = ({ className, value, hideText = false }: AnimatedProgressProps) => {
  return (
    <div className={cn("flex w-full items-center gap-2", className)}>
      <div className="border-neutral-600 bg-progress relative flex h-full flex-1 overflow-hidden rounded-[10px] border">
        <div
          className="bg-gradient-progress-rainbow absolute inset-0"
          style={{
            WebkitMaskImage: `linear-gradient(to right, black ${value}%, transparent ${value}%)`,
            maskImage: `linear-gradient(to right, black ${value}%, transparent ${value}%)`,
            WebkitMaskSize: "100% 100%",
            maskSize: "100% 100%",
          }}
        />
      </div>
      {!hideText && <p className="text-xxs mr-1 text-neutral-200">{value}%</p>}
    </div>
  )
}

interface ProgressProps {
  value: number
  className?: string
}

// Brand-colored progress bar
export const Progress = ({ className, value }: ProgressProps) => {
  return (
    <div className={cn("bg-progress relative h-3 overflow-hidden rounded-[10px]", className)}>
      <div
        className="bg-gradient-progress-brand absolute inset-0"
        style={{
          WebkitMaskImage: `linear-gradient(to right, black ${value}%, transparent ${value}%)`,
          maskImage: `linear-gradient(to right, black ${value}%, transparent ${value}%)`,
          WebkitMaskSize: "100% 100%",
          maskSize: "100% 100%",
        }}
      />
    </div>
  )
}

// CSS-animated rainbow progress bar (with color repeats)
export const AnimatedProgressCSS = ({
  className,
  value,
  hideText = false,
  textInside = false,
}: AnimatedProgressProps) => {
  return (
    <div className={cn("flex w-full items-center gap-2", className)}>
      <div className="border-neutral-600 bg-progress relative flex h-full flex-1 overflow-hidden rounded-full border">
        <div
          className="bg-gradient-progress-rainbow-animated absolute inset-0"
          style={{
            WebkitMaskImage: `linear-gradient(to right, black ${value}%, transparent ${value}%)`,
            maskImage: `linear-gradient(to right, black ${value}%, transparent ${value}%)`,
            WebkitMaskSize: "100% 100%",
            maskSize: "100% 100%",
          }}
        />
      </div>
      {!hideText && (
        <p className={`${textInside && "ms-[-2.5rem]"} text-xxs z-[0] mr-1 font-bold text-neutral-200`}>{value}%</p>
      )}
    </div>
  )
}

// Canvas-based rainbow progress bar (true in-place animation, no color repeats)
export const AnimatedProgressRainbowCanvas = ({
  value,
  className = "",
  hideText = false,
  textInside = false,
  barHeight = 16,
  speed = 0.00125,
}: AnimatedProgressProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const animationRef = useRef(0)
  const [width, setWidth] = React.useState(0)
  const [isClient, setIsClient] = React.useState(false)
  const height = barHeight

  // Handle SSR - only run canvas logic on client
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !containerRef.current) return
    setWidth(containerRef.current.offsetWidth)
    const handleResize = () => setWidth(containerRef.current!.offsetWidth)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [isClient])

  useEffect(() => {
    if (!isClient) return
    const canvas = canvasRef.current
    if (!canvas || width === 0) return
    const ctx = canvas.getContext("2d")
    let frame = 0
    let running = true

    function draw() {
      if (!running || !ctx) return
      ctx.clearRect(0, 0, width, height)
      ctx.save()
      ctx.globalAlpha = 0.85 // glassy effect
      const offset = (frame * speed) % 1
      const grad = ctx.createLinearGradient(0, 0, width, 0)
      for (let i = 0; i <= 1; i += 0.01) {
        const hue = ((i - offset + 1) % 1) * 360
        grad.addColorStop(i, `hsl(${hue}, 100%, 50%)`)
      }
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, (value / 100) * width, height)
      ctx.restore()
      frame++
      animationRef.current = requestAnimationFrame(draw)
    }
    if (ctx) draw()
    return () => {
      running = false
      cancelAnimationFrame(animationRef.current)
    }
  }, [isClient, value, width, speed, height])

  return (
    <div
      ref={containerRef}
      className={cn("flex w-full items-center gap-2", className)}
      style={{ height, position: "relative" }}
    >
      <div className="relative flex h-full flex-1 overflow-hidden rounded-full bg-white/10">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{ display: "block", width: "100%", height: "100%", borderRadius: 9999 }}
        />
        {/* Glass overlay */}
        <div
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            background: "linear-gradient(180deg, rgba(0, 0, 0, 0.2) 0%, rgba(30, 30, 30, 0.2) 100%)",
          }}
        />
      </div>
      {!hideText && (
        <p
          className={`${textInside && "ms-[-2.5rem]"} text-xxs ${value === 100 ? "text-white" : "text-neutral-200"} z-[0] mr-1 font-bold`}
        >
          {value}%
        </p>
      )}
    </div>
  )
}

// Main export - defaults to canvas version for best visual effect
export default AnimatedProgressRainbowCanvas
