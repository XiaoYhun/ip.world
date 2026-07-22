"use client"

import { getAuthToken } from "@dynamic-labs/sdk-react-core"
import { Heart, HeartCrack } from "lucide-react"
import { useState } from "react"
import { likeToken } from "@/actions/token/like"
import { cn } from "@/lib/utils"
import { Remix } from "@/types/remix"

const Favorite = ({
  remix,
  defaultValue = false,
  size = 20,
}: {
  remix: Remix
  defaultValue: boolean
  size?: number
}) => {
  const [isLiked, setIsLiked] = useState(defaultValue)
  const [isLoading, setIsLoading] = useState(false)

  const handleLike = async () => {
    if (!remix.ip_id || !remix.token_address) {
      return
    }
    setIsLoading(true)

    try {
      setIsLiked(!isLiked)
      await likeToken(remix.ip_id, remix.token_address, !isLiked, getAuthToken())
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <span
      className={cn(
        "flex cursor-pointer items-center bg-white px-1 text-black shadow-lg",
        isLoading && "pointer-events-none"
      )}
      onClick={(event: React.MouseEvent<HTMLDivElement>) => {
        event.stopPropagation()
        handleLike()
      }}
    >
      <span>{isLiked ? <Heart size={size} /> : <HeartCrack size={size} />}</span>
    </span>
  )
}

export default Favorite
