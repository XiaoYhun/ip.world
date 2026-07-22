"use client"
import { useEffect, useRef } from "react"

const HalftonePattern = ({ isHovered }: { isHovered: boolean }) => {
  const dots = []
  const spacing = 6
  const width = 267
  const height = 32
  const centerX = width / 2
  const centerY = height / 2
  const svgRef = useRef<SVGSVGElement>(null)
  const torusRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    if (!svgRef.current) return
    const circles = svgRef.current.querySelectorAll(".halftone-circle")

    const torusRing = torusRef.current

    if (isHovered) {
      // Calculate max distance for torus expansion
      const maxDistance = Math.sqrt(Math.pow(centerX, 2) + Math.pow(centerY, 2))

      // Create endlessly looping shockwave effect
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.3 })

      // Animate the visual torus ring
      if (torusRing) {
        // Calculate total animation time based on furthest circle
        const maxDelay = maxDistance * 0.01
        const totalDuration = maxDelay + 0.6 // Max delay + scale animation time

        tl.fromTo(
          torusRing,
          {
            attr: { r: 0, "stroke-width": 32 },
            opacity: 0.6,
          },
          {
            attr: { r: maxDistance, "stroke-width": 8 },
            opacity: 0.1,
            duration: totalDuration,
            ease: "none", // Linear timing to match distance delays
          },
          0
        )
      }

      circles.forEach((circle) => {
        const x = parseFloat(circle.getAttribute("cx") || "0")
        const y = parseFloat(circle.getAttribute("cy") || "0")
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2))

        // Set transform origin to circle's center
        gsap.set(circle, {
          transformOrigin: "center center",
          svgOrigin: `${x} ${y}`,
        })

        // Calculate delay based on distance (creates expanding ring)
        const delay = distance * 0.01

        // Add scale animation to timeline with staggered timing
        tl.to(
          circle,
          {
            scale: 1.6,
            duration: 0.2,
            ease: "back.out(1.2)",
          },
          delay
        ).to(
          circle,
          {
            scale: 1,
            duration: 0.2,
            ease: "power2.out",
          },
          delay + 0.4
        )
      })
    } else {
      // Reset all circles and kill timeline
      if (circles.length > 0 && torusRef.current) {
        gsap.killTweensOf([circles, torusRef.current])
        gsap.set(circles, {
          scale: 1,
          transformOrigin: "center center",
        })
      }

      if (torusRing) {
        gsap.set(torusRing, { attr: { r: 0 }, opacity: 0 })
      }
    }
  }, [isHovered, centerX, centerY, torusRef])

  for (let x = spacing / 2; x < width; x += spacing) {
    for (let y = spacing / 2; y < height; y += spacing) {
      // Calculate distance from center for concentric sizing
      const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2))
      const maxDistance = Math.sqrt(Math.pow(centerX, 2) + Math.pow(centerY, 2))
      const normalizedDistance = distance / maxDistance

      // Concentric sizing: larger on edges, smaller in center
      const maxSize = 2.2
      const minSize = 0.4
      const size = minSize + normalizedDistance * (maxSize - minSize)

      // Gradient opacity: more transparent in center, more opaque on edges
      const centerOpacity = 0.05
      const edgeOpacity = 0.25
      const opacity = centerOpacity + normalizedDistance * (edgeOpacity - centerOpacity)

      dots.push(
        <circle
          key={`${x}-${y}`}
          className="halftone-circle"
          cx={x}
          cy={y}
          r={size}
          fill="url(#halftone-gradient)"
          opacity={opacity}
          style={{ transformOrigin: `${x}px ${y}px` }}
        />
      )
    }
  }

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 h-full w-full"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id="halftone-gradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="white" stopOpacity="0.3" />
          <stop offset="70%" stopColor="white" stopOpacity="0.7" />
          <stop offset="100%" stopColor="white" stopOpacity="1" />
        </radialGradient>
      </defs>

      {/* Visual torus ring */}
      <circle
        ref={torusRef}
        cx={centerX}
        cy={centerY}
        r="0"
        fill="none"
        stroke="white"
        strokeWidth="32"
        opacity="0"
        className="blur-[20px]"
      />

      {dots}
    </svg>
  )
}

export default HalftonePattern
