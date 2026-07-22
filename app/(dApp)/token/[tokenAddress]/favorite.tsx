"use client"

import { getAuthToken, useIsLoggedIn } from "@dynamic-labs/sdk-react-core"
import { useCallback, useEffect, useState } from "react"
import { favoriteRemixes, getIsRemixesFavorited, unFavoriteRemixes } from "@/actions/remix/favorite"
import { useSidebar } from "@/context/sidebar-context"
import { useIsIpOwner } from "@/hooks/use-is-ip-owner"
import { Remix } from "@/types/remix"
import { Heart, HeartOutlined } from "@/components/icons"

const FavoriteRemix = ({
  token,
  onEndorsementChange,
}: {
  token: Remix
  onEndorsementChange?: (newEndorsement: "none" | "official" | "liked" | "flagged") => void
}) => {
  const [remixFavoriteStatus, setRemixFavoriteStatus] = useState(false)
  const isLoggedIn = useIsLoggedIn()
  const { isIpOwner } = useIsIpOwner(token.ip)

  const { onFavoriteChange } = useSidebar()

  const isRemixesFavorited = useCallback(async () => {
    const { result } = await getIsRemixesFavorited(token.token_address, getAuthToken())
    setRemixFavoriteStatus(result)
  }, [token.token_address])

  useEffect(() => {
    if (token && isLoggedIn) {
      isRemixesFavorited()
    }
  }, [token, isLoggedIn, isRemixesFavorited])

  const favorite = useCallback(async () => {
    try {
      await favoriteRemixes(token.token_address, getAuthToken())
      onFavoriteChange("token", true)

      await isRemixesFavorited()

      // If user is IP owner, update endorsement badge to "liked" - only on success
      // But don't update if already "official" or "flagged" since those are more important
      if (isIpOwner) {
        const currentEndorsement = token.owner_endorsement || "none"
        if (currentEndorsement === "none" || currentEndorsement === "liked") {
          onEndorsementChange?.("liked")
        }
      }
    } catch (error) {
      console.error("Error favoriting remix:", error)
      // Don't update state on failure
    }
  }, [token, isIpOwner, onEndorsementChange, onFavoriteChange, isRemixesFavorited])

  const unFavorite = useCallback(async () => {
    try {
      await unFavoriteRemixes(token.token_address, getAuthToken())
      onFavoriteChange("token", false)

      await isRemixesFavorited()

      // If user is IP owner, update endorsement badge to "none" - only on success
      // But don't update if already "official" or "flagged" since those are more important
      if (isIpOwner) {
        const currentEndorsement = token.owner_endorsement || "none"
        if (currentEndorsement === "liked") {
          onEndorsementChange?.("none")
        }
      }
    } catch (error) {
      console.error("Error unfavoriting remix:", error)
      // Don't update state on failure
    }
  }, [token, isIpOwner, onEndorsementChange, onFavoriteChange, isRemixesFavorited])

  if (isLoggedIn) {
    return (
      <span
        className={`flex cursor-pointer items-center justify-center hover:text-white ${remixFavoriteStatus ? "text-white" : "text-neutral-300"}`}
        onClick={(e) => {
          e.stopPropagation()
          if (!remixFavoriteStatus) {
            favorite()
          } else {
            unFavorite()
          }
        }}
      >
        {remixFavoriteStatus ? <Heart size={12} /> : <HeartOutlined size={12} />}
      </span>
    )
  }

  return <></>
}

export default FavoriteRemix
