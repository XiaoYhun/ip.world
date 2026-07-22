"use client"

import { useRef, useEffect, useCallback } from "react"

interface TextParticle {
  tx: number
  ty: number
  x: number
  y: number
  sx: number
  sy: number
  radius: number
  baseOpacity: number
  phase: number
  driftSpeed: number
}

interface ParticleCanvasProps {
  isRevealed: boolean
  width: number
  height: number
  text?: string
  fontSize?: number
  textAlign?: "center" | "left"
  textPadding?: number
  textPaddingTop?: number
}

export function ParticleCanvas({
  isRevealed,
  width,
  height,
  text = "5Kb8kLf9zgWQn0gJdH3Ux3s5aP6rVH",
  fontSize = 14,
  textAlign = "center",
  textPadding = 0,
  textPaddingTop,
}: ParticleCanvasProps) {
  const paddingTop = textPaddingTop ?? textPadding
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<TextParticle[]>([])
  const animationRef = useRef<number>(0)
  const progressRef = useRef(0)
  const isRevealedRef = useRef(isRevealed)

  useEffect(() => {
    isRevealedRef.current = isRevealed
  }, [isRevealed])

  const sampleTextPositions = useCallback(() => {
    const offscreen = document.createElement("canvas")
    const scale = 2
    offscreen.width = width * scale
    offscreen.height = height * scale
    const ctx = offscreen.getContext("2d")
    if (!ctx) return []

    ctx.scale(scale, scale)
    ctx.fillStyle = "#ffffff"
    ctx.font = `${fontSize}px "Geist Mono", monospace`

    if (textAlign === "left") {
      ctx.textBaseline = "top"
      ctx.textAlign = "left"

      const maxWidth = width - textPadding * 2
      const lineHeight = fontSize * 1.5
      const words = text.split("")
      let line = ""
      let lineY = paddingTop

      for (const char of words) {
        const testLine = line + char
        const metrics = ctx.measureText(testLine)
        if (metrics.width > maxWidth && line.length > 0) {
          ctx.fillText(line, textPadding, lineY)
          line = char
          lineY += lineHeight
        } else {
          line = testLine
        }
      }
      if (line) {
        ctx.fillText(line, textPadding, lineY)
      }
    } else {
      ctx.textBaseline = "middle"
      ctx.textAlign = "center"
      ctx.fillText(text, width / 2, height / 2)
    }

    const imageData = ctx.getImageData(0, 0, offscreen.width, offscreen.height)
    const positions: { x: number; y: number }[] = []

    const step = 1
    for (let py = 0; py < offscreen.height; py += step) {
      for (let px = 0; px < offscreen.width; px += step) {
        const i = (py * offscreen.width + px) * 4
        const alpha = imageData.data[i + 3]
        if (alpha > 60) {
          positions.push({ x: px / scale, y: py / scale })
        }
      }
    }

    return positions
  }, [width, height, text, fontSize, textAlign, textPadding, paddingTop])

  const initParticles = useCallback(() => {
    const positions = sampleTextPositions()
    if (positions.length === 0) return

    const maxParticles = Math.min(positions.length, 1400)
    const step = Math.max(1, Math.floor(positions.length / maxParticles))

    const particles: TextParticle[] = []
    for (let i = 0; i < positions.length; i += step) {
      const pos = positions[i]
      const angle = Math.random() * Math.PI * 2
      const dist = Math.random() * 4 + 1
      const sx = Math.cos(angle) * dist
      const sy = Math.sin(angle) * dist

      particles.push({
        tx: pos.x,
        ty: pos.y,
        x: pos.x + sx,
        y: pos.y + sy,
        sx,
        sy,
        radius: Math.random() * 0.4 + 0.15,
        baseOpacity: Math.random() * 0.5 + 0.35,
        phase: Math.random() * Math.PI * 2,
        driftSpeed: Math.random() * 0.012 + 0.004,
      })
    }

    particlesRef.current = particles
  }, [sampleTextPositions])

  useEffect(() => {
    if (width > 0 && height > 0) {
      initParticles()
    }
  }, [initParticles, width, height])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    const animate = () => {
      ctx.clearRect(0, 0, width, height)

      const revealed = isRevealedRef.current

      if (revealed) {
        progressRef.current = Math.min(1, progressRef.current + 0.035)
      } else {
        progressRef.current = Math.max(0, progressRef.current - 0.03)
      }

      const progress = progressRef.current

      if (progress > 0.98 && revealed) {
        animationRef.current = requestAnimationFrame(animate)
        return
      }

      const globalAlpha = revealed ? Math.max(0, 1 - progress * 1.5) + 0.15 : 1

      particlesRef.current.forEach((p) => {
        p.phase += p.driftSpeed

        const t = progress
        const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

        const driftX = Math.sin(p.phase) * (1 - ease) * 0.8
        const driftY = Math.cos(p.phase * 0.7) * (1 - ease) * 0.6

        p.x = p.tx + p.sx * (1 - ease) + driftX
        p.y = p.ty + p.sy * (1 - ease) + driftY

        const twinkle = (Math.sin(p.phase * 3) + 1) / 2
        const twinkleStrength = 0.2 + (1 - ease) * 0.5
        const opacity =
          p.baseOpacity *
          (1 - twinkleStrength * 0.4 + twinkle * twinkleStrength * 0.4) *
          globalAlpha

        if (opacity > 0.01) {
          const glowSize = p.radius * (1.5 + (1 - ease) * 1)

          ctx.beginPath()
          ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2)
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize)
          gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity * 0.5})`)
          gradient.addColorStop(1, `rgba(255, 255, 255, 0)`)
          ctx.fillStyle = gradient
          ctx.fill()

          ctx.beginPath()
          ctx.arc(p.x, p.y, p.radius * 0.3, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, opacity * 1.3)})`
          ctx.fill()
        }
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [width, height])

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
    />
  )
}
