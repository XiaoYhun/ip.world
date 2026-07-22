"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { useOnboarding } from "@/context/onboarding-context"

/**
 * Multiple layered gradient blobs with random shapes that blend together
 * Colors: #00EEC6 (teal), #FFC525 (yellow), #FF0CFB (magenta), #06ABE7 (blue)
 * All values are pre-calculated to avoid recalculation on re-renders
 */
const gradientBlobs = [
  // Layer 1 - Large background blobs
  {
    id: "l1-1",
    left: "-15%",
    top: "20%",
    width: 1080,
    height: 840,
    transform: "translate(-50%, -50%) rotate(45deg) scale(1.05)",
    background: "radial-gradient(ellipse 65% 55% at 50% 45%, #00EEC6 0%, transparent 100%)",
    borderRadius: "45% 60% 55% 70%",
  },
  {
    id: "l1-2",
    left: "110%",
    top: "60%",
    width: 1300,
    height: 1040,
    transform: "translate(-50%, -50%) rotate(-30deg) scale(1.12)",
    background: "radial-gradient(ellipse 70% 60% at 45% 50%, #FF0CFB 0%, transparent 100%)",
    borderRadius: "50% 65% 60% 75%",
  },
  {
    id: "l1-3",
    left: "50%",
    top: "120%",
    width: 1320,
    height: 660,
    transform: "translate(-50%, -50%) rotate(15deg) scale(0.95)",
    background: "radial-gradient(ellipse 60% 50% at 50% 55%, #06ABE7 0%, transparent 100%)",
    borderRadius: "40% 55% 50% 65%",
  },
  {
    id: "l1-4",
    left: "-20%",
    top: "80%",
    width: 800,
    height: 900,
    transform: "translate(-50%, -50%) rotate(-60deg) scale(1.0)",
    background: "radial-gradient(ellipse 55% 65% at 48% 52%, #FFC525 0%, transparent 100%)",
    borderRadius: "50% 60% 55% 70%",
  },
  // Layer 2 - Medium blending blobs
  {
    id: "l2-1",
    left: "30%",
    top: "-10%",
    width: 630,
    height: 450,
    transform: "translate(-50%, -50%) rotate(120deg) scale(0.88)",
    background: "radial-gradient(ellipse 65% 55% at 50% 48%, #06ABE7 0%, transparent 100%)",
    borderRadius: "45% 60% 50% 65%",
  },
  {
    id: "l2-2",
    left: "80%",
    top: "30%",
    width: 600,
    height: 700,
    transform: "translate(-50%, -50%) rotate(-45deg) scale(1.0)",
    background: "radial-gradient(ellipse 70% 60% at 45% 50%, #00EEC6 0%, transparent 100%)",
    borderRadius: "50% 65% 55% 70%",
  },
  {
    id: "l2-3",
    left: "10%",
    top: "50%",
    width: 640,
    height: 480,
    transform: "translate(-50%, -50%) rotate(75deg) scale(0.92)",
    background: "radial-gradient(ellipse 60% 55% at 50% 52%, #FF0CFB 0%, transparent 100%)",
    borderRadius: "40% 55% 50% 65%",
  },
  {
    id: "l2-4",
    left: "60%",
    top: "90%",
    width: 770,
    height: 880,
    transform: "translate(-50%, -50%) rotate(-15deg) scale(1.08)",
    background: "radial-gradient(ellipse 65% 60% at 48% 50%, #FFC525 0%, transparent 100%)",
    borderRadius: "45% 60% 55% 70%",
  },
  {
    id: "l2-5",
    left: "120%",
    top: "10%",
    width: 420,
    height: 350,
    transform: "translate(-50%, -50%) rotate(30deg) scale(0.85)",
    background: "radial-gradient(ellipse 55% 50% at 50% 45%, #00EEC6 0%, transparent 100%)",
    borderRadius: "40% 55% 45% 60%",
  },
  // Layer 3 - Smaller accent blobs for blending
  {
    id: "l3-1",
    left: "45%",
    top: "40%",
    width: 300,
    height: 240,
    transform: "translate(-50%, -50%) rotate(-90deg) scale(0.72)",
    background: "radial-gradient(ellipse 60% 55% at 50% 48%, #FF0CFB 0%, transparent 100%)",
    borderRadius: "45% 60% 50% 65%",
  },
  {
    id: "l3-2",
    left: "70%",
    top: "70%",
    width: 315,
    height: 385,
    transform: "translate(-50%, -50%) rotate(60deg) scale(0.78)",
    background: "radial-gradient(ellipse 65% 60% at 48% 50%, #06ABE7 0%, transparent 100%)",
    borderRadius: "50% 65% 55% 70%",
  },
  {
    id: "l3-3",
    left: "20%",
    top: "25%",
    width: 200,
    height: 250,
    transform: "translate(-50%, -50%) rotate(-30deg) scale(0.65)",
    background: "radial-gradient(ellipse 55% 50% at 50% 52%, #FFC525 0%, transparent 100%)",
    borderRadius: "40% 55% 45% 60%",
  },
  {
    id: "l3-4",
    left: "90%",
    top: "50%",
    width: 440,
    height: 360,
    transform: "translate(-50%, -50%) rotate(135deg) scale(0.88)",
    background: "radial-gradient(ellipse 70% 65% at 45% 48%, #00EEC6 0%, transparent 100%)",
    borderRadius: "50% 65% 60% 75%",
  },
  {
    id: "l3-5",
    left: "-5%",
    top: "60%",
    width: 300,
    height: 360,
    transform: "translate(-50%, -50%) rotate(-120deg) scale(0.72)",
    background: "radial-gradient(ellipse 60% 55% at 50% 50%, #06ABE7 0%, transparent 100%)",
    borderRadius: "45% 60% 50% 65%",
  },
  {
    id: "l3-6",
    left: "55%",
    top: "5%",
    width: 240,
    height: 190,
    transform: "translate(-50%, -50%) rotate(45deg) scale(0.65)",
    background: "radial-gradient(ellipse 55% 50% at 50% 45%, #FF0CFB 0%, transparent 100%)",
    borderRadius: "40% 55% 45% 60%",
  },
]

export function OnboardingBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const blobsContainerRef = useRef<HTMLDivElement>(null)
  const { isOpen } = useOnboarding()

  useEffect(() => {
    const container = containerRef.current
    const blobsContainer = blobsContainerRef.current
    if (!container || !blobsContainer) return

    let tl: gsap.core.Timeline | null = null

    if (isOpen) {
      // Set transform origin to center for expansion from center
      gsap.set(container, {
        transformOrigin: "50% 50%",
        scale: 0,
        opacity: 0,
      })

      // Set initial state for blobs container
      gsap.set(blobsContainer, {
        opacity: 0,
      })

      // Set initial state for individual blobs
      gsap.set(blobsContainer.children, {
        opacity: 0,
      })

      // Create master timeline for smooth orchestration
      tl = gsap.timeline({
        defaults: { ease: "power3.out" },
      })

      // Expand container from center with smooth easing
      // Using a slight overshoot for a more dynamic feel
      tl.to(container, {
        scale: 1,
        opacity: 1,
        duration: 1.4,
        ease: "back.out(1.2)", // Slight overshoot for premium feel
      })
        // Fade in blobs container with slight delay for layered effect
        .to(
          blobsContainer,
          {
            opacity: 0.234,
            duration: 1.8,
            ease: "power1.out",
          },
          "-=1.0" // Start 1s before previous animation ends
        )
        // Animate individual blobs with staggered opacity for depth
        .to(
          blobsContainer.children,
          {
            opacity: 1,
            duration: 1.4,
            stagger: {
              amount: 0.8,
              from: "center", // Start from center and expand outward
            },
            ease: "power1.out",
          },
          "-=1.2" // Start 1.2s before previous animation ends
        )
    } else {
      // Exit animation - collapse back to center
      tl = gsap.timeline({
        defaults: { ease: "power2.in" },
      })

      // Fade out blobs first
      tl.to(blobsContainer.children, {
        opacity: 0,
        duration: 0.3,
        stagger: {
          amount: 0.2,
          from: "edges", // Fade from edges to center
        },
      })
        .to(
          blobsContainer,
          {
            opacity: 0,
            duration: 0.3,
          },
          "-=0.2"
        )
        // Collapse container back to center
        .to(
          container,
          {
            scale: 0,
            opacity: 0,
            duration: 0.5,
            ease: "power2.in",
          },
          "-=0.1"
        )
    }

    // Cleanup function to kill animation on unmount or state change
    return () => {
      if (tl) {
        tl.kill()
      }
    }
  }, [isOpen])

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0">
      {/* Gradient blobs container - heavily blurred and very low opacity */}
      <div
        ref={blobsContainerRef}
        className="absolute inset-0 overflow-hidden"
        style={{
          filter: "blur(150px)",
        }}
      >
        {gradientBlobs.map((blob) => (
          <div
            key={blob.id}
            className="absolute"
            style={{
              left: blob.left,
              top: blob.top,
              width: blob.width,
              height: blob.height,
              transform: blob.transform,
              background: blob.background,
              borderRadius: blob.borderRadius,
              opacity: 0, // Start invisible, GSAP will animate
            }}
          />
        ))}
      </div>
    </div>
  )
}
