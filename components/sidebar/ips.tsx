import { useIsLoggedIn } from "@dynamic-labs/sdk-react-core"
import { motion } from "framer-motion"

import { ChevronDown, ChevronUp } from "lucide-react"
import { useEffect, useState } from "react"
import { useIsMobileView } from "@/context/mobile-ui-context"
import { useSidebar } from "@/context/sidebar-context"
import { cn } from "@/lib/utils"
import { IpFavorite, TokenFavorite } from "@/types/user"
import IpNavItem from "./ip-nav-item"
import RemixNavItem from "./remix-nav-item"
import { Separator } from "../ui/separator"
import { Heart, PersonLiked } from "../icons"

export default function Ips() {
  const [viewAll, setViewAll] = useState(false)

  // const [showFavoriteMenu, setShowFavoriteMenu] = useState(false)
  const isLoggedIn = useIsLoggedIn()
  const isMobileRaw = useIsMobileView()
  const isMobile = isMobileRaw ?? false // Default to false when null
  const {
    isExpanded,

    favorite,
    handleFavoriteChange,
    favoriteIps,
    favoriteRemixes,

    dropdownOpen,
    setDropdownOpen,
  } = useSidebar()

  const calculateVisibleIPs = () => {
    const viewportHeight = window.innerHeight
    const fixedHeight = isMobile ? 400 : 306 + 152 + 64 + 32
    const availableHeight = viewportHeight - fixedHeight

    const ipItemHeight = 52
    const maxItems = Math.floor(availableHeight / ipItemHeight)
    return Math.max(1, Math.min(isMobile ? 8 : 12, maxItems))
  }

  const [visibleItems, setVisibleItems] = useState(6)

  useEffect(() => {
    const updateVisibleItems = () => {
      setVisibleItems(calculateVisibleIPs())
    }
    updateVisibleItems()
    window.addEventListener("resize", updateVisibleItems)
    return () => window.removeEventListener("resize", updateVisibleItems)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (dropdownOpen && !target.closest(".favorite-menu-container")) {
        setDropdownOpen(false)
      }
    }

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dropdownOpen])

  const followingIPs = viewAll ? favoriteIps : favoriteIps.slice(0, visibleItems)
  const followingRemixes = viewAll ? favoriteRemixes : favoriteRemixes.slice(0, visibleItems)

  const handleFavoriteMenuToggle = () => {
    setDropdownOpen(!dropdownOpen)
  }

  const setFavorite = (newFavorite: string) => {
    handleFavoriteChange(newFavorite)
    setDropdownOpen(false)
  }

  if (!isLoggedIn) return null

  return (
    <>
      <div className="flex flex-col px-3">
        <Separator className="bg-neutral-600" />
      </div>
      <div className="flex flex-col sm:mt-2 sm:px-3">
        {/* Simple toggle button instead of complex dropdown */}
        <div className="favorite-menu-container relative">
          <div
            className="flex h-8 w-full cursor-pointer touch-manipulation flex-nowrap items-center gap-2 p-1.5 sm:mb-6"
            onClick={handleFavoriteMenuToggle}
          >
            <div className="flex items-center justify-center">
              <div className="flex h-5 w-5 items-center justify-center text-white">
                {favorite === "ip" ? <PersonLiked width={14} height={14} /> : <Heart size={14} />}
              </div>
            </div>
            <div className="order-2 flex flex-auto items-center justify-start gap-1 self-stretch overflow-hidden">
              <span
                className={cn(
                  "text-sm whitespace-nowrap text-neutral-200 transition-opacity",
                  // Always show on mobile or when expanded
                  isMobile || isExpanded ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
              >
                {favorite === "ip" ? "Followed IP" : "Liked Token"}
              </span>
              <span
                className={cn(
                  "transition-opacity",
                  // Always show on mobile or when expanded
                  isMobile || isExpanded ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
              >
                <ChevronDown size={12} />
              </span>
            </div>
          </div>

          {/* Simple menu - always visible when showFavoriteMenu is true */}
          {dropdownOpen && (
            <div className="absolute top-full left-0 z-[9999] w-[192px] rounded-[6px] border border-neutral-600 bg-black shadow-lg">
              <div
                className={cn(
                  "cursor-pointer px-3 py-2 text-neutral-300 transition-colors hover:bg-neutral-600",
                  favorite === "ip" && "bg-accent text-white"
                )}
                onClick={() => setFavorite("ip")}
              >
                Followed IP
              </div>
              <div
                className={cn(
                  "cursor-pointer px-3 py-2 text-neutral-300 transition-colors hover:bg-neutral-600",
                  favorite === "token" && "bg-accent text-white"
                )}
                onClick={() => setFavorite("token")}
              >
                Liked Token
              </div>
            </div>
          )}
        </div>
      </div>

      {favorite === "token" ? (
        <div className="scrollbar-hide mb-2 flex flex-1 flex-col gap-2 overflow-y-auto px-2.5 transition-opacity duration-1000 sm:gap-3">
          <div className="flex flex-col gap-2 sm:gap-4">
            {followingRemixes?.map((data: TokenFavorite) => (
              <motion.div
                key={`sidebar-remix-${data.remix.id}`}
                initial={viewAll ? { opacity: 0, y: 10 } : { opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: isMobile ? 10 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <RemixNavItem remix={data.remix} />
              </motion.div>
            ))}
            {favoriteRemixes?.length > visibleItems && (
              <button
                className="mb-4 flex h-8 w-full cursor-pointer flex-nowrap items-center gap-2 p-1.5 text-white"
                onClick={() => setViewAll(!viewAll)}
              >
                <div className="flex items-center justify-center">
                  <div className="flex h-5 w-5 items-center justify-center">
                    {viewAll ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </div>
                <div className="order-2 flex flex-auto flex-col items-start justify-center self-stretch overflow-hidden">
                  <span className="text-sm whitespace-nowrap">{viewAll ? "View Less" : "View All"}</span>
                </div>
              </button>
            )}
            {followingRemixes?.length === 0 && (
              <div
                className={cn("w-full justify-center text-sm", isExpanded ? "flex" : "flex group-hover:flex sm:hidden")}
              >
                No favorited tokens.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="scrollbar-hide flex flex-1 flex-col gap-2 overflow-y-auto px-2.5 transition-opacity duration-1000 sm:mb-2 sm:gap-3">
          <div className="flex flex-col gap-2 sm:gap-4">
            {followingIPs?.map((data: IpFavorite) => (
              <motion.div
                key={`sidebar-ip-${data.ip.id}`}
                initial={viewAll ? { opacity: 0, y: 10 } : { opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: isMobile ? 10 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <IpNavItem ip={data.ip} />
              </motion.div>
            ))}
            {favoriteIps?.length > visibleItems && (
              <button
                className="mb-4 flex h-8 w-full cursor-pointer flex-nowrap items-center gap-2 p-1.5 text-white"
                onClick={() => setViewAll(!viewAll)}
              >
                <div className="flex items-center justify-center">
                  <div className="flex h-5 w-5 items-center justify-center">
                    {viewAll ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </div>
                <div className="order-2 flex flex-auto flex-col items-start justify-center self-stretch overflow-hidden">
                  <span className="text-sm whitespace-nowrap">{viewAll ? "View Less" : "View All"}</span>
                </div>
              </button>
            )}
            {followingIPs.length === 0 && (
              <div className={cn("hidden w-full justify-center text-sm")}>No followed IP.</div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
