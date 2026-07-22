"use client"

import { useEffect, useState } from "react"

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState<boolean | null>(null) // Avoid false initial state

  useEffect(() => {
    if (typeof window === "undefined") return // Ensure client-side execution

    const mediaQuery = window.matchMedia(query)
    setMatches(mediaQuery.matches) // Set initial value after mount

    const handler = (event: MediaQueryListEvent) => setMatches(event.matches)
    mediaQuery.addEventListener("change", handler)

    return () => mediaQuery.removeEventListener("change", handler)
  }, [query])

  return matches
}
