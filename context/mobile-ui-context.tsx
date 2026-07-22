"use client"

import { createContext, ReactNode, useContext, useEffect, useState } from "react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { MOBILE_MEDIA_QUERY } from "@/lib/mobile-layout"
import type { Mode } from "@/app/(dApp)/token/[tokenAddress]/trade/trade-switch"

export type MobileStackPayload = {
  tradeDefaultMode?: Mode
}

type MobileUIContextType = {
  isMobile: boolean | null
  isLoading: boolean
  drawer: {
    isOpen: boolean
    openDrawer: () => void
    closeDrawer: () => void
    toggleDrawer: () => void
  }
  navigation: {
    hideNavbar: boolean
    setHideNavbar: (hide: boolean) => void
  }
  stack: {
    isOpen: boolean
    currentStackId: string | null
    stackPayload: MobileStackPayload | null
    openStack: (stackId: string, payload?: MobileStackPayload | null) => void
    closeStack: () => void
    toggleStack: (stackId: string, payload?: MobileStackPayload | null) => void
  }
}

export const MobileUIContext = createContext<MobileUIContextType | undefined>(undefined)

export function MobileUIProvider({ children }: { children: ReactNode }) {
  // Mobile view detection state
  const [isLoading, setIsLoading] = useState(true)
  const isMobile = useMediaQuery(MOBILE_MEDIA_QUERY)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [hideNavbar, setHideNavbar] = useState(false)
  const [stackOpen, setStackOpen] = useState(false)
  const [currentStackId, setCurrentStackId] = useState<string | null>(null)
  const [stackPayload, setStackPayload] = useState<MobileStackPayload | null>(null)

  useEffect(() => {
    setIsLoading(false)
  }, [])

  // Drawer
  const openDrawer = () => setDrawerOpen(true)
  const closeDrawer = () => setDrawerOpen(false)
  const toggleDrawer = () => setDrawerOpen(!drawerOpen)

  // Stack
  const openStack = (stackId: string, payload?: MobileStackPayload | null) => {
    setCurrentStackId(stackId)
    setStackOpen(true)
    setStackPayload(payload === undefined ? null : payload)
  }
  const closeStack = () => {
    setStackOpen(false)
    setCurrentStackId(null)
    setStackPayload(null)
  }
  const toggleStack = (stackId: string, payload?: MobileStackPayload | null) => {
    if (
      stackOpen &&
      currentStackId === stackId &&
      (payload === undefined || payload?.tradeDefaultMode === stackPayload?.tradeDefaultMode)
    ) {
      closeStack()
      return
    }
    openStack(stackId, payload)
  }

  const value: MobileUIContextType = {
    isMobile,
    isLoading,
    drawer: {
      isOpen: drawerOpen,
      openDrawer,
      closeDrawer,
      toggleDrawer,
    },
    navigation: {
      hideNavbar,
      setHideNavbar,
    },
    stack: {
      isOpen: stackOpen,
      currentStackId,
      stackPayload,
      openStack,
      closeStack,
      toggleStack,
    },
  }

  return <MobileUIContext.Provider value={value}>{children}</MobileUIContext.Provider>
}

export function useIsMobileView() {
  const context = useContext(MobileUIContext)
  if (context === undefined) {
    throw new Error("useIsMobileView must be used within a MobileUIProvider")
  }

  if (context.isLoading) {
    return null // Return null while loading
  }

  return context.isMobile
}

export function useMobileDrawer() {
  const context = useContext(MobileUIContext)
  if (context === undefined) {
    throw new Error("useMobileDrawer must be used within a MobileUIProvider")
  }
  return context.drawer
}

export function useMobileNav() {
  const context = useContext(MobileUIContext)
  if (context === undefined) {
    throw new Error("useMobileNav must be used within a MobileUIProvider")
  }

  return {
    toggleDrawer: context.drawer.toggleDrawer,
    hideNavbar: context.navigation.hideNavbar,
    setHideNavbar: context.navigation.setHideNavbar,
  }
}

export function useMobileStack() {
  const context = useContext(MobileUIContext)
  if (context === undefined) {
    throw new Error("useMobileStack must be used within a MobileUIProvider")
  }
  return context.stack
}

export function useMobileUI() {
  const context = useContext(MobileUIContext)
  if (context === undefined) {
    throw new Error("useMobileUI must be used within a MobileUIProvider")
  }
  return context
}
