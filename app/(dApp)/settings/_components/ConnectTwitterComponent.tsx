"use client"

import { useSocialAccounts } from "@dynamic-labs/sdk-react-core"
import { ProviderEnum } from "@dynamic-labs/types"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { unlinkTwitter } from "@/actions/users/unlink-twitter"
import { Twitter } from "@/components/icons"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import Spinner from "@/components/ui/spinner"
import { motion } from "framer-motion"
import Switch from "@/components/ui/switch"
import { useSocialVisibility } from "@/hooks/use-social-visibility"
import { getAuthToken } from "@/lib/dynamic"
import { cn } from "@/lib/utils"
import { isErrResponse } from "@/types/error"
import { X, Info } from "lucide-react"

export const ConnectTwitterComponent = ({ forcePopup = false }: { forcePopup?: boolean }) => {
  const [disconnecting, setDisconnecting] = useState(false)
  const queryClient = useQueryClient()
  const { visibility, updateVisibility } = useSocialVisibility()
  const [togglingVisibility, setTogglingVisibility] = useState(false)

  const {
    linkSocialAccount,
    unlinkSocialAccount,
    getLinkedAccountInformation,
    isProcessing,
    error,
  } = useSocialAccounts({
    onError: (err) => {
      console.error("Social account error:", err)
      toast.error("Failed to link X account. Please try again.")
    },
  })

  const xAccount = useMemo(
    () => getLinkedAccountInformation(ProviderEnum.Twitter),
    [getLinkedAccountInformation]
  )

  const isLinked = Boolean(xAccount?.username)
  const prevIsLinkedRef = useRef(isLinked)
  const wasProcessingRef = useRef(false)

  // Detect successful link after OAuth redirect
  useEffect(() => {
    if (isProcessing) {
      wasProcessingRef.current = true
    }

    if (wasProcessingRef.current && !isProcessing && !error) {
      if (!prevIsLinkedRef.current && isLinked) {
        toast.success(`Linked @${xAccount?.username} successfully`)
        queryClient.invalidateQueries({ queryKey: ["user"] })
      }
      wasProcessingRef.current = false
    }

    prevIsLinkedRef.current = isLinked
  }, [isProcessing, isLinked, error, xAccount?.username, queryClient])

  // Show error toast if the SDK reports an OAuth error
  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to link X account")
    }
  }, [error])

  const handleConnect = useCallback(async () => {
    try {
      await linkSocialAccount(ProviderEnum.Twitter, { forcePopup })
    } catch (err) {
      console.error("linkSocialAccount error:", err)
    }
  }, [linkSocialAccount])

  const handleDisconnect = useCallback(async () => {
    setDisconnecting(true)
    try {
      await unlinkSocialAccount(ProviderEnum.Twitter)
      const sync = await unlinkTwitter(getAuthToken())
      queryClient.invalidateQueries({ queryKey: ["user"] })
      if (isErrResponse(sync)) {
        toast.error("X disconnected; profile could not be synced. Try refreshing.")
      } else {
        toast.success("X account disconnected")
      }
    } catch (err) {
      console.error("Failed to disconnect X:", err)
      toast.error("Failed to disconnect X account")
    } finally {
      setDisconnecting(false)
    }
  }, [unlinkSocialAccount, queryClient])

  const connecting = isProcessing && !isLinked

  return (
    <div className="group flex min-w-0 flex-col gap-3 rounded-[12px] border border-neutral-600 bg-neutral-900 px-3 py-2.5 transition-all hover:border-neutral-400 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex size-[42px] shrink-0 items-center justify-center rounded-[8px] border border-neutral-500 bg-neutral-700 p-2.5">
          <Twitter size={18} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="truncate text-sm font-medium text-white">
            {isLinked ? `@${xAccount?.username}` : "X"}
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

      <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-x-2 gap-y-2 sm:w-auto sm:flex-nowrap">
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
          <>
          <div className="flex shrink-0 items-center gap-2.5">
            <span className="flex items-center gap-1 whitespace-nowrap text-xs text-neutral-300">Visible
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex opacity-60 hover:opacity-100 transition-opacity cursor-help mt-px">
                    <Info size={13} className="text-current" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={6}>
                  Show this social on your public profile
                </TooltipContent>
              </Tooltip>
            </span>
            <Switch
              checked={visibility.twitter}
              disabled={togglingVisibility}
              onCheckedChange={async (checked) => {
                setTogglingVisibility(true)
                try {
                  await updateVisibility({ twitter: checked })
                } finally {
                  setTogglingVisibility(false)
                }
              }}
              className="h-5 w-9 [&>span]:h-4 [&>span]:w-4 [&>span]:data-[state=checked]:translate-x-4"
            />
          </div>
          <div className="hidden h-5 w-px shrink-0 bg-neutral-600 sm:block" />
          <div
            className={cn(
              "flex shrink-0 cursor-pointer items-center gap-1 rounded-[12px] border border-neutral-600 px-2.5 py-2 text-xs text-neutral-400 transition-all hover:border-neutral-400 hover:text-red sm:px-3",
              disconnecting && "cursor-default border-neutral-700 text-white"
            )}
            onClick={!disconnecting ? handleDisconnect : undefined}
          >
            {disconnecting ? (
              <>
                <Spinner size={12} />
                <span>Disconnecting</span>
              </>
            ) : (
              <>
                <X size={12} />
                <span>Disconnect</span>
              </>
            )}
          </div>
          </>
        )}
      </div>
    </div>
  )
}
