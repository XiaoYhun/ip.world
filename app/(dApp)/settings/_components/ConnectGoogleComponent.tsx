"use client"

import { useSocialAccounts } from "@dynamic-labs/sdk-react-core"
import { ProviderEnum } from "@dynamic-labs/types"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import Spinner from "@/components/ui/spinner"
import { motion } from "framer-motion"

const GoogleIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84Z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
      fill="#EA4335"
    />
  </svg>
)

export const ConnectGoogleComponent = () => {
  const [disconnecting, setDisconnecting] = useState(false)
  const queryClient = useQueryClient()

  const {
    linkSocialAccount,
    unlinkSocialAccount,
    getLinkedAccountInformation,
    isProcessing,
    error,
  } = useSocialAccounts({
    onError: (err) => {
      console.error("Social account error:", err)
      toast.error("Failed to link Google account. Please try again.")
    },
  })

  const googleAccount = useMemo(
    () => getLinkedAccountInformation(ProviderEnum.Google),
    [getLinkedAccountInformation]
  )

  const isLinked = Boolean(googleAccount?.email || googleAccount?.username)
  const displayName = googleAccount?.email || googleAccount?.username
  const prevIsLinkedRef = useRef(isLinked)
  const wasProcessingRef = useRef(false)

  useEffect(() => {
    if (isProcessing) {
      wasProcessingRef.current = true
    }

    if (wasProcessingRef.current && !isProcessing && !error) {
      if (!prevIsLinkedRef.current && isLinked) {
        toast.success(`Linked ${displayName} successfully`)
        queryClient.invalidateQueries({ queryKey: ["user"] })
      }
      wasProcessingRef.current = false
    }

    prevIsLinkedRef.current = isLinked
  }, [isProcessing, isLinked, error, displayName, queryClient])

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to link Google account")
    }
  }, [error])

  const handleConnect = useCallback(async () => {
    try {
      await linkSocialAccount(ProviderEnum.Google, { forcePopup: true })
    } catch (err) {
      console.error("linkSocialAccount error:", err)
    }
  }, [linkSocialAccount])

  const handleDisconnect = useCallback(async () => {
    setDisconnecting(true)
    try {
      await unlinkSocialAccount(ProviderEnum.Google)
      queryClient.invalidateQueries({ queryKey: ["user"] })
      toast.success("Google account disconnected")
    } catch (err) {
      console.error("Failed to disconnect Google:", err)
      toast.error("Failed to disconnect Google account")
    } finally {
      setDisconnecting(false)
    }
  }, [unlinkSocialAccount, queryClient])

  const connecting = isProcessing && !isLinked

  return (
    <div className="group flex min-w-0 flex-col gap-3 rounded-[12px] border! border-neutral-500 bg-neutral-800 px-3 py-2.5 transition-all hover:border-neutral-400 hover:bg-neutral-800 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex size-[42px] shrink-0 items-center justify-center rounded-[8px] border border-neutral-500 bg-neutral-700 p-2.5">
          <GoogleIcon size={18} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="truncate text-sm font-medium text-white">
            {isLinked ? displayName : "Google"}
          </p>
          <p
            className={cn(
              "flex items-center gap-1 text-xs",
              isLinked && "text-green-neon",
              !isLinked && !connecting && "text-neutral-400",
              connecting && "text-purple-200"
            )}
          >
            •{" "}
            <span>
              {connecting
                ? "Connecting..."
                : isLinked
                  ? "Connected"
                  : "Not connected"}
            </span>
          </p>
        </div>
      </div>

      <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 transition-all sm:w-auto sm:flex-nowrap">
        {!isLinked && !connecting && (
          <Button
            variant="primary"
            className="h-fit rounded-full px-5 py-3 text-sm font-semibold"
            onClick={handleConnect}
          >
            Connect
          </Button>
        )}

        {connecting && (
          <div className="flex items-center gap-1.5 text-sm text-neutral-400">
            <Spinner size={12} />
            <span>Connecting...</span>
          </div>
        )}

        {isLinked && (
          <div
            className={cn(
              "flex cursor-pointer items-center gap-1 text-sm text-neutral-400 transition-all",
              disconnecting
                ? "cursor-default text-white"
                : "hover:text-red"
            )}
            onClick={!disconnecting ? handleDisconnect : undefined}
          >
            {disconnecting ? (
              <>
                <motion.span layoutId="google-icon" transition={{ duration: 0.1 }}>
                  <Spinner size={12} />
                </motion.span>
                <motion.span layoutId="google-text" transition={{ duration: 0.1 }}>
                  Removing
                </motion.span>
              </>
            ) : (
              <>
                <motion.span layoutId="google-icon" transition={{ duration: 0.1 }}>
                  <X size={12} />
                </motion.span>
                <motion.span layoutId="google-text" transition={{ duration: 0.1 }}>
                  Remove
                </motion.span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
