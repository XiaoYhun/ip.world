import { getAuthToken, useDynamicContext, useIsLoggedIn } from "@dynamic-labs/sdk-react-core"
import { useCallback, useEffect, useState } from "react"
import { favoriteRemixes, getIsRemixesFavorited, unFavoriteRemixes } from "@/actions/remix/favorite"
import { MobileStackTrigger } from "@/components/mobile-stack"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/context/sidebar-context"
import { useIsIpOwner } from "@/hooks/use-is-ip-owner"
import { cn } from "@/lib/utils"

import { Remix } from "@/types/remix"
import { Heart, HeartOutlined } from "@/components/icons"

const MobileFooter = ({
  token,
  onEndorsementChange,
}: {
  token: Remix
  onEndorsementChange?: (newEndorsement: "none" | "official" | "liked" | "flagged") => void
}) => {
  const { setShowAuthFlow } = useDynamicContext()
  const isLoggedIn = useIsLoggedIn()
  const [remixFavoriteStatus, setRemixFavoriteStatus] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { isIpOwner } = useIsIpOwner(token.ip)
  const { onFavoriteChange } = useSidebar()

  async function isRemixesFavorited() {
    const { result } = await getIsRemixesFavorited(token.token_address, getAuthToken())
    setRemixFavoriteStatus(result)
  }

  useEffect(() => {
    if (token && isLoggedIn) {
      isRemixesFavorited()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isLoggedIn])

  const favorite = useCallback(async () => {
    setIsLoading(true)
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
    } finally {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isIpOwner, onEndorsementChange])

  const unFavorite = useCallback(async () => {
    setIsLoading(true)
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
    } finally {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isIpOwner, onEndorsementChange])

  return (
    <div
      className={cn(
        "border-neutral-600 fixed bottom-0 left-0 z-50 flex w-full items-center justify-between border-t bg-black p-2",
        "md:hidden",
        "animate-in slide-in-from-bottom duration-300"
      )}
    >
      <MobileStackTrigger stackId="tokenTrade" className="mr-2 min-w-0 flex-1">
        <Button variant="primary" className="h-10 w-full rounded-[10px] text-base font-semibold">
          Trade
        </Button>
      </MobileStackTrigger>
      <Button
        className="flex h-10 w-10 items-center justify-center rounded-[10px] text-white"
        variant="outline-2"
        disabled={isLoading}
        onClick={() => {
          if (!isLoggedIn) {
            setShowAuthFlow(true)
          } else {
            if (remixFavoriteStatus) {
              unFavorite()
            } else {
              favorite()
            }
          }
        }}
      >
        <div
          key={remixFavoriteStatus ? "liked" : "unliked"}
          className={cn(
            "transition-all duration-300 ease-out",
            isLoading && "animate-bounce",
            "hover:scale-110 active:scale-95",
            {
              "text-white": remixFavoriteStatus,
              "text-neutral-200": !remixFavoriteStatus,
            }
          )}
          style={{
            transform: isLoading ? "scale(0.8) translateY(2px)" : "scale(1) translateY(0)",
          }}
        >
          {remixFavoriteStatus ? <Heart size={12} /> : <HeartOutlined size={12} />}
        </div>
      </Button>
    </div>
  )
}

export default MobileFooter
