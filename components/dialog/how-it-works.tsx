"use client"

import { DynamicEmbeddedWidget, getAuthToken, useSocialAccounts } from "@dynamic-labs/sdk-react-core"
import { ProviderEnum } from "@dynamic-labs/types"
import { ArrowLeft, ChevronLeft, Loader2 } from "lucide-react"
import { ReactNode, useEffect, useState } from "react"
import { toast } from "sonner"
import { useAccount } from "@/hooks/use-account"
import { useMutation } from "wagmi/query"
import { updateUser } from "@/actions/users/update"
import Image from "@/components/image"
import { useIsMobileView } from "@/context/mobile-ui-context"
import { useCheckUsername } from "@/hooks/use-check-username"
import useDebounce from "@/hooks/use-debounce"
import { useTikTokVerificationStatus } from "@/hooks/use-tiktok-verification-status"
import { getOptionalUsernameValidationError, normalizeUsernameInput, sanitizeUsernameInput } from "@/lib/username"
import { isErrResponse } from "@/types/error"
import { User } from "@/types/user"
import { Button } from "../ui/button"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Input } from "../ui/input"
import { Separator } from "../ui/separator"
import VerifyTikTok from "../verify-tiktok"
import { CircleCheck, CircleX, Tiktok, Twitter } from "../icons"

const HowItWorks = ({ trigger }: { trigger: ReactNode }) => {
  const [activeStep, setActiveStep] = useState(0)
  const [loginStep, setLoginStep] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoginStep, setIsLoginStep] = useState(true)
  const [hasVisited, setHasVisited] = useState("true")
  const [username, setUsername] = useState("")
  const [isTikTokOpen, setTikTokOpen] = useState(false)
  const { linkSocialAccount, getLinkedAccountInformation } = useSocialAccounts()
  const xProvider = ProviderEnum.Twitter
  const xAccount = getLinkedAccountInformation(xProvider)
  const { data: tikTokStatus, isLoading: isTikTokStatusLoading, refetch: refetchTiktok } = useTikTokVerificationStatus()
  const debouncedUsername = useDebounce(username, 300)
  const normalizedUsername = normalizeUsernameInput(username)
  const usernameValidationError = getOptionalUsernameValidationError(username)
  const isUsernameFormatValid = usernameValidationError === null
  const { data: dataCheckUsername, isLoading: isCheckUsernameLoading } = useCheckUsername(
    normalizedUsername.length > 0 && isUsernameFormatValid ? debouncedUsername : ""
  )
  const isMobile = useIsMobileView()
  const { address: connectedAddress } = useAccount()
  const openTikTok = () => setTikTokOpen(true)
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
      setIsLoginStep(false)
      setUsername("")
    }
  }, [isOpen, hasVisited])
  // Check for first visit on component mount
  useEffect(() => {
    if (isMobile === true || isMobile === null) return
    const hasVisitedBefore = localStorage.getItem("hasVisitedBefore")
    if (!hasVisitedBefore) {
      setHasVisited("false")
    } else {
      setHasVisited(hasVisitedBefore)
    }
    if (!hasVisitedBefore) {
      setIsOpen(true)
      localStorage.setItem("hasVisitedBefore", "true")
    }

    const isFromX = localStorage.getItem("isFromX")
    if (isFromX && isFromX === "true") {
      setIsOpen(true)

      localStorage.removeItem("isFromX")
    }
  }, [isMobile])

  useEffect(() => {
    if (connectedAddress) {
      setLoginStep(1)
    } else {
      setLoginStep(0)
    }
  }, [connectedAddress])

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

  const { mutate: updateUserMutation, isPending } = useMutation({
    mutationFn: async (user: Partial<User>) => await updateUser(user, getAuthToken()),
    onSuccess: (res) => {
      if (isErrResponse(res)) {
        toast.error("Failed to update profile")
      } else {
        toast.success("Profile updated successfully")
      }
      onClose()
    },
    onError: () => {
      toast.error("Failed to update profile")
      onClose()
    },
  })

  const onSubmit = async (username: string) => {
    await updateUserMutation({
      username: normalizeUsernameInput(username),
      bio: normalizeUsernameInput(username),
    })
  }

  function onClose() {
    setIsOpen(false)
    setHasVisited(localStorage.getItem("hasVisitedBefore") || "true")
  }
  const steps = [
    {
      video: "https://cdn.ip.world/videos/how-it-works-1.mp4",
      content: (
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="w-full text-3xl font-medium uppercase">Remix The Internet</div>
          <div className="text-md font-normal">
            Register any Internet trend, personality, or project as an IP, turning it into a community hub where anyone
            can launch tokens and amplify its virality.
          </div>
        </div>
      ),
    },
    {
      video: "https://cdn.ip.world/videos/how-it-works-2.mp4",
      content: (
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="w-full text-3xl font-medium uppercase">Track Virality</div>
          <div className="text-md font-normal">
            Explore what’s trending on the Internet through our virality scoring engine, ranked social media feeds, and
            community takes on every registered IP.
          </div>
        </div>
      ),
    },
    {
      video: "https://cdn.ip.world/videos/how-it-works-3.mp4",
      content: (
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="w-full text-3xl font-medium uppercase">Ensure creators get paid</div>
          <div className="text-md font-normal">
            Help verify the ownership of registered IPs, allowing creators to claim a license that unlocks trading fees
            and token allocations from every remix of their IP.
          </div>
        </div>
      ),
    },
    {
      video: "https://cdn.ip.world/videos/how-it-works-4.mp4",
      content: (
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="w-full text-3xl font-medium uppercase">Earn rewards</div>
          <div className="text-md font-normal">
            Get rewarded for adding value across the IP ecosystem — trading, remixing, moderating, and referring all
            earn you points and help you level up.
          </div>
        </div>
      ),
    },
  ]

  const loginSteps = [
    {
      image: "/images/connect-account.webp",
      content: (
        <div className="flex w-full flex-col items-center justify-center gap-6">
          <DynamicEmbeddedWidget className="w-full" background="none" />
        </div>
      ),
    },
    {
      image: "/images/how-it-works-1.png",
      content: isTikTokOpen ? (
        <div className="flex flex-col items-center justify-center gap-2">
          <VerifyTikTok isModal={false} isOpen={isTikTokOpen} onOpenChange={setTikTokOpen} />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-full text-3xl font-medium">Create Account</div>
          <div className="text-sm font-normal text-neutral-200">
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
          <div className="flex w-full flex-col items-center justify-center gap-3.5 rounded-4xl border bg-[#0D0D0D]">
            {xAccount?.username ? (
              <div className="text-md flex w-full items-center justify-center gap-1.5 rounded-4xl border bg-[#0D0D0D] py-4 font-medium">
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
                className="h-12 w-full rounded-4xl"
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
              className="h-12 w-full rounded-4xl"
            >
              <div>{tikTokStatus.verification ? `@${tikTokStatus.verification.tiktok_username}` : ""}</div>
              {tikTokButtonConfig.text}
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        setHasVisited(localStorage.getItem("hasVisitedBefore") || "true")
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogTitle />
      <DialogContent className="overflow-x-hidden !bg-black sm:max-w-[60.5rem]">
        {isLoginStep ? (
          <div className="flex !w-[60.5rem] border-b px-4 py-4">
            <Image
              src={loginSteps[loginStep]?.image}
              alt={"step" + loginStep}
              variant="content"
              width={476}
              height={476}
              className="aspect-squareh-[29.75rem] w-[29.75rem] rounded-[12px] object-cover"
            />
            <Separator className="mx-4.5" orientation="vertical" />
            <div className="flex h-full w-full flex-col items-center">
              <div className="flex w-full flex-grow items-center justify-center">{loginSteps[loginStep]?.content}</div>

              {isTikTokOpen ? (
                <div className="flex w-full items-start justify-between">
                  <Button
                    onClick={() => setTikTokOpen(false)}
                    className="flex items-center justify-center text-neutral-300"
                    variant="ghost"
                  >
                    <ChevronLeft size={5} className="mt-[0.5px]" />
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    className="flex items-center justify-center"
                    onClick={() => {
                      setTikTokOpen(false)
                      refetchTiktok()
                    }}
                  >
                    Finish
                  </Button>
                </div>
              ) : (
                <div className="flex w-full items-start justify-between">
                  <Button
                    onClick={() => {
                      setIsLoginStep(false)
                    }}
                    className="flex items-center justify-center text-neutral-300"
                    variant="ghost"
                  >
                    <ChevronLeft size={5} className="mt-[0.5px]" />
                    Back
                  </Button>
                  {username !== "" ? (
                    <Button
                      variant="primary"
                      className="flex items-center justify-center"
                      disabled={
                        isPending ||
                        !normalizedUsername ||
                        !isUsernameFormatValid ||
                        isCheckUsernameLoading ||
                        dataCheckUsername?.exists !== false
                      }
                      onClick={async () => {
                        await onSubmit(username)
                      }}
                    >
                      Finish
                    </Button>
                  ) : (
                    <Button
                      variant="grey"
                      className="flex items-center justify-center text-neutral-300"
                      onClick={() => {
                        onClose()
                      }}
                    >
                      Skip
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex !w-[60.5rem] border-b px-4 py-4">
            <video
              src={steps[activeStep]?.video} // assuming you've updated your steps data to include video sources
              autoPlay
              muted
              loop
              width={476}
              height={476}
              className="object-fit aspect-square h-[29.75rem] w-[29.75rem] rounded-[12px]"
            />
            <Separator className="mx-4.5" orientation="vertical" />
            <div className="flex h-full flex-col items-center">
              <div className="flex flex-grow items-center justify-center">{steps[activeStep]?.content}</div>
              <div className="flex w-full items-start justify-between">
                <div className="flex gap-2.5">
                  {steps.map((_, index) => {
                    return (
                      <div
                        onClick={() => setActiveStep(index)}
                        key={index}
                        className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-[6px] px-3 py-2.5 text-neutral-300 ${activeStep === index && "bg-brand !text-brand-secondary"}`}
                      >
                        {index + 1}
                      </div>
                    )
                  })}
                </div>
                <div className="flex gap-2">
                  <div
                    className={`${activeStep === 0 && "!cursor-default opacity-40 hover:!bg-neutral-600"} flex cursor-pointer items-center justify-center rounded-[6px] bg-neutral-600 px-2.5 py-2.5 transition-all hover:bg-neutral-300`}
                  >
                    <ArrowLeft
                      onClick={() => activeStep > 0 && setActiveStep(activeStep - 1)}
                      size={16}
                      className="text-neutral-200"
                    />
                  </div>
                  <div
                    className={`${activeStep === steps.length - 1 && "hidden"} flex cursor-pointer items-center justify-center rounded-[6px] bg-neutral-600 px-2.5 py-2.5 transition-all hover:bg-neutral-300`}
                  >
                    <ArrowLeft
                      onClick={() => activeStep < steps.length - 1 && setActiveStep(activeStep + 1)}
                      size={16}
                      className="rotate-180 text-neutral-200"
                    />
                  </div>

                  <div className={`${activeStep === steps.length - 1 ? "flex" : "hidden"}`}>
                    {hasVisited === "true" ? (
                      <div
                        className={`${activeStep === steps.length - 1 && "!cursor-default opacity-40 hover:!bg-neutral-600"} flex cursor-pointer items-center justify-center rounded-[6px] bg-neutral-600 px-2.5 py-2.5 transition-all hover:bg-neutral-300`}
                      >
                        <ArrowLeft
                          onClick={() => activeStep < steps.length - 1 && setActiveStep(activeStep + 1)}
                          size={16}
                          className="rotate-180 text-neutral-200"
                        />
                      </div>
                    ) : (
                      <Button
                        onClick={() => {
                          setIsLoginStep(true)
                        }}
                        variant="primary"
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default HowItWorks
