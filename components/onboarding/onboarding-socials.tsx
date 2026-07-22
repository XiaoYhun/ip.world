"use client"

import { useSocialAccounts } from "@dynamic-labs/sdk-react-core"
import { ProviderEnum } from "@dynamic-labs/types"
import { motion, AnimatePresence } from "framer-motion"
import { gsap } from "gsap"
import { Loader2, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { CircleCheck, Tiktok, Twitter } from "@/components/icons"
import { useTikTokVerificationStatus } from "@/hooks/use-tiktok-verification-status"
import { useTikTokVerification } from "@/hooks/use-tiktok-verification"
import { cn } from "@/lib/utils"
import { unlinkTikTok } from "@/actions/tiktok-verification/unlink"
import { unlinkTwitter } from "@/actions/users/unlink-twitter"
import { getAuthToken } from "@/lib/dynamic"
import { isErrResponse } from "@/types/error"
import { spaceGrotesk } from "@/app/fonts/fonts"
import { Button } from "@/components/ui/button"

interface OnboardingSocialsProps {
  currentStep: number
  totalSteps: number
  isReturningUser?: boolean
  onBack: () => void
  onNext: () => void
}

enum TIKTOK_STATUS {
  NOT_CONNECTED = "not_connected",
  PENDING = "pending",
  VERIFIED = "verified",
  REJECTED = "rejected",
}

export function OnboardingSocials({ currentStep, totalSteps, isReturningUser, onBack, onNext }: OnboardingSocialsProps) {
  const [showTikTokVerification, setShowTikTokVerification] = useState(false)
  const [username, setUsername] = useState("")
  const [isTwitterDisconnecting, setIsTwitterDisconnecting] = useState(false)
  const [isTikTokDisconnecting, setIsTikTokDisconnecting] = useState(false)
  const { linkSocialAccount, unlinkSocialAccount, getLinkedAccountInformation, isProcessing } = useSocialAccounts({
    onError: (err) => {
      console.error("Social account error:", err)
      toast.error("Failed to link X account. Please try again.")
    },
  })
  const { data: tikTokStatus, isLoading: isTikTokStatusLoading, refetch: refetchTikTok } = useTikTokVerificationStatus()
  const queryClient = useQueryClient()
  const socialsContainerRef = useRef<HTMLDivElement>(null)

  const xProvider = ProviderEnum.Twitter
  const xAccount = getLinkedAccountInformation(xProvider)

  const isTwitterConnected = !!xAccount?.username

  // TikTok status
  const getTikTokStatus = (): TIKTOK_STATUS => {
    if (!tikTokStatus?.has_verification) return TIKTOK_STATUS.NOT_CONNECTED

    const verification = tikTokStatus.verification
    if (!verification) return TIKTOK_STATUS.NOT_CONNECTED

    switch (verification.verified) {
      case "pending":
        return TIKTOK_STATUS.PENDING
      case "verified":
        return TIKTOK_STATUS.VERIFIED
      case "rejected":
        return TIKTOK_STATUS.REJECTED
      default:
        return TIKTOK_STATUS.NOT_CONNECTED
    }
  }

  const tikTokConnectStatus = getTikTokStatus()

  const handleConnectTwitter = async () => {
    try {
      await linkSocialAccount(ProviderEnum.Twitter, { forcePopup: true })
      queryClient.invalidateQueries({ queryKey: ["user"] })
    } catch (err) {
      console.error("linkSocialAccount error:", err)
    }
  }

  const handleDisconnectTwitter = async () => {
    setIsTwitterDisconnecting(true)
    try {
      await unlinkSocialAccount(xProvider)
      const sync = await unlinkTwitter(getAuthToken())
      queryClient.invalidateQueries({ queryKey: ["user"] })
      if (isErrResponse(sync)) {
        toast.error("X disconnected; profile could not be synced. Try refreshing.")
      } else {
        toast.success("X account disconnected successfully")
      }
    } catch (error) {
      console.error("Failed to disconnect X:", error)
      toast.error("Failed to disconnect X account")
    } finally {
      setIsTwitterDisconnecting(false)
    }
  }

  // TikTok verification hook
  const {
    currentStep: verificationStep,
    verificationCode,
    isSubmitting,
    submitError,
    submitVerificationRequest,
    setCurrentStep,
    setSubmitError,
  } = useTikTokVerification({
    onComplete: () => {
      refetchTikTok()
      setShowTikTokVerification(false)
      setUsername("")
    },
  })

  const handleConnectTikTok = () => {
    setShowTikTokVerification(true)
    if (tikTokConnectStatus === TIKTOK_STATUS.PENDING && tikTokStatus?.verification?.code) {
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

  // TikTok disconnect mutation
  const handleDisconnectTikTok = async () => {
    setIsTikTokDisconnecting(true)
    try {
      const res = await unlinkTikTok(getAuthToken())

      if (isErrResponse(res)) {
        toast.error("Failed to disconnect TikTok account")
        setIsTikTokDisconnecting(false)
        return
      }

      // Clear cache and refetch
      queryClient.setQueryData(["tiktok-verification-status"], { has_verification: false, can_retry: true })
      queryClient.removeQueries({ queryKey: ["tiktok-verification-status"] })
      queryClient.removeQueries({ queryKey: ["user"] })

      await refetchTikTok()

      queryClient.invalidateQueries({ queryKey: ["user"] })
      queryClient.invalidateQueries({ queryKey: ["tiktok-verification-status"] })

      toast.success("TikTok account disconnected successfully")
    } catch (error) {
      toast.error("Failed to disconnect TikTok account")
    } finally {
      setIsTikTokDisconnecting(false)
    }
  }

  // Animate blur on mount
  useEffect(() => {
    const container = socialsContainerRef.current
    if (!container) return

    // Set initial heavy blur
    gsap.set(container, {
      filter: "blur(30px)",
    })

    // Animate to unblurred
    gsap.to(container, {
      filter: "blur(0px)",
      duration: 1.2,
      ease: "power2.out",
    })
  }, [])

  return (
    <div
      ref={socialsContainerRef}
      className="flex h-full w-full flex-col items-center justify-center px-4"
    >
      {/* Header */}
      <motion.div
        className="mb-10 flex flex-col items-center gap-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <h1 className="font-archivo text-center text-2xl leading-[0.95] font-semibold text-white">
          {isReturningUser ? "Update your socials" : "Connect your socials"}
        </h1>
        <p className="font-archivo text-center text-base leading-[0.95] font-normal text-neutral-200">
          Link your X or TikTok to qualify for UGC rewards
        </p>
      </motion.div>

      {/* Social Connection Cards */}
      <motion.div
        className="flex w-full max-w-[400px] flex-col gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        {/* Twitter/X Connection */}
        <motion.div
          onClick={!isTwitterConnected && !isProcessing ? handleConnectTwitter : undefined}
          className={cn(
            "group flex items-center justify-between rounded-2xl border px-5 py-4 transition-all w-full",
            isTwitterConnected
              ? "border-green/30 bg-green/5"
              : isProcessing
                ? "border-purple-200/30 bg-purple-200/5"
                : "border-neutral-500 bg-[rgba(25,25,25,0.7)] hover:border-neutral-400 hover:bg-[rgba(35,35,35,0.7)] cursor-pointer"
          )}
          whileHover={isTwitterConnected || isProcessing ? {} : { scale: 1.01 }}
          whileTap={isTwitterConnected || isProcessing ? {} : { scale: 0.99 }}
        >
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-[12px]",
                isTwitterConnected ? "bg-green/10" : "bg-neutral-700"
              )}
            >
              <span className={isTwitterConnected ? "text-green" : "text-white"}>
                <Twitter size={24} />
              </span>
            </div>
            <div className="flex flex-col items-start gap-1">
              <span className="text-base font-semibold text-white">
                {isTwitterConnected ? `@${xAccount.username}` : "Connect X"}
              </span>
              <span className="text-sm text-neutral-400">
                {isTwitterConnected ? "Connected" : isProcessing ? "Connecting..." : "Link your X account"}
              </span>
            </div>
          </div>
          {isTwitterConnected ? (
            <div className="flex items-center gap-3">
              <span className="text-green">
                <CircleCheck size={24} />
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDisconnectTwitter()
                }}
                disabled={isTwitterDisconnecting}
                className={cn(
                  "flex items-center gap-1 text-sm transition-all",
                  isTwitterDisconnecting ? "cursor-default text-white" : "text-neutral-400 hover:text-red cursor-pointer"
                )}
              >
                {isTwitterDisconnecting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Removing</span>
                  </>
                ) : (
                  <>
                    <X size={16} />
                    <span>Remove</span>
                  </>
                )}
              </button>
            </div>
          ) : isProcessing ? (
            <Loader2 className="h-5 w-5 animate-spin text-purple-200" />
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className="text-neutral-400 transition-colors group-hover:text-white"
            >
              <path
                d="M7.5 5L12.5 10L7.5 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </motion.div>

        {/* TikTok Connection */}
        <div>
          <motion.div
            onClick={tikTokConnectStatus === TIKTOK_STATUS.NOT_CONNECTED ? handleConnectTikTok : undefined}
            className={cn(
              "group flex items-center justify-between rounded-2xl border px-5 py-4 transition-all",
              tikTokConnectStatus === TIKTOK_STATUS.VERIFIED
                ? "border-green/30 bg-green/5"
                : tikTokConnectStatus === TIKTOK_STATUS.PENDING
                  ? "border-orange/30 bg-orange/5"
                  : tikTokConnectStatus === TIKTOK_STATUS.REJECTED
                    ? "border-pink-neon/30 bg-pink-neon/5"
                    : "border-neutral-500 bg-[rgba(25,25,25,0.7)] hover:border-neutral-400 hover:bg-[rgba(35,35,35,0.7)] cursor-pointer",
              showTikTokVerification ? "rounded-b-none!" : ""
            )}
            whileHover={tikTokConnectStatus === TIKTOK_STATUS.VERIFIED ? {} : { scale: 1.01 }}
            whileTap={tikTokConnectStatus === TIKTOK_STATUS.VERIFIED ? {} : { scale: 0.99 }}
          >
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-[12px]",
                  tikTokConnectStatus === TIKTOK_STATUS.VERIFIED
                    ? "bg-green/10"
                    : tikTokConnectStatus === TIKTOK_STATUS.PENDING
                      ? "bg-orange/10"
                      : tikTokConnectStatus === TIKTOK_STATUS.REJECTED
                        ? "bg-pink-neon/10"
                        : "bg-neutral-700"
                )}
              >
                <span
                  className={
                    tikTokConnectStatus === TIKTOK_STATUS.VERIFIED
                      ? "text-green"
                      : tikTokConnectStatus === TIKTOK_STATUS.PENDING
                        ? "text-orange"
                        : tikTokConnectStatus === TIKTOK_STATUS.REJECTED
                          ? "text-pink-neon"
                          : "text-white"
                  }
                >
                  <Tiktok size={24} />
                </span>
              </div>
              <div className="flex flex-col items-start gap-1">
                <span className="text-base font-semibold text-white">
                  {tikTokStatus?.verification?.tiktok_username
                    ? `@${tikTokStatus.verification.tiktok_username}`
                    : "Connect TikTok"}
                </span>
                <span className="text-sm text-neutral-400">
                  {isTikTokStatusLoading
                    ? "Loading..."
                    : tikTokConnectStatus === TIKTOK_STATUS.VERIFIED
                      ? "Verified"
                      : tikTokConnectStatus === TIKTOK_STATUS.PENDING
                        ? "Pending verification"
                        : tikTokConnectStatus === TIKTOK_STATUS.REJECTED
                          ? "Verification rejected"
                          : "Verify your TikTok account"}
                </span>
              </div>
            </div>
            {isTikTokStatusLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
            ) : tikTokConnectStatus === TIKTOK_STATUS.VERIFIED || tikTokConnectStatus === TIKTOK_STATUS.REJECTED ? (
              <div className="flex items-center gap-3">
                {tikTokConnectStatus === TIKTOK_STATUS.VERIFIED && (
                  <span className="text-green">
                    <CircleCheck size={24} />
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDisconnectTikTok()
                  }}
                  disabled={isTikTokDisconnecting}
                  className={cn(
                    "flex items-center gap-1 text-sm transition-all",
                    isTikTokDisconnecting ? "cursor-default text-white" : "text-neutral-400 hover:text-red cursor-pointer"
                  )}
                >
                  {isTikTokDisconnecting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Removing</span>
                    </>
                  ) : (
                    <>
                      <X size={16} />
                      <span>Remove</span>
                    </>
                  )}
                </button>
              </div>
            ) : tikTokConnectStatus === TIKTOK_STATUS.PENDING ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleConnectTikTok()
                  }}
                  className="flex items-center gap-1 text-sm text-neutral-400 transition-all hover:text-white cursor-pointer"
                >
                  <span>View Code</span>
                </button>
              </div>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                className="text-neutral-400 transition-colors group-hover:text-white"
              >
                <path
                  d="M7.5 5L12.5 10L7.5 15"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </motion.div>

          {/* Inline TikTok Verification */}
          <AnimatePresence>
            {showTikTokVerification &&
              (tikTokConnectStatus === TIKTOK_STATUS.NOT_CONNECTED || tikTokConnectStatus === TIKTOK_STATUS.PENDING) && (
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

                      {verificationStep === 0 ? (
                        <>
                          <p className="text-sm text-neutral-300">Enter your TikTok username to get started</p>
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
                          <p className="text-sm text-neutral-300">DM the following code to @ipdotworld on TikTok</p>

                          <div className="flex justify-center py-6">
                            <div className="flex gap-4 font-mono">
                              {(verificationCode || tikTokStatus?.verification?.code || "").split("").map((digit, index) => (
                                <div
                                  key={index}
                                  className={cn(
                                    "flex h-16 w-12 items-center justify-center border-b-4 border-neutral-500 text-4xl font-normal text-white sm:h-20 sm:w-16 sm:text-6xl",
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
                              setShowTikTokVerification(false)
                              setUsername("")
                              refetchTikTok()
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
      </motion.div>
    </div>
  )
}
