"use client"

import { createContext, ReactNode, useContext, useState } from "react"

// Define context type
interface IpManageDialogContextType {
  isOpen: boolean
  openDialog: () => void
  closeDialog: () => void
}

// Create the context
const IpManageDialogContext = createContext<IpManageDialogContextType | undefined>(undefined)

// Create provider
export function IpManageDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const openDialog = () => setIsOpen(true)
  const closeDialog = () => setIsOpen(false)

  return (
    <IpManageDialogContext.Provider value={{ isOpen, openDialog, closeDialog }}>
      {children}
    </IpManageDialogContext.Provider>
  )
}

// Hook to use context
export function useIpManageDialog() {
  const context = useContext(IpManageDialogContext)
  if (!context) {
    throw new Error("useIpManageDialog must be used within a IpManageDialogProvider")
  }
  return context
}
