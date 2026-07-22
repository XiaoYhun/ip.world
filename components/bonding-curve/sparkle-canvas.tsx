"use client"

import { useEffect, useRef } from "react"
import type { MutableRefObject, RefObject } from "react"

interface Particle {
  x: number; y: number; vx: number; vy: number
  life: number; maxLife: number; size: number; color: string
  type: "spark" | "glitter" | "trail"
}

interface EmojiParticle {
  x: number; y: number; vx: number; vy: number
  life: number; maxLife: number; size: number; emoji: string
  rotation: number; rotationSpeed: number
}

const COLORS = ["#C093FF", "#8945E7", "#FC42FF", "#FF4297", "#ffffff", "#e8b0ff", "#ffa0d0"]
const EMOJIS = ["🚀", "💎", "🔥", "⚡", "✨", "🌙", "💸", "🎉", "💰", "🌊"]

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a)
}

export function SparkleCanvas({
  fillRatio,
  velocityRef,
  barRef,
}: {
  fillRatio: number
  velocityRef: MutableRefObject<number>
  barRef: RefObject<HTMLDivElement | null>
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const emojisRef = useRef<EmojiParticle[]>([])
  const rafRef = useRef<number | null>(null)
  const fillRatioRef = useRef(fillRatio)

  useEffect(() => {
    fillRatioRef.current = fillRatio
  }, [fillRatio])

  useEffect(() => {
    const canvas = canvasRef.current
    const bar = barRef.current
    if (!canvas || !bar) return

    const ctx = canvas.getContext("2d")!

    const resize = () => {
      canvas.width = bar.offsetWidth
      canvas.height = bar.offsetHeight + 200
      canvas.style.width = bar.offsetWidth + "px"
      canvas.style.height = bar.offsetHeight + 200 + "px"
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(bar)

    const CANVAS_TOP_OFFSET = 160

    const isActive = () => {
      const r = fillRatioRef.current
      const v = velocityRef.current
      return r > 0.001 && v > 0.1
    }

    const emit = () => {
      if (!isActive()) return
      const ratio = fillRatioRef.current
      const fillX = ratio * canvas.width
      const barCenterY = CANVAS_TOP_OFFSET + (bar.offsetHeight || 12) / 2
      const v = velocityRef.current
      const fillMult = Math.pow(ratio, 0.8)

      // Edge particles (at fill tip)
      const count = Math.floor(v * randomBetween(0.4, 1.2) * fillMult)
      for (let i = 0; i < count; i++) {
        const type: Particle["type"] =
          Math.random() < 0.5 ? "spark" : Math.random() < 0.7 ? "glitter" : "trail"
        particlesRef.current.push({
          x: fillX + randomBetween(-8, 8),
          y: barCenterY + randomBetween(-6, 6),
          vx: randomBetween(-1.5, 1.5) * (0.6 + v * 0.08),
          vy: randomBetween(-3.5, -0.5) * (0.6 + v * 0.08),
          life: 1, maxLife: randomBetween(0.4, 1),
          size: type === "glitter" ? randomBetween(1, 3) : randomBetween(2, 5),
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          type,
        })
      }

      // Trail particles along the bar
      const trailCount = Math.floor(v * randomBetween(0.15, 0.5) * fillMult)
      for (let i = 0; i < trailCount; i++) {
        particlesRef.current.push({
          x: randomBetween(0, fillX),
          y: barCenterY + randomBetween(-4, 4),
          vx: randomBetween(-0.3, 0.3),
          vy: randomBetween(-2, -0.2),
          life: 1, maxLife: randomBetween(0.2, 0.6),
          size: randomBetween(1, 2.5),
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          type: "glitter",
        })
      }
    }

    let lastEmit = 0
    const EMIT_INTERVAL = 40
    let lastEmojiEmit = 0
    let nextEmojiInterval = randomBetween(1600, 2800)

    const emitEmoji = () => {
      if (!isActive()) return
      const ratio = fillRatioRef.current
      const fillX = ratio * canvas.width
      const barCenterY = CANVAS_TOP_OFFSET + (bar.offsetHeight || 12) / 2
      emojisRef.current.push({
        x: fillX + randomBetween(-20, 20),
        y: barCenterY + randomBetween(-8, 0),
        vx: randomBetween(-0.8, 0.8),
        vy: randomBetween(-3.5, -2.0),
        life: 1, maxLife: 1,
        size: randomBetween(18, 26),
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
        rotation: randomBetween(-0.4, 0.4),
        rotationSpeed: randomBetween(-0.03, 0.03),
      })
    }

    const draw = (ts: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      velocityRef.current = Math.max(0, velocityRef.current * 0.92)

      if (ts - lastEmit > EMIT_INTERVAL) {
        emit()
        lastEmit = ts
      }

      if (ts - lastEmojiEmit > nextEmojiInterval) {
        emitEmoji()
        lastEmojiEmit = ts
        const fm = Math.pow(Math.max(fillRatioRef.current, 0.01), 0.8)
        nextEmojiInterval = randomBetween(1600, 2800) / Math.max(fm, 0.1)
      }

      const decay = 0.016
      particlesRef.current = particlesRef.current.filter((p) => p.life > 0)
      if (particlesRef.current.length > 200) {
        particlesRef.current = particlesRef.current.slice(-200)
      }

      for (const p of particlesRef.current) {
        const alpha = p.life / p.maxLife
        ctx.save()
        ctx.globalAlpha = Math.pow(alpha, 1.5) * 0.9

        if (p.type === "spark") {
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(p.x - p.vx * 4, p.y - p.vy * 4)
          ctx.strokeStyle = p.color
          ctx.lineWidth = p.size * 0.6
          ctx.lineCap = "round"
          ctx.shadowColor = p.color
          ctx.shadowBlur = 6
          ctx.stroke()
        } else if (p.type === "glitter") {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2)
          ctx.fillStyle = p.color
          ctx.shadowColor = p.color
          ctx.shadowBlur = p.size * 3
          ctx.fill()
        } else {
          const r = p.size * 0.4
          ctx.beginPath()
          for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2
            const x = p.x + Math.cos(angle) * r * 2.5
            const y = p.y + Math.sin(angle) * r * 2.5
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
            ctx.lineTo(
              p.x + Math.cos(angle + Math.PI / 4) * r * 0.6,
              p.y + Math.sin(angle + Math.PI / 4) * r * 0.6,
            )
          }
          ctx.closePath()
          ctx.fillStyle = p.color
          ctx.shadowColor = p.color
          ctx.shadowBlur = 8
          ctx.fill()
        }

        ctx.restore()
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.04
        p.life -= decay
      }

      // Emoji particles
      const emojiDecay = 0.008
      emojisRef.current = emojisRef.current.filter((e) => e.life > 0)

      for (const e of emojisRef.current) {
        const alpha = Math.pow(e.life / e.maxLife, 1.2)
        const scale = 0.6 + (1 - e.life / e.maxLife) * 0.6
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.translate(e.x, e.y)
        ctx.rotate(e.rotation)
        ctx.scale(scale, scale)
        ctx.font = `${e.size}px serif`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(e.emoji, 0, 0)
        ctx.restore()

        e.x += e.vx
        e.y += e.vy
        e.vy += 0.025
        e.rotation += e.rotationSpeed
        e.life -= emojiDecay
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [barRef, velocityRef])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        left: 0,
        top: "-160px",
        pointerEvents: "none",
        zIndex: 10,
      }}
    />
  )
}
