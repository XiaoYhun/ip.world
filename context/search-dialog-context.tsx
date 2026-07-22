"use client"

import { createContext, ReactNode, useContext, useState } from "react"

// Define context type
interface SearchDialogContextType {
  isOpen: boolean
  searchValue: string
  setSearchValue: (value: string) => void
  openDialog: () => void
  closeDialog: () => void
  openDialogWithValue: (value: string) => void
}

// Create the context
const SearchDialogContext = createContext<SearchDialogContextType | undefined>(undefined)

// Create provider
export function SearchDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  const openDialog = () => setIsOpen(true)
  const closeDialog = () => {
    setIsOpen(false)
    setSearchValue("") // Clear search value when closing
  }
  const openDialogWithValue = (value: string) => {
    setSearchValue(value)
    setIsOpen(true)
  }

  return (
    <SearchDialogContext.Provider
      value={{
        isOpen,
        searchValue,
        setSearchValue,
        openDialog,
        closeDialog,
        openDialogWithValue,
      }}
    >
      {children}
    </SearchDialogContext.Provider>
  )
}

// Hook to use context
export function useSearchDialog() {
  const context = useContext(SearchDialogContext)
  if (!context) {
    throw new Error("useSearchDialog must be used within a SearchDialogProvider")
  }
  return context
}
