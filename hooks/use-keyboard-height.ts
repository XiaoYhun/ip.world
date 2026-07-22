"use client"

import { useEffect, useState } from "react"

export const useKeyboardHeight = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const handleResize = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight
      const windowHeight = window.innerHeight
      const heightDifference = windowHeight - viewportHeight

      // Consider keyboard visible if height difference is more than 150px
      // This accounts for browser UI changes and actual keyboard
      if (heightDifference > 150) {
        setKeyboardHeight(heightDifference)
        setIsKeyboardVisible(true)
      } else {
        setKeyboardHeight(0)
        setIsKeyboardVisible(false)
      }
    }

    // Use visualViewport API if available (more reliable for keyboard detection)
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize)
    } else {
      // Fallback to window resize
      window.addEventListener("resize", handleResize)
    }

    // Initial check
    handleResize()

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleResize)
      } else {
        window.removeEventListener("resize", handleResize)
      }
    }
  }, [])

  return { keyboardHeight, isKeyboardVisible }
}
