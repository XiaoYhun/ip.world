"use client"

import { getAuthToken, useDynamicContext, useIsLoggedIn } from "@dynamic-labs/sdk-react-core"
import { useEffect, useState } from "react"
import { favoriteRemixes, getIsRemixesFavorited, unFavoriteRemixes } from "@/actions/remix/favorite"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useIsMobileView } from "@/context/mobile-ui-context"
import { useIpOwnerEndorsements } from "@/hooks/use-ip-owner-endorsements"
import { useIsIpOwner } from "@/hooks/use-is-ip-owner"
import { Remix } from "@/types/remix"
import { Flag, ThreeDots } from "@/components/icons"
import { useSidebar } from "@/context/sidebar-context"
import ReportDialog from "@/components/dialog/report-dialog"

const OwnerMenuOfficialIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7 0C3.134 0 0 3.134 0 7C0 10.866 3.134 14 7 14C10.866 14 14 10.866 14 7C14 3.134 10.866 0 7 0ZM7.52173 2.94746C7.42292 2.74983 7.22097 2.625 7 2.625C6.77903 2.625 6.57708 2.74983 6.47827 2.94746L5.45963 4.98472L3.45638 5.13496C3.23852 5.1513 3.04806 5.288 2.96286 5.48917C2.87766 5.69035 2.91202 5.92229 3.05188 6.09012L4.59744 7.94477L3.93562 10.032C3.86569 10.2526 3.93273 10.4936 4.10649 10.6464C4.28025 10.7992 4.52789 10.8348 4.73768 10.7372L7 9.68502L9.26234 10.7372C9.47211 10.8348 9.71979 10.7992 9.89351 10.6464C10.0673 10.4936 10.1343 10.2526 10.0644 10.032L9.40257 7.94477L10.9481 6.09012C11.088 5.92229 11.1224 5.69035 11.0371 5.48917C10.952 5.288 10.7615 5.1513 10.5436 5.13496L8.54041 4.98472L7.52173 2.94746Z"
      fill="#A572ED"
    />
  </svg>
)

const OwnerMenuFavoriteIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path
      d="M9.66667 1.5C9.14535 1.5102 8.63339 1.64458 8.17079 1.89266C7.70819 2.14074 7.30749 2.49579 7 2.93006C6.69251 2.49579 6.29181 2.14074 5.82921 1.89266C5.36661 1.64458 4.85465 1.5102 4.33333 1.5C3.4496 1.50109 2.60237 1.86362 1.97748 2.50807C1.35259 3.15251 1.00106 4.02625 1 4.93763C1 8.71284 6.416 12.2474 6.64733 12.3959C6.75314 12.4639 6.87532 12.5 7 12.5C7.12468 12.5 7.24686 12.4639 7.35267 12.3959C7.584 12.2474 13 8.71284 13 4.93763C12.9989 4.02625 12.6474 3.15251 12.0225 2.50807C11.3976 1.86362 10.5504 1.50109 9.66667 1.5Z"
      fill="#FF4297"
    />
  </svg>
)

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M11.5 3.5L5.5 10L2.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

interface IpOwnerActionsDropdownProps {
  remix?: Remix
  onEndorsementChange?: (newEndorsement: "none" | "official" | "liked" | "flagged") => void
  triggerVariant?: "default" | "icon"
}

export default function IpOwnerActionsDropdown({
  remix,
  onEndorsementChange,
  triggerVariant = "default",
}: IpOwnerActionsDropdownProps) {
  const safeRemix = (remix ??
    ({
      id: "",
      token_address: "",
      owner_endorsement: "none",
      ip: null,
    } as unknown as Remix))

  const [isOpen, setIsOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [remixFavoriteStatus, setRemixFavoriteStatus] = useState(false)
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false)
  const [currentEndorsement, setCurrentEndorsement] = useState<"none" | "official" | "liked" | "flagged">(
    safeRemix.owner_endorsement || "none"
  )
  const isLoggedIn = useIsLoggedIn()
  const { setShowAuthFlow } = useDynamicContext()
  const { isIpOwner, userAddress } = useIsIpOwner(safeRemix.ip)
  const isMobile = useIsMobileView()
  const { onFavoriteChange } = useSidebar()

  const { isLoading, handleEndorse, handleUnendorse } = useIpOwnerEndorsements(safeRemix)

  // Don't show dropdown if user is not the IP owner
  if (!isIpOwner || !remix) {
    return null
  }

  async function refreshFavoriteStatus() {
    if (!safeRemix.token_address) return
    const response = await getIsRemixesFavorited(safeRemix.token_address, getAuthToken())
    setRemixFavoriteStatus(Boolean(response?.result))
  }

  useEffect(() => {
    if (isLoggedIn && safeRemix.token_address) {
      refreshFavoriteStatus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, safeRemix.token_address])

  const handleAction = async (action: () => Promise<void>, newState: "none" | "official" | "liked" | "flagged") => {
    if (!userAddress) {
      setShowAuthFlow(true)
      return
    }

    try {
      await action()
      // Only update state if API call succeeded
      setCurrentEndorsement(newState)
      onEndorsementChange?.(newState)
      setIsOpen(false)
    } catch {
      // Error handling is done in the hook - no state update on failure
    }
  }

  // Helper function to determine the correct state when removing endorsement/flag
  const getNewStateAfterRemoval = async (): Promise<"none" | "liked"> => {
    try {
      const { result } = await getIsRemixesFavorited(safeRemix.token_address, getAuthToken())
      return result ? "liked" : "none"
    } catch {
      return "none"
    }
  }

  const isOfficiallyEndorsed = currentEndorsement === "official"

  const favorite = async () => {
    if (!isLoggedIn) {
      setShowAuthFlow(true)
      return
    }

    setIsFavoriteLoading(true)
    try {
      await favoriteRemixes(safeRemix.token_address, getAuthToken())
      onFavoriteChange("token", true)
      await refreshFavoriteStatus()

      if (currentEndorsement === "none" || currentEndorsement === "liked") {
        setCurrentEndorsement("liked")
        onEndorsementChange?.("liked")
      }
    } finally {
      setIsFavoriteLoading(false)
    }
  }

  const unFavorite = async () => {
    if (!isLoggedIn) {
      setShowAuthFlow(true)
      return
    }

    setIsFavoriteLoading(true)
    try {
      await unFavoriteRemixes(safeRemix.token_address, getAuthToken())
      onFavoriteChange("token", false)
      await refreshFavoriteStatus()

      if (currentEndorsement === "liked") {
        setCurrentEndorsement("none")
        onEndorsementChange?.("none")
      }
    } finally {
      setIsFavoriteLoading(false)
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        {isMobile ? (
          <div className="flex cursor-pointer items-center justify-center gap-2 rounded-sm bg-neutral-600 p-2 py-3.5 text-neutral-200 transition-colors hover:text-white">
            <ThreeDots height={6} />
          </div>
        ) : triggerVariant === "icon" ? (
          <div className="flex size-6 cursor-pointer items-center justify-center rounded-[6px] border border-[#313131] bg-[#191919] text-[#797979] transition-colors hover:text-white">
            <ThreeDots width={12} height={4} />
          </div>
        ) : (
          <div
            className={`flex cursor-pointer items-center gap-1 transition-colors ${
              isOpen ? "text-white" : "group hover:text-white"
            }`}
          >
            <span
              className={`text-xs font-medium ${isOpen ? "text-white" : "text-neutral-200 group-hover:text-white"}`}
            >
              More
            </span>
            <ThreeDots width={16} height={6} />
          </div>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-[16px] border border-[#2E2E33] bg-[#1A1A1D] p-2">
        <DropdownMenuItem
          onClick={() => {
            if (remixFavoriteStatus) {
              unFavorite()
            } else {
              favorite()
            }
          }}
          disabled={isFavoriteLoading}
          className={`flex cursor-pointer items-center gap-2 rounded-[10px] hover:bg-[#2A2A2E] focus:bg-[#2A2A2E] ${remixFavoriteStatus ? "text-white" : "text-neutral-200"}`}
        >
          <span className={remixFavoriteStatus ? "opacity-100" : "opacity-70"}>
            <OwnerMenuFavoriteIcon />
          </span>
          <span className="flex-1">Favorite</span>
          {remixFavoriteStatus && <CheckIcon />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={async () => {
            if (isOfficiallyEndorsed) {
              const newState = await getNewStateAfterRemoval()
              handleAction(() => handleUnendorse(), newState)
            } else {
              handleAction(() => handleEndorse("official"), "official")
            }
          }}
          disabled={isLoading}
          className={`flex cursor-pointer items-center gap-2 rounded-[10px] hover:bg-[#2A2A2E] focus:bg-[#2A2A2E] ${isOfficiallyEndorsed ? "text-white" : "text-neutral-200"}`}
        >
          <OwnerMenuOfficialIcon />
          <span className="flex-1">Official</span>
          {isOfficiallyEndorsed && <CheckIcon />}
        </DropdownMenuItem>
        <div className="my-1 h-px bg-[#2E2E33]" />
        <DropdownMenuItem
          onClick={() => setReportOpen(true)}
          className="flex cursor-pointer items-center gap-2 rounded-[10px] text-[#EA4949] hover:bg-[#2A2A2E] focus:bg-[#2A2A2E]"
        >
          <Flag size={12} className="text-[#EA4949]" />
          <span>Report</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
      <ReportDialog
        topic="token"
        id={safeRemix.id}
        currentIpId={safeRemix.ip_id}
        open={reportOpen}
        onOpenChange={setReportOpen}
      />
    </DropdownMenu>
  )
}
