"use client"

import { createContext, ReactNode, useCallback, useContext, useState } from "react"

interface PortfolioContextType {
  isOpen: boolean
  openPortfolio: () => void
  setOpen: (open: boolean) => void
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined)

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false)
  const openPortfolio = useCallback(() => setOpen(true), [])

  return (
    <PortfolioContext.Provider value={{ isOpen, openPortfolio, setOpen }}>
      {children}
    </PortfolioContext.Provider>
  )
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext)
  if (!ctx) throw new Error("usePortfolio must be used within PortfolioProvider")
  return ctx
}
