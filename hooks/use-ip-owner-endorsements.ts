import { useState } from "react"
import { toast } from "sonner"
import { endorseRemix, EndorseRemixPayload, unendorseRemix } from "@/actions/remix/endorse"
import { flagRemix, unflagRemix } from "@/actions/remix/flag"
import { getAuthToken } from "@/lib/dynamic"
import { Remix } from "@/types/remix"

export const useIpOwnerEndorsements = (remix: Remix, onSuccess?: () => void) => {
  const [isLoading, setIsLoading] = useState(false)

  const handleEndorse = async (endorsementType: "official" | "liked") => {
    setIsLoading(true)
    try {
      const payload: EndorseRemixPayload = {
        token_address: remix.token_address,
        endorsement_type: endorsementType,
      }

      await endorseRemix(payload, getAuthToken())

      const actionText = endorsementType === "official" ? "officially endorsed" : "liked"
      toast.success(`Successfully ${actionText} ${remix.name}`)
      onSuccess?.()
    } catch (error) {
      console.error("Error endorsing remix:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      toast.error(`Failed to endorse: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnendorse = async () => {
    setIsLoading(true)
    try {
      await unendorseRemix(remix.token_address, getAuthToken())
      toast.success(`Removed endorsement from ${remix.name}`)
      onSuccess?.()
    } catch (error) {
      console.error("Error unendorsing remix:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      toast.error(`Failed to remove endorsement: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFlag = async () => {
    setIsLoading(true)
    try {
      await flagRemix(remix.token_address, getAuthToken())
      toast.success(`Flagged ${remix.name}`)
      onSuccess?.()
    } catch (error) {
      console.error("Error flagging remix:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      toast.error(`Failed to flag: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnflag = async () => {
    setIsLoading(true)
    try {
      await unflagRemix(remix.token_address, getAuthToken())
      toast.success(`Removed flag from ${remix.name}`)
      onSuccess?.()
    } catch (error) {
      console.error("Error unflagging remix:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      toast.error(`Failed to remove flag: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    handleEndorse,
    handleUnendorse,
    handleFlag,
    handleUnflag,
  }
}
