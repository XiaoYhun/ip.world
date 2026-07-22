"use client"

import { useQueryClient } from "@tanstack/react-query"
import { createContext, ReactNode, useContext, useEffect, useState } from "react"
import { useFavorites } from "@/hooks/use-favorites"
import { IpFavorite, TokenFavorite } from "@/types/user"
import { useProfile } from "@/hooks/use-profile"

interface SidebarContextType {
  isExpanded: boolean
  setIsExpanded: (expanded: boolean) => void
  hasOpenDropdown: boolean
  setHasOpenDropdown: (hasOpen: boolean) => void
  closeDropdown: () => void
  setDropdownOpen: (open: boolean) => void
  dropdownOpen: boolean

  favorite: string
  handleFavoriteChange: (favorite: string) => void
  favoriteIps: IpFavorite[]
  favoriteRemixes: TokenFavorite[]
  onFavoriteChange: (type: "ip" | "token", isFavorite: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [hasOpenDropdown, setHasOpenDropdown] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [favorite, setFavorite] = useState("ip")

  const { user } = useProfile()

  // Set up client-side state after hydration
  useEffect(() => {
    const storedFavorite = localStorage.getItem("favorite")
    if (storedFavorite) {
      setFavorite(storedFavorite)
    }
  }, [])

  const queryClient = useQueryClient()

  useEffect(() => {
    if (user) {
      queryClient.invalidateQueries({ queryKey: ["favourites"] })
    }
  }, [user, queryClient])

  const { favorites: favoriteIps } = useFavorites("ip") as {
    favorites: IpFavorite[]
  }

  const { favorites: favoriteRemixes } = useFavorites("token") as {
    favorites: TokenFavorite[]
  }

  const handleFavoriteChange = (newFavorite: string) => {
    setFavorite(newFavorite)
    if (typeof window !== "undefined") {
      localStorage.setItem("favorite", newFavorite)
    }
  }

  const closeDropdown = () => {
    setHasOpenDropdown(false)
    setDropdownOpen(false)
  }

  const onFavoriteChange = async (type: "ip" | "token", isFavorite: boolean) => {
    setTimeout(() => {
      if (!isFavorite) {
        queryClient.invalidateQueries({ queryKey: ["favourites"] })
      } else {
        queryClient.invalidateQueries({ queryKey: ["favourites", type] })
      }
    }, 200)
  }

  return (
    <SidebarContext.Provider
      value={{
        isExpanded,
        setIsExpanded,
        hasOpenDropdown,
        setHasOpenDropdown,
        closeDropdown,
        setDropdownOpen,
        dropdownOpen,

        favorite,
        handleFavoriteChange,
        favoriteIps,
        favoriteRemixes,
        onFavoriteChange,
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}
