"use client"

import { useMutation } from "@tanstack/react-query"
import { useCallback, useState } from "react"
import { toast } from "sonner"
import { createTikTokVerification } from "@/actions/tiktok-verification/create"
import { VerificationStep } from "@/components/verify-tiktok"
import { getAuthToken } from "@/lib/dynamic"
import { isErrResponse } from "@/types/error"

interface UseTikTokVerificationProps {
  initialUsername?: string
  onComplete?: (username: string) => void
}

export const useTikTokVerification = ({ initialUsername = "", onComplete }: UseTikTokVerificationProps = {}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState<VerificationStep>(VerificationStep.ENTER_USERNAME)
  const [username, setUsername] = useState(initialUsername)
  const [verificationCode, setVerificationCode] = useState("")
  const [submitError, setSubmitError] = useState("")

  const { mutate: submitVerification, isPending: isSubmitting } = useMutation({
    mutationFn: async (data: { tiktok_username: string }) => await createTikTokVerification(data, getAuthToken()),
    onSuccess: (response) => {
      if (isErrResponse(response)) {
        const errorMessage = response.error || "Failed to submit verification request"
        setSubmitError(errorMessage)
        toast.error(errorMessage)
      } else if (!response?.code) {
        const errorMessage = "Failed to get verification code. Please try again."
        setSubmitError(errorMessage)
        toast.error(errorMessage)
      } else {
        setSubmitError("")
        setVerificationCode(response.code)
        setCurrentStep(VerificationStep.SHOW_CODE)
      }
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "Failed to submit verification request"
      setSubmitError(errorMessage)
      toast.error(errorMessage)
    },
  })

  const openVerification = useCallback(() => {
    setIsOpen(true)
  }, [])

  const closeVerification = useCallback(() => {
    setIsOpen(false)
    setCurrentStep(VerificationStep.ENTER_USERNAME)
    setVerificationCode("")
    setSubmitError("")
    if (!initialUsername) {
      setUsername("")
    }
  }, [initialUsername])

  const submitVerificationRequest = useCallback(
    (completedUsername: string) => {
      // Submit the verification request to get the code
      submitVerification({
        tiktok_username: completedUsername,
      })
    },
    [submitVerification]
  )

  const handleComplete = useCallback(
    (completedUsername: string) => {
      if (currentStep === VerificationStep.ENTER_USERNAME) {
        // Submit the verification request to get the code
        submitVerification({
          tiktok_username: completedUsername,
        })
      } else {
        // User is closing the modal after seeing the code
        onComplete?.(completedUsername)
        closeVerification()
      }
    },
    [currentStep, submitVerification, onComplete, closeVerification]
  )

  const completeVerification = useCallback(
    (completedUsername: string) => {
      onComplete?.(completedUsername)
      setIsOpen(false)
      setCurrentStep(VerificationStep.ENTER_USERNAME)
      setVerificationCode("")
      setSubmitError("")
      if (!initialUsername) {
        setUsername("")
      }
    },
    [onComplete, initialUsername]
  )

  return {
    isOpen,
    currentStep,
    username,
    verificationCode,
    isSubmitting,
    submitError,
    openVerification,
    closeVerification,
    handleComplete,
    submitVerificationRequest,
    completeVerification,
    setIsOpen,
    setVerificationCode,
    setCurrentStep,
    setSubmitError,
  }
}
