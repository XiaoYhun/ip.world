"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

const useDock = ({ threshold = 160, offset = 40 }: { threshold?: number; offset?: number } = {}) => {
  const pathname = usePathname()
  const [isDocked, setIsDocked] = useState(() => {
    // Always docked if path includes "/create"
    if (pathname?.includes("/create")) return true
    if (typeof window === "undefined") return false
    return window.scrollY > threshold
  })

  useEffect(() => {
    // If on /create route, always keep docked
    if (pathname?.includes("/create")) {
      setIsDocked(true)
      return
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (!isDocked && currentScrollY > threshold) {
        setIsDocked(true)
      }

      if (isDocked && currentScrollY < threshold - offset) {
        setIsDocked(false)
      }
    }

    // Initial check
    handleScroll()

    // Use passive: true for better scroll performance
    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [isDocked, threshold, offset, pathname])

  return { isDocked }
}

export default useDock
