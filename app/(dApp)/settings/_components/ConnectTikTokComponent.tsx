"use client"

import { useDynamicContext } from "@dynamic-labs/sdk-react-core"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { X, RotateCw, Info } from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { motion, AnimatePresence } from "framer-motion"
import { unlinkTikTok } from "@/actions/tiktok-verification/unlink"
import { Tiktok } from "@/components/icons"
import { Button } from "@/components/ui/button"
import Spinner from "@/components/ui/spinner"
import { useTikTokVerificationStatus } from "@/hooks/use-tiktok-verification-status"
import { useTikTokVerification } from "@/hooks/use-tiktok-verification"
import { getAuthToken } from "@/lib/dynamic"
import { isErrResponse } from "@/types/error"
import { cn } from "@/lib/utils"
import { spaceGrotesk } from "@/app/fonts/fonts"
import Switch from "@/components/ui/switch"
import { useSocialVisibility } from "@/hooks/use-social-visibility"

enum CONNECT_STATUS {
  NOT_CONNECTED = "Not connected",
  CONNECTED = "Connected",
  PENDING = "Pending",
  VERIFIED = "Connected ",
  REJECTED = "Rejected",
  CONNECT_FAIL = "Connection failed",
}

export const ConnectTikTokComponent = () => {
  const [connectStatus, setConnectStatus] = useState<CONNECT_STATUS>(CONNECT_STATUS.NOT_CONNECTED)
  const [loading, setLoading] = useState(false)
  const { visibility, updateVisibility } = useSocialVisibility()
  const [togglingVisibility, setTogglingVisibility] = useState(false)
  const [showVerification, setShowVerification] = useState(false)
  const [username, setUsername] = useState("")

  const { setShowAuthFlow, showAuthFlow } = useDynamicContext()
  const queryClient = useQueryClient()

  const {
    data: tikTokStatus,
    isLoading: isTikTokStatusLoading,
    refetch: refetchTikTokStatus,
  } = useTikTokVerificationStatus()

  // TikTok disconnect mutation
  const { mutate: handleTikTokDisconnect, isPending: isTikTokDisconnecting } = useMutation({
    mutationFn: async () => {
      setLoading(true)
      return await unlinkTikTok(getAuthToken())
    },
    onSuccess: async (res) => {
      if (isErrResponse(res)) {
        toast.error("Failed to disconnect TikTok account")
        setLoading(false)
        return
      }

      // Immediately set the TikTok status to disconnected state
      queryClient.setQueryData(["tiktok-verification-status"], { has_verification: false, can_retry: true })

      // Force immediate refresh by removing stale data and refetching
      queryClient.removeQueries({ queryKey: ["tiktok-verification-status"] })
      queryClient.removeQueries({ queryKey: ["user"] })

      // Refetch TikTok status immediately
      await refetchTikTokStatus()

      // Invalidate all related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["user"] })
      queryClient.invalidateQueries({ queryKey: ["tiktok-verification-status"] })

      toast.success("TikTok account disconnected successfully")
      setLoading(false)
    },
    onError: () => {
      toast.error("Failed to disconnect TikTok account")
      setLoading(false)
    },
  })

  const { currentStep, verificationCode, isSubmitting, submitError, submitVerificationRequest, setCurrentStep, setSubmitError } =
    useTikTokVerification({
      onComplete: () => {
        refetchTikTokStatus()
        setShowVerification(false)
        setUsername("")
      },
    })

  const handleConnect = () => {
    setShowVerification(true)
    if (connectStatus === CONNECT_STATUS.PENDING && tikTokStatus?.verification?.code) {
      setCurrentStep(1)
    } else {
      setCurrentStep(0)
    }
  }

  const handleSubmitUsername = () => {
    if (!username.trim()) {
      toast.error("Please enter your TikTok username")
      return
    }
    submitVerificationRequest(username)
  }

  // Update connect status based on TikTok verification state
  useEffect(() => {
    if (isTikTokStatusLoading) {
      return
    }

    if (!tikTokStatus?.has_verification) {
      setConnectStatus(CONNECT_STATUS.NOT_CONNECTED)
      return
    }

    const verification = tikTokStatus.verification
    if (!verification) {
      setConnectStatus(CONNECT_STATUS.NOT_CONNECTED)
      return
    }

    switch (verification.verified) {
      case "pending":
        setConnectStatus(CONNECT_STATUS.PENDING)
        break
      case "verified":
        setConnectStatus(CONNECT_STATUS.VERIFIED)
        break
      case "rejected":
        setConnectStatus(CONNECT_STATUS.REJECTED)
        break
      default:
        setConnectStatus(CONNECT_STATUS.NOT_CONNECTED)
    }
  }, [tikTokStatus, isTikTokStatusLoading])

  // Skeleton loading state
  if (isTikTokStatusLoading) {
    return (
      <div className="flex min-w-0 flex-col gap-3 rounded-[12px] border border-neutral-600 bg-neutral-900 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex size-[42px] shrink-0 items-center justify-center rounded-[8px] border border-neutral-500 bg-neutral-700 p-2.5 opacity-50">
            <Tiktok size={18} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="h-[11px] w-20 animate-pulse rounded bg-neutral-600" />
            <div className="h-[10px] w-24 animate-pulse rounded bg-neutral-600" />
          </div>
        </div>
        <div className="flex w-full shrink-0 justify-end sm:w-auto">
          <div className="h-8 w-20 animate-pulse rounded-full bg-neutral-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className={cn("group flex min-w-0 flex-col gap-3 rounded-[12px] border border-neutral-600 bg-neutral-900 px-3 py-2.5 transition-all hover:border-neutral-400 sm:flex-row sm:items-center sm:justify-between", showVerification ? "rounded-b-none!" : "")}>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex size-[42px] shrink-0 items-center justify-center rounded-[8px] border border-neutral-500 bg-neutral-700 p-2.5">
            <Tiktok size={16} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="truncate text-sm font-medium text-white">
              {tikTokStatus?.verification?.tiktok_username ? `@${tikTokStatus.verification.tiktok_username}` : "TikTok"}
            </p>
            <p
              className={cn(
                "flex items-center gap-1 text-xs",
                connectStatus === CONNECT_STATUS.VERIFIED && "text-green-neon",
                connectStatus === CONNECT_STATUS.REJECTED && "text-pink-neon",
                connectStatus === CONNECT_STATUS.PENDING && "text-purple-200",
                connectStatus === CONNECT_STATUS.CONNECT_FAIL && "text-red",
                connectStatus === CONNECT_STATUS.NOT_CONNECTED && "text-neutral-400"
              )}
            >
              • <span>{connectStatus}</span>
            </p>
          </div>
        </div>
        <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-x-2 gap-y-2 transition-all sm:w-auto sm:flex-nowrap">
          {connectStatus === CONNECT_STATUS.NOT_CONNECTED && (
            <Button variant="primary" className="h-fit rounded-full px-5 py-3 text-sm font-semibold" onClick={handleConnect}>
              {showAuthFlow ? "Connecting..." : "Connect"}
            </Button>
          )}
          {connectStatus === CONNECT_STATUS.PENDING && (
            <div
              className="group/button flex shrink-0 cursor-pointer items-center gap-1 text-sm text-neutral-300 transition-all hover:text-white"
              onClick={handleConnect}
            >
              View Code
            </div>
          )}
          {(connectStatus === CONNECT_STATUS.VERIFIED || connectStatus === CONNECT_STATUS.REJECTED) && (
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
                checked={visibility.tiktok}
                disabled={togglingVisibility}
                onCheckedChange={async (checked) => {
                  setTogglingVisibility(true)
                  try {
                    await updateVisibility({ tiktok: checked })
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
                (loading || isTikTokDisconnecting) && "cursor-default border-neutral-700 text-white"
              )}
              onClick={() => !loading && !isTikTokDisconnecting && handleTikTokDisconnect()}
            >
              {loading || isTikTokDisconnecting ? (
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
          {connectStatus === CONNECT_STATUS.CONNECT_FAIL && (
            <div
              className={cn(
                "group/button flex items-center gap-1 text-sm text-neutral-300 transition-all",
                loading ? "cursor-default text-white" : "cursor-pointer hover:text-white"
              )}
              onClick={handleConnect}
            >
              {loading ? (
                <>
                  <motion.span layoutId="icon" className="animate-spin" transition={{ duration: 0.1 }}>
                    <RotateCw size={12} />
                  </motion.span>
                  <motion.span layoutId="text" transition={{ duration: 0.1 }}>
                    Retrying
                  </motion.span>
                </>
              ) : (
                <>
                  <motion.span
                    layoutId="icon"
                    className="translate-x-[5px] !opacity-0 transition-all group-hover/button:translate-x-0 group-hover/button:!opacity-100"
                    transition={{ duration: 0.1 }}
                  >
                    <RotateCw size={12} />
                  </motion.span>
                  <motion.span layoutId="text" transition={{ duration: 0.1 }}>
                    Retry
                  </motion.span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Inline Verification Section */}
      <AnimatePresence>
        {showVerification &&
          (connectStatus === CONNECT_STATUS.NOT_CONNECTED ||
            connectStatus === CONNECT_STATUS.PENDING ||
            connectStatus === CONNECT_STATUS.CONNECT_FAIL) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="rounded-b-[16px] border border-neutral-600 bg-neutral-800 p-6">
                <div className="flex flex-col gap-4">
                  <h3 className="text-base font-semibold text-white">Verify TikTok</h3>

                  {currentStep === 0 ? (
                    <>
                      <p className="text-sm text-neutral-300">
                        Enter your TikTok username to get started
                      </p>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value)
                          if (submitError) setSubmitError("")
                        }}
                        placeholder="Enter your TikTok username"
                        className={cn(
                          "h-[48px] w-full rounded-[12px] border bg-neutral-900 px-4 text-white outline-none placeholder:text-neutral-400 focus:border-neutral-500",
                          submitError ? "border-red-500" : "border-neutral-600"
                        )}
                        maxLength={24}
                      />
                      <Button
                        onClick={handleSubmitUsername}
                        disabled={isSubmitting || !username.trim()}
                        variant="primary"
                        className="h-fit rounded-full py-4"
                      >
                        {isSubmitting ? "Getting Code..." : "Get Verification Code"}
                      </Button>
                      {submitError && (
                        <p className="text-center text-sm text-red-400">{submitError}</p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-neutral-300">
                        DM the following code to @ipdotworld on TikTok
                      </p>

                      <div className="flex justify-center py-6">
                        <div className="flex gap-4 font-mono">
                          {(verificationCode || tikTokStatus?.verification?.code || "").split("").map((digit, index) => (
                            <div
                              key={index}
                              className={cn(
                                "flex h-20 w-16 items-center justify-center border-b-4 border-neutral-500 text-6xl font-normal text-white",
                                spaceGrotesk.className
                              )}
                            >
                              {digit}
                            </div>
                          ))}
                        </div>
                      </div>

                      <Button
                        onClick={() => {
                          setShowVerification(false)
                          setUsername("")
                          refetchTikTokStatus()
                        }}
                        variant="outline"
                        className="h-fit rounded-[8px] border-neutral-500! py-4 bg-transparent!"
                      >
                        I sent the code
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
      </AnimatePresence>
    </div>
  )
}
