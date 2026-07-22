"use client"

import { createContext, ReactNode, useCallback, useContext, useState } from "react"

type NavigationContextType = {
  previousPage: string | null
  setPreviousPage: (page: string | null) => void
  clearPreviousPage: () => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [previousPage, setPreviousPage] = useState<string | null>(null)

  const clearPreviousPage = useCallback(() => {
    setPreviousPage(null)
  }, [])

  return (
    <NavigationContext.Provider
      value={{
        previousPage,
        setPreviousPage,
        clearPreviousPage,
      }}
    >
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error("useNavigation must be used within a NavigationProvider")
  }
  return context
}
