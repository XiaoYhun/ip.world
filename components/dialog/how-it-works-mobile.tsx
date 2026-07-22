"use client"

import { DynamicEmbeddedWidget, getAuthToken, useSocialAccounts } from "@dynamic-labs/sdk-react-core"
import { ProviderEnum } from "@dynamic-labs/types"
import { useMutation } from "@tanstack/react-query"
import { ArrowLeft, CircleCheck, CircleX, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useAccount } from "@/hooks/use-account"
import { updateUser } from "@/actions/users/update"
import Image from "@/components/image"
import connectAccountImage from "@/public/images/connect-account.webp"
import { useMobileStack } from "@/context/mobile-ui-context"
import { useIsMobileView } from "@/context/mobile-ui-context"
import { useCheckUsername } from "@/hooks/use-check-username"
import useDebounce from "@/hooks/use-debounce"
import { useTikTokVerificationStatus } from "@/hooks/use-tiktok-verification-status"
import { getOptionalUsernameValidationError, normalizeUsernameInput, sanitizeUsernameInput } from "@/lib/username"
import { cn } from "@/lib/utils"
import { isErrResponse } from "@/types/error"
import { User } from "@/types/user"
import { MobileStackContent } from "../mobile-stack"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Separator } from "../ui/separator"
import VerifyTikTok from "../verify-tiktok"
import { Tiktok, Twitter } from "../icons"

const HowItWorksMobile = () => {
  const { isOpen, openStack, closeStack } = useMobileStack()

  const [activeStep, setActiveStep] = useState(0)
  const [hasVisited, setHasVisited] = useState("true")
  const [username, setUsername] = useState("")
  const [isConnectStep, setIsConnectStep] = useState(false)
  const [isUsernameStep, setIsUsernameStep] = useState(false)
  const [isTikTokStep, setIsTikTokStep] = useState(false)
  const [isFinishStep, setIsFinishStep] = useState(false)
  const debouncedUsername = useDebounce(username, 300)
  const normalizedUsername = normalizeUsernameInput(username)
  const usernameValidationError = getOptionalUsernameValidationError(username)
  const isUsernameFormatValid = usernameValidationError === null
  const { data: dataCheckUsername, isLoading: isCheckUsernameLoading } = useCheckUsername(
    normalizedUsername.length > 0 && isUsernameFormatValid ? debouncedUsername : ""
  )
  const { data: tikTokStatus, isLoading: isTikTokStatusLoading, refetch: refetchTiktok } = useTikTokVerificationStatus()

  const [isTikTokOpen, setTikTokOpen] = useState(false)
  useSocialAccounts()
  const { address: connectedAddress } = useAccount()
  const { linkSocialAccount, getLinkedAccountInformation } = useSocialAccounts()
  const xProvider = ProviderEnum.Twitter
  const xAccount = getLinkedAccountInformation(xProvider)
  const isMobile = useIsMobileView()
  const usernameStatusSuffix =
    normalizedUsername.length === 0 ? null : !isUsernameFormatValid ? (
      <div className="text-red flex items-center justify-center gap-1 text-xs">
        Invalid Username <CircleX size={12} />
      </div>
    ) : isCheckUsernameLoading ? (
      <div className="text-neutral-300 flex items-center justify-center gap-1 text-xs">
        <Loader2 className="h-3 w-3 animate-spin" />
      </div>
    ) : dataCheckUsername?.exists === false ? (
      <div className="text-green flex items-center justify-center gap-1 text-xs">
        Username Available <CircleCheck size={12} />
      </div>
    ) : (
      <div className="text-red flex items-center justify-center gap-1 text-xs">
        Username Unavailable <CircleX size={12} />
      </div>
    )

  useEffect(() => {
    if (isOpen && hasVisited) {
      setActiveStep(0)
      setUsername("")
      setIsConnectStep(false)
      setIsUsernameStep(false)
      setIsTikTokStep(false)
      setIsFinishStep(false)
    }
  }, [isOpen, hasVisited])

  useEffect(() => {
    if (isMobile === false || isMobile === null) return
    const hasVisitedBefore = localStorage.getItem("hasVisitedBefore") === "true"

    if (!hasVisitedBefore) {
      setHasVisited("false")
    } else {
      setHasVisited(hasVisitedBefore.toString())
    }
    if (!hasVisitedBefore) {
      openStack("how-it-works")
      localStorage.setItem("hasVisitedBefore", "true")
    }
    const isFromX = localStorage.getItem("isFromX")
    if (isFromX && isFromX === "true") {
      openStack("how-it-works")
      localStorage.removeItem("isFromX")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile])

  // When wallet is connected, go to username step
  useEffect(() => {
    if (isConnectStep && connectedAddress) {
      setIsConnectStep(false)
      setIsUsernameStep(true)
    }
  }, [connectedAddress, isConnectStep])

  const formatRetryTime = (updatedAt: string): string => {
    const now = new Date().getTime()
    const rejectionTime = new Date(updatedAt).getTime()
    const timeElapsed = now - rejectionTime
    const timeRemaining = 24 * 60 * 60 * 1000 - timeElapsed // 24 hours - elapsed time

    if (timeRemaining <= 0) {
      return "now"
    }

    const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60))
    const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))

    if (hoursRemaining > 0 && minutesRemaining > 0) {
      return `${hoursRemaining}h ${minutesRemaining}m`
    } else if (hoursRemaining > 0) {
      return `${hoursRemaining}h`
    } else {
      return `${minutesRemaining}m`
    }
  }

  const getTikTokButtonConfig = () => {
    if (isTikTokStatusLoading) {
      return { text: "Connecting to TikTok", variant: "primary" as const, disabled: true }
    }

    if (!tikTokStatus?.has_verification) {
      return { text: "Connect TikTok", variant: "primary" as const, disabled: false }
    }
    const verification = tikTokStatus.verification!
    switch (verification.verified) {
      case "pending":
        return { text: "Pending", variant: "ghost" as const, disabled: true, tooltip: "Pending review" }
      case "verified":
        return { text: "Verified", variant: "verified" as const, disabled: true, tooltip: "Verified" }
      case "rejected":
        return {
          text: tikTokStatus.can_retry ? "Retry" : "Rejected",
          variant: tikTokStatus.can_retry ? ("primary" as const) : ("ghost" as const),
          disabled: !tikTokStatus.can_retry,
          tooltip: tikTokStatus.can_retry
            ? "Retry verification"
            : `Rejected. Can retry in ${formatRetryTime(verification.updated_at)}`,
        }
      default:
        return { text: "Connect TikTok", variant: "primary" as const, disabled: false }
    }
  }

  const tikTokButtonConfig = getTikTokButtonConfig()

  function connectToX() {
    linkSocialAccount(xProvider)
    localStorage.setItem("isFromX", "true")
  }

  const openTikTok = () => setTikTokOpen(true)

  const { mutate: updateUserMutation, isPending } = useMutation({
    mutationFn: async (user: Partial<User>) => await updateUser(user, getAuthToken()),
    onSuccess: (res) => {
      if (isErrResponse(res)) {
        toast.error("Failed to update profile")
      } else {
        toast.success("Profile updated successfully")
      }

      closeStack()
    },
    onError: () => {
      toast.error("Failed to update profile")
      closeStack()
    },
  })

  const onSubmit = async (username: string) => {
    await updateUserMutation({
      username: normalizeUsernameInput(username),
      bio: normalizeUsernameInput(username),
    })
  }

  // Steps for onboarding
  const steps = [
    {
      video: "https://cdn.ip.world/videos/how-it-works-1.mp4",
      title: "REMIX THE INTERNET",
      desc: "Register any Internet trend, personality, or project as an IP, turning it into a community hub where anyone can launch tokens and amplify its virality.",
    },
    {
      video: "https://cdn.ip.world/videos/how-it-works-2.mp4",
      title: "TRACK VIRALITY",
      desc: "Explore what's trending on the Internet through our virality scoring engine, ranked social media feeds, and community takes on every registered IP.",
    },
    {
      video: "https://cdn.ip.world/videos/how-it-works-3.mp4",
      title: "ENSURE CREATORS GET PAID",
      desc: "Help verify the ownership of registered IPs, allowing creators to claim a license that unlocks trading fees and token allocations from every remix of their IP.",
    },
    {
      video: "https://cdn.ip.world/videos/how-it-works-4.mp4",
      title: "EARN REWARDS",
      desc: "Get rewarded for adding value across the IP ecosystem — trading, remixing, moderating, and referring all earn you points and help you level up.",
    },
  ]

  // Render onboarding steps
  function renderStep() {
    if (isConnectStep) {
      // Wallet/social connect step
      return (
        <div className="z-[100] flex w-full flex-col items-center justify-center gap-6">
          <div className="flex w-full items-center justify-center rounded-t-2xl bg-black">
            <Image
              src={connectAccountImage}
              alt="connect"
              width={150}
              height={100}
              className="h-70 w-full rounded-t-2xl object-cover p-4"
            />
          </div>
          <div className="w-full max-w-md">
            <DynamicEmbeddedWidget className="w-full" background="none" />
          </div>
        </div>
      )
    }

    if (isUsernameStep) {
      return (
        <div className="flex w-full flex-col items-center justify-center gap-6">
          <div className="flex w-full items-center justify-center rounded-t-2xl bg-black">
            <Image
              src={connectAccountImage}
              alt="username"
              width={150}
              height={100}
              className="h-70 w-full rounded-t-2xl object-cover p-4"
            />
          </div>
          {isTikTokOpen ? (
            <div className="flex flex-col items-center justify-center gap-2">
              <VerifyTikTok isModal={false} isOpen={isTikTokOpen} onOpenChange={setTikTokOpen} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-full text-3xl font-medium">Create Account</div>
              <div className="text-neutral-200 text-sm font-normal">
                Pay 10 $IP to register a licensed IP and link their social profile - think things with a clear creator /
                brand.
              </div>
              <Input
                name="username"
                id="username"
                wrapperclassname="w-full mt-9"
                className="h-12"
                placeholder="Username"
                value={username as string}
                onChange={(e) => setUsername(sanitizeUsernameInput(e.target.value))}
                suffixInside
                suffixPadding="pe-40"
                suffixEl={usernameStatusSuffix}
              />
              <Separator className="my-6" orientation="horizontal" />
              <div className="flex w-full flex-col items-center justify-center gap-3.5 rounded-4xl border">
                {xAccount?.username ? (
                  <div className="text-md flex w-full items-center justify-center gap-1.5 rounded-4xl border py-4 font-medium">
                    <div>
                      <Twitter size={16} />
                    </div>
                    <div>{`@${xAccount.username}`}</div>
                    <div>
                      {xAccount.username === "verified" && (
                        <span className="text-green">
                          <CircleCheck size={16} />
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline-2"
                    className="h-12 w-full rounded-4xl !bg-transparent"
                    onClick={() => (xAccount?.username ? null : connectToX())}
                  >
                    Connect X
                  </Button>
                )}
              </div>
              {tikTokButtonConfig.disabled ? (
                <div className="text-md flex w-full items-center justify-center gap-1.5 rounded-4xl border bg-[#0D0D0D] py-4 font-medium">
                  <div>
                    <Tiktok size={16} />
                  </div>
                  <div>{tikTokStatus.verification ? `@${tikTokStatus.verification.tiktok_username}` : ""}</div>
                  <div>
                    {tikTokStatus.verification?.verified === "verified" ? (
                      <span className="text-green">
                        <CircleCheck size={16} />
                      </span>
                    ) : (
                      <>
                        <Loader2 className="text-brand h-6 w-6 animate-spin" />
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <Button
                  onClick={tikTokButtonConfig.disabled ? undefined : openTikTok}
                  variant="outline-2"
                  className="h-12 w-full rounded-4xl !bg-transparent"
                >
                  <div>{tikTokStatus.verification ? `@${tikTokStatus.verification.tiktok_username}` : ""}</div>
                  {tikTokButtonConfig.text}
                </Button>
              )}
            </div>
          )}
        </div>
      )
    }
    if (isTikTokStep) {
      // TikTok verification step
      return (
        <div className="flex w-full flex-col items-center justify-center gap-6">
          <div className="flex w-full items-center justify-center rounded-t-2xl bg-black">
            <Image
              src={connectAccountImage}
              alt="tiktok"
              width={150}
              height={100}
              className="h-70 w-full rounded-t-2xl object-cover p-4"
            />
          </div>
          <div className="flex w-full max-w-md flex-col items-start gap-2 px-6 pb-2">
            <div className="mb-2 text-2xl font-semibold text-white">Verify TikTok</div>
            <div className="mb-4 text-base leading-relaxed text-neutral-4000">
              DM the following code to @ipdotworld on TikTok. Our team will verify - Check back later.
            </div>
            <VerifyTikTok isModal={false} isOpen={true} onOpenChange={() => { }} />
            <button className="bg-brand mt-6 h-12 w-full rounded-[10px] text-white" onClick={() => setIsFinishStep(true)}>
              Complete
            </button>
          </div>
        </div>
      )
    }
    if (isFinishStep) {
      // Final step
      return (
        <div className="flex w-full flex-col items-center justify-center gap-6">
          <div className="flex w-full items-center justify-center rounded-t-2xl bg-black">
            <Image
              src={connectAccountImage}
              alt="finish"
              width={150}
              height={100}
              className="h-70 w-full rounded-t-2xl object-cover p-4"
            />
          </div>
          <div className="flex w-full max-w-md flex-col items-start gap-2 px-6 pb-2">
            <div className="mb-2 text-2xl font-semibold text-white">Create Account</div>
            <div className="mb-4 text-base leading-relaxed text-green-400">Username Available</div>
            <button className="bg-brand mt-2 h-12 w-full rounded-[10px] text-white" onClick={() => setIsFinishStep(false)}>
              Finish
            </button>
          </div>
        </div>
      )
    }
    // Default: onboarding steps
    return (
      <div className="flex flex-col items-center justify-center gap-6">
        <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#23232A] p-0 shadow-lg">
          <div className="flex flex-col items-center">
            <div className="flex w-full items-center justify-center rounded-t-2xl bg-black">
              <video
                src={steps[activeStep]?.video}
                autoPlay
                muted
                loop
                playsInline
                className="h-70 w-full rounded-t-2xl object-cover p-4"
                style={{ objectFit: "cover" }}
              />
            </div>
            <div className="flex w-full flex-col items-start gap-2 px-6 pb-2">
              <div className="mb-2 text-2xl font-semibold text-white">{steps[activeStep]?.title}</div>
              <div className="text-base leading-relaxed text-neutral-4000">{steps[activeStep]?.desc}</div>
            </div>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-center gap-2">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveStep(index)}
              className={`flex h-8 w-8 items-center justify-center rounded-[10px] text-base font-medium transition-all ${activeStep === index ? "bg-brand text-white" : "border border-transparent bg-transparent text-neutral-400"}`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Navigation buttons
  function renderNav() {
    if (isConnectStep) {
      // Connect wallet step: show back and skip
      return (
        <div className="fixed right-6 bottom-6 z-20 flex gap-3">
          <button
            onClick={() => {
              setIsConnectStep(false)
              setActiveStep(steps.length - 1)
            }}
            className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#23232A] shadow-lg transition-all hover:bg-neutral-2000"
          >
            <ArrowLeft size={24} className="text-white" />
          </button>
          <button
            onClick={() => {
              // Skip: close onboarding or go to main app (customize as needed)
              setIsConnectStep(false)
              setIsUsernameStep(true)
              setActiveStep(0)
            }}
            className="bg-brand hover:bg-brand/80 flex h-10 w-20 items-center justify-center rounded-[12px] text-base font-semibold text-white shadow-lg transition-all"
          >
            Skip
          </button>
        </div>
      )
    }
    if (isUsernameStep || isTikTokStep || isFinishStep) {
      // Username step: nav is Back and Finish, only enable Finish if username available and at least one social connected
      if (isUsernameStep) {
        const usernameAvailable = normalizedUsername && isUsernameFormatValid && dataCheckUsername?.exists === false
        const canFinish = usernameAvailable && (xAccount?.username || tikTokStatus?.verification?.tiktok_username)

        return (
          <div className={cn("fixed right-6 bottom-6 z-20 flex gap-3", { "left-6": canFinish })}>
            <button
              onClick={() => {
                setIsUsernameStep(false)
                setIsConnectStep(true)
                if (isTikTokOpen) setTikTokOpen(false)
              }}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#23232A] shadow-lg transition-all hover:bg-neutral-2000",
                { hidden: canFinish }
              )}
            >
              <ArrowLeft size={24} className="text-white" />
            </button>
            {username !== "" ? (
              <button
                onClick={async () => {
                  if (!!username) {
                    await onSubmit(username)
                  } else if (isTikTokOpen) {
                    setTikTokOpen(false)
                    refetchTiktok()
                  } else {
                    if (canFinish) openTikTok()
                  }
                }}
                className={cn(
                  "flex h-10 items-center justify-center rounded-[12px] text-base font-semibold shadow-lg transition-all",
                  canFinish ? "bg-brand w-full text-white" : "w-20 bg-neutral-2000 text-neutral-400"
                )}
                disabled={
                  !canFinish ||
                  isPending ||
                  isCheckUsernameLoading ||
                  dataCheckUsername?.exists === true ||
                  !dataCheckUsername
                }
              >
                Finish
              </button>
            ) : (
              <button
                onClick={() => {
                  closeStack()
                }}
                className="bg-brand hover:bg-brand/80 flex h-10 w-20 items-center justify-center rounded-[12px] text-base font-semibold text-white shadow-lg transition-all"
              >
                Skip
              </button>
            )}
          </div>
        )
      }
      // TikTok and Finish step nav remains as before
      return (
        <div className="fixed right-6 bottom-6 z-20 flex gap-3">
          <button
            onClick={() => {
              if (isFinishStep) {
                setIsFinishStep(false)
                setActiveStep(0)
              } else if (isTikTokStep) {
                setIsTikTokStep(false)
                setIsUsernameStep(true)
              }
            }}
            className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#23232A] shadow-lg transition-all hover:bg-neutral-2000"
          >
            <ArrowLeft size={24} className="text-white" />
          </button>
        </div>
      )
    }
    // Default nav for onboarding steps
    return (
      <div className="fixed right-6 bottom-6 z-20 flex gap-3">
        <button
          onClick={() => activeStep > 0 && setActiveStep(activeStep - 1)}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#23232A] shadow-lg transition-all",
            activeStep === 0 ? "cursor-default opacity-40" : "hover:bg-neutral-2000"
          )}
          disabled={activeStep === 0}
        >
          <ArrowLeft size={24} className="text-white" />
        </button>
        {activeStep < steps.length - 1 ? (
          <button
            onClick={() => setActiveStep(activeStep + 1)}
            disabled={!connectedAddress && activeStep === steps.length - 1}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#23232A] shadow-lg transition-all",
              !connectedAddress && activeStep === steps.length - 1
                ? "cursor-default opacity-40"
                : "hover:bg-neutral-2000"
            )}
          >
            <ArrowLeft size={24} className="rotate-180 text-white" />
          </button>
        ) : (
          <button
            onClick={() => setIsConnectStep(true)}
            className="bg-brand hover:bg-brand/80 flex h-10 w-28 items-center justify-center rounded-[12px] text-base font-semibold text-white shadow-lg transition-all"
          >
            Connect
          </button>
        )}
      </div>
    )
  }

  return (
    <MobileStackContent id="how-it-works" title="How It Works">
      <div className="fixed top-0 left-0 z-0 h-full w-full bg-gradient-to-b from-black to-[#1A1125]" />
      <div className="relative z-10 flex flex-col">
        <div className="flex flex-1 flex-col items-center justify-center px-4 pb-24">{renderStep()}</div>
        {renderNav()}
      </div>
    </MobileStackContent>
  )
}

export default HowItWorksMobile
