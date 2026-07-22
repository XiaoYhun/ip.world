"use client"

import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import { useEffect, useState } from "react"
import { spaceGrotesk } from "@/app/fonts/fonts"
import { Tiktok } from "@/components/icons"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import InvisibleInput from "@/components/ui/invisible-input"
import { useTikTokVerification } from "@/hooks/use-tiktok-verification"
import { cn } from "@/lib/utils"
import { Button } from "./ui/button"

export enum VerificationStep {
  ENTER_USERNAME = 0,
  SHOW_CODE = 1,
}

interface VerifyTikTokProps {
  initialUsername?: string
  isModal?: boolean
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onComplete?: (username: string) => void
  onCancel?: () => void
  className?: string
}

interface StepContentProps {
  username: string
  setUsername: (username: string) => void
  verificationCode: string
  currentStep: VerificationStep
  onNext: () => void
  onComplete: () => void
  isSubmitting?: boolean
  isModal: boolean
  submitError?: string
}

const validateTikTokUsername = (username: string): { isValid: boolean; error?: string } => {
  if (!username.trim()) {
    return { isValid: false, error: "Username is required" }
  }

  if (username.length > 24) {
    return { isValid: false, error: "Username must be 24 characters or less" }
  }

  const validPattern = /^[a-zA-Z0-9_.]+$/
  if (!validPattern.test(username)) {
    return { isValid: false, error: "Username can only contain letters, numbers, underscores, and periods" }
  }

  return { isValid: true }
}

const StepContent = ({
  username,
  setUsername,
  verificationCode,
  currentStep,
  onNext,
  onComplete,
  isSubmitting = false,
  isModal,
  submitError,
}: StepContentProps) => {
  const [usernameError, setUsernameError] = useState<string>("")

  const handleUsernameChange = (value: string) => {
    setUsername(value)
    if (usernameError) {
      setUsernameError("")
    }
  }

  const handleNext = () => {
    const validation = validateTikTokUsername(username)
    if (!validation.isValid) {
      setUsernameError(validation.error || "Invalid username")
      return
    }
    onNext()
  }

  const stepConfig = {
    [VerificationStep.ENTER_USERNAME]: {
      title: "Verify TikTok",
      subtitle:
        "Pay 10 $IP to register a licensed IP and link their social profile - think things with a clear creator / brand.",
      content: (
        <div className="mt-5 flex h-full flex-col gap-8">
          <div className="relative">
            <InvisibleInput
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="Enter Your Username"
              className={cn(
                "hover:!bg-gradient-icon w-full rounded-[10px] border border-neutral-600 bg-neutral-800",
                usernameError && "border-red-500"
              )}
              maxLength={24}
              leftComponent={
                <div className="bg-gradient-icon border-[primary - neutrals/20] m-1.5 rounded-[10px] border p-2 text-sm text-neutral-200">
                  <Tiktok size={18} />
                </div>
              }
            />
            {usernameError && <p className="absolute mt-1 text-sm text-red-400">{usernameError}</p>}
          </div>
          <div className="mt-20 flex flex-col gap-2">
            <Button
              onClick={handleNext}
              disabled={!username.trim() || isSubmitting}
              variant="primary"
              className="h-fit rounded-full py-4"
            >
              {isSubmitting ? "Getting Code..." : "Get Verification Code"}
            </Button>
            {submitError && (
              <p className="text-center text-sm text-red-400">{submitError}</p>
            )}
          </div>
        </div>
      ),
    },
    [VerificationStep.SHOW_CODE]: {
      title: "Verify TikTok",
      subtitle: "DM the following code to @ipdotworld on TikTok",
      content: (
        <div className="mt-8 flex flex-col gap-8">
          <div className="flex justify-center">
            <div className="flex gap-8 font-mono text-6xl font-bold text-white">
              {verificationCode.split("").map((digit, index) => (
                <div
                  key={index}
                  className={`border-[primary - neutrals/30] flex h-20 w-10 translate-y-5 items-center justify-center border-b-5 pb-7 text-[64px] font-[400] ${spaceGrotesk.className}`}
                >
                  {digit}
                </div>
              ))}
            </div>
          </div>
          <>
            <p className="translate-y-5 text-center text-sm text-neutral-200">
              Our team will verify - Check back later
            </p>
            {isModal && (
              <Button onClick={onComplete} variant="primary">
                Close
              </Button>
            )}
          </>
        </div>
      ),
    },
  }

  const config = stepConfig[currentStep]

  return (
    <motion.div
      key={currentStep}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="flex flex-col"
    >
      <div className="flex flex-col gap-5 text-left">
        <h2 className="mb-2 text-xl font-semibold text-white">{config.title}</h2>
        <p className="text-sm leading-relaxed text-neutral-200">{config.subtitle}</p>
      </div>
      {config.content}
    </motion.div>
  )
}

const VerifyTikTok = ({
  initialUsername = "",
  isModal = true,
  isOpen = false,
  onOpenChange,
  onComplete,
  onCancel,
  className,
}: VerifyTikTokProps) => {
  const { currentStep, username, verificationCode, isSubmitting, submitError, submitVerificationRequest, setSubmitError } =
    useTikTokVerification({
      initialUsername,
      onComplete,
    })

  const [localUsername, setLocalUsername] = useState(initialUsername)

  useEffect(() => {
    setLocalUsername(username || initialUsername)
  }, [username, initialUsername])

  const handleUsernameChange = (value: string) => {
    setLocalUsername(value)
    if (submitError) setSubmitError("")
  }

  const handleNext = () => {
    submitVerificationRequest(localUsername)
  }

  const handleComplete = () => {
    // Notify parent that verification is complete (triggers status refetch)
    onComplete?.(localUsername)
    // Close the modal
    if (isModal) {
      onOpenChange?.(false)
    }
  }

  const handleCancel = () => {
    onCancel?.()
    if (isModal) {
      onOpenChange?.(false)
    }
  }

  const content = (
    <div className={cn("mx-auto w-full max-w-md", className)}>
      <AnimatePresence mode="wait">
        <StepContent
          username={localUsername}
          setUsername={handleUsernameChange}
          verificationCode={verificationCode}
          currentStep={currentStep}
          onNext={handleNext}
          onComplete={handleComplete}
          isSubmitting={isSubmitting}
          isModal={isModal}
          submitError={submitError}
        />
      </AnimatePresence>
    </div>
  )

  if (isModal) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent
          className="z-[300] flex h-[370px] max-w-[460px] flex-col border-neutral-800 !bg-black p-8"
          overlayClassName="z-[299]"
          hasCloseButton={false}
        >
          <VisuallyHidden>
            <DialogTitle>TikTok Verification</DialogTitle>
          </VisuallyHidden>
          <button
            onClick={handleCancel}
            className="absolute top-4 right-4 cursor-pointer text-neutral-400 transition-colors hover:text-white"
          >
            <X size={20} />
          </button>
          {content}
        </DialogContent>
      </Dialog>
    )
  }

  return content
}

export default VerifyTikTok
