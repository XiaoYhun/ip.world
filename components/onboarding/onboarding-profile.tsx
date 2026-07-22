"use client"

import { getAuthToken } from "@dynamic-labs/sdk-react-core"
import { motion } from "framer-motion"
import { gsap } from "gsap"
import { Loader2 } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { uploadImage } from "@/actions/image/upload"
import Image from "@/components/image"
import { CircleCheck, CircleX } from "@/components/icons"
import { useCheckUsername } from "@/hooks/use-check-username"
import useDebounce from "@/hooks/use-debounce"
import { BIO_MAX_LENGTH, USERNAME_MAX_LENGTH } from "@/lib/constants"
import { getOptionalUsernameValidationError, normalizeUsernameInput, sanitizeUsernameInput } from "@/lib/username"
import { cn } from "@/lib/utils"
import { isErrResponse } from "@/types/error"

interface OnboardingProfileProps {
  currentStep: number
  totalSteps: number
  isReturningUser?: boolean
  onBack: () => void
  onNext: (data: { username: string; bio: string; avatarUrl: string }) => void
  onValidationChange?: (canProceed: boolean) => void
  onDataChange?: (data: { username: string; bio: string; avatarUrl: string }) => void
  initialData?: { username: string; bio: string; avatarUrl: string }
}

export function OnboardingProfile({ currentStep, totalSteps, isReturningUser, onBack, onNext, onValidationChange, onDataChange, initialData }: OnboardingProfileProps) {
  // Current user's username to exclude from "taken" check
  const currentUsername = normalizeUsernameInput(initialData?.username || "")
  const [username, setUsername] = useState(() => initialData?.username || "")
  const [usernameModified, setUsernameModified] = useState(false)
  const [bio, setBio] = useState(initialData?.bio || "")
  const [avatarUrl, setAvatarUrl] = useState(initialData?.avatarUrl || "")
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialData?.avatarUrl || null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const usernameContainerRef = useRef<HTMLDivElement>(null)
  const usernameInputRef = useRef<HTMLInputElement>(null)
  const bioContainerRef = useRef<HTMLDivElement>(null)
  const bioTextareaRef = useRef<HTMLTextAreaElement>(null)
  const bioCharCountRef = useRef<HTMLSpanElement>(null)
  const profileContainerRef = useRef<HTMLDivElement>(null)

  const debouncedUsername = useDebounce(username, 300)

  useEffect(() => {
    if (usernameModified) return
    setUsername(initialData?.username || "")
  }, [initialData?.username, usernameModified])

  // Animate blur on mount
  useEffect(() => {
    const container = profileContainerRef.current
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
  const normalizedUsername = normalizeUsernameInput(username)
  const normalizedCurrentUsername = normalizeUsernameInput(currentUsername)
  const hasUsernameChanged = normalizedUsername !== normalizedCurrentUsername
  const usernameValidationError = hasUsernameChanged ? getOptionalUsernameValidationError(username) : null
  const isUsernameFormatValid = usernameValidationError === null
  const shouldCheckAvailability = normalizedUsername.length > 0 && hasUsernameChanged && isUsernameFormatValid
  const { data: checkUsernameData, isLoading: isCheckingUsername } = useCheckUsername(shouldCheckAvailability ? debouncedUsername : "")
  const isUsernameAvailable = normalizedUsername.length === 0 || !hasUsernameChanged || checkUsernameData?.exists === false
  const canProceed = isUsernameFormatValid && isUsernameAvailable && !isCheckingUsername

  useEffect(() => {
    onValidationChange?.(canProceed)
  }, [canProceed, onValidationChange])

  // Propagate current form values to parent so the external Next button can submit them
  useEffect(() => {
    onDataChange?.({ username, bio, avatarUrl })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, bio, avatarUrl])

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const simulateProgress = useCallback(() => {
    let progress = 0
    const interval = setInterval(() => {
      progress += 2
      setUploadProgress(progress)
      if (progress >= 90) {
        clearInterval(interval)
      }
    }, 20)
    return () => clearInterval(interval)
  }, [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) return
    if (file.size > 2 * 1024 * 1024) return // 2MB max

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload
    setIsUploading(true)
    setUploadProgress(0)
    const stopProgress = simulateProgress()

    try {
      const token = getAuthToken()
      if (!token) throw new Error("Not authenticated")

      const formData = new FormData()
      formData.append("file", file)

      const response = await uploadImage(formData, "avatar", token)
      if (isErrResponse(response)) {
        throw new Error(response.error)
      }

      setUploadProgress(100)
      setAvatarUrl(response)
    } catch (error) {
      console.error("Upload failed:", error)
      setAvatarPreview(null)
    } finally {
      stopProgress()
      setIsUploading(false)
    }
  }

  // iOS-style shake animation
  const triggerShake = useCallback(() => {
    const container = usernameContainerRef.current
    if (!container) return

    // Store original values
    const originalBoxShadow = container.style.boxShadow || "0px 2px 12px 0px rgba(0,0,0,0.2), inset 0 0 0 0.5px #313131"

    // Kill any existing animations
    gsap.killTweensOf(container)

    // Set transform origin and ensure 3D acceleration
    gsap.set(container, {
      transformOrigin: "center center",
      force3D: true,
    })

    // iOS-style horizontal shake animation
    const shakeValues = [0, -15, 15, -15, 15, -10, 10, -5, 5, 0]

    const tl = gsap.timeline()

    // Set red border immediately
    gsap.set(container, {
      boxShadow: "0px 2px 12px 0px rgba(0,0,0,0.2), inset 0 0 0 1.5px #ea4949",
    })

    // Shake animation - animate through each value
    shakeValues.forEach((value, index) => {
      if (index === 0) return // Skip first value (already at 0)
      tl.to(
        container,
        {
          x: value,
          duration: 0.6 / (shakeValues.length - 1),
          ease: "power1.inOut",
          force3D: true,
        },
        index === 1 ? undefined : "-=0.01"
      )
    })

    // Return border to original
    tl.to(
      container,
      {
        boxShadow: originalBoxShadow,
        duration: 0.3,
        ease: "power2.out",
      },
      "-=0.2"
    )

    // Ensure we're back to original position
    tl.call(() => {
      gsap.set(container, {
        x: 0,
      })
    })
  }, [])

  const triggerBioShake = useCallback(() => {
    const container = bioContainerRef.current
    if (!container) return

    // Store original values
    const originalBoxShadow = container.style.boxShadow || "0px 2px 12px 0px rgba(0,0,0,0.2), inset 0 0 0 0.5px #313131"

    // Kill any existing animations
    gsap.killTweensOf(container)

    // Set transform origin and ensure 3D acceleration
    gsap.set(container, {
      transformOrigin: "center center",
      force3D: true,
    })

    // iOS-style horizontal shake animation
    const shakeValues = [0, -15, 15, -15, 15, -10, 10, -5, 5, 0]

    const tl = gsap.timeline()

    // Set red border immediately
    gsap.set(container, {
      boxShadow: "0px 2px 12px 0px rgba(0,0,0,0.2), inset 0 0 0 1.5px #ea4949",
    })

    // Shake animation - animate through each value
    shakeValues.forEach((value, index) => {
      if (index === 0) return // Skip first value (already at 0)
      tl.to(
        container,
        {
          x: value,
          duration: 0.6 / (shakeValues.length - 1),
          ease: "power1.inOut",
          force3D: true,
        },
        index === 1 ? undefined : "-=0.01"
      )
    })

    // Return border to original
    tl.to(
      container,
      {
        boxShadow: originalBoxShadow,
        duration: 0.3,
        ease: "power2.out",
      },
      "-=0.2"
    )

    // Ensure we're back to original position
    tl.call(() => {
      gsap.set(container, {
        x: 0,
      })
    })
  }, [])

  // Trigger shake when username is taken
  useEffect(() => {
    if (shouldCheckAvailability && !isCheckingUsername && !isUsernameAvailable) {
      triggerShake()
    }
  }, [shouldCheckAvailability, isCheckingUsername, isUsernameAvailable, triggerShake])

  const [shouldShake, setShouldShake] = useState(false)

  // Track previous bio length to detect when limit is hit or user tries to type beyond
  const prevBioLengthRef = useRef(bio.length)

  // Trigger shake when bio hits character limit or user tries to type beyond
  useEffect(() => {
    const wasAtLimit = prevBioLengthRef.current === BIO_MAX_LENGTH
    const isAtLimit = bio.length === BIO_MAX_LENGTH

    // Shake when first hitting the limit
    if (isAtLimit && !wasAtLimit) {
      setShouldShake(true)
      setTimeout(() => setShouldShake(false), 600)
    }

    prevBioLengthRef.current = bio.length
  }, [bio.length])

  const handleNext = () => {
    if (canProceed) {
      onNext({ username, bio, avatarUrl })
    }
  }

  // Handle inner border focus states
  useEffect(() => {
    const usernameInput = usernameInputRef.current
    const usernameContainer = usernameContainerRef.current
    const bioTextarea = bioTextareaRef.current
    const bioContainer = bioContainerRef.current

    const handleUsernameFocus = () => {
      if (usernameContainer) {
        usernameContainer.style.boxShadow = "0px 2px 12px 0px rgba(0,0,0,0.2), inset 0 0 0 1.5px #494949"
      }
    }

    const handleUsernameBlur = () => {
      if (usernameContainer) {
        usernameContainer.style.boxShadow = "0px 2px 12px 0px rgba(0,0,0,0.2), inset 0 0 0 0.5px #313131"
      }
    }

    const handleBioFocus = () => {
      if (bioContainer) {
        const isAtLimit = bio.length === BIO_MAX_LENGTH
        bioContainer.style.boxShadow = isAtLimit
          ? "0px 2px 12px 0px rgba(0,0,0,0.2), inset 0 0 0 1.5px #ea4949"
          : "0px 2px 12px 0px rgba(0,0,0,0.2), inset 0 0 0 1.5px #494949"
      }
    }

    const handleBioBlur = () => {
      if (bioContainer) {
        const isAtLimit = bio.length === BIO_MAX_LENGTH
        bioContainer.style.boxShadow = isAtLimit
          ? "0px 2px 12px 0px rgba(0,0,0,0.2), inset 0 0 0 1.5px #ea4949"
          : "0px 2px 12px 0px rgba(0,0,0,0.2), inset 0 0 0 0.5px #313131"
      }
    }

    if (usernameInput) {
      usernameInput.addEventListener("focus", handleUsernameFocus)
      usernameInput.addEventListener("blur", handleUsernameBlur)
    }

    if (bioTextarea) {
      bioTextarea.addEventListener("focus", handleBioFocus)
      bioTextarea.addEventListener("blur", handleBioBlur)
    }

    return () => {
      if (usernameInput) {
        usernameInput.removeEventListener("focus", handleUsernameFocus)
        usernameInput.removeEventListener("blur", handleUsernameBlur)
      }
      if (bioTextarea) {
        bioTextarea.removeEventListener("focus", handleBioFocus)
        bioTextarea.removeEventListener("blur", handleBioBlur)
      }
    }
  }, [bio.length])

  return (
    <div
      ref={profileContainerRef}
      className="flex h-full w-full flex-col items-center justify-center px-4"
    >
      {/* Header */}
      <motion.div
        className="mb-8 flex flex-col items-center gap-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <h1 className="font-archivo text-center text-2xl leading-[0.95] font-semibold text-white">
          {isReturningUser ? "Update your user profile" : "Create your user profile"}
        </h1>
        <p className="font-archivo text-center text-base leading-[0.95] font-normal text-neutral-200">
          Make a social identity to personalize your experience
        </p>
      </motion.div>

      {/* Avatar Upload */}
      <motion.div
        className="relative mb-8"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <button
          onClick={handleAvatarClick}
          className={cn(
            "group relative h-24 w-24 cursor-pointer overflow-hidden rounded-full",
            avatarPreview && "shadow-[0_0_0_4px_#313131]"
          )}
          disabled={isUploading}
        >
          {avatarPreview ? (
            <>
              {/* Avatar with image */}
              <div className="absolute inset-0 overflow-hidden rounded-full">
                <Image src={avatarPreview} alt="Avatar" fill className="object-cover" />
              </div>
              {/* Upload overlay */}
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-[#191919]">
                  <div className="flex flex-col items-center gap-1">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                    <span className="text-xs text-white">{uploadProgress}%</span>
                  </div>
                </div>
              )}
              {/* Hover overlay */}
              {!isUploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-[#191919] opacity-0 transition-opacity group-hover:opacity-100">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
                    <path
                      d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M17 8L12 3L7 8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 3V15"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Empty state - dashed circle with user icon */}
              <div className="absolute inset-0 flex items-center justify-center rounded-full border-2 border-dashed border-white/10 bg-[#191919] shadow-[0px_2.67px_16px_0px_rgba(0,0,0,0.2)]">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-[#494949]">
                  <path
                    d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              {/* Upload overlay */}
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-[#191919]">
                  <div className="flex flex-col items-center gap-1">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                    <span className="text-xs text-white">{uploadProgress}%</span>
                  </div>
                </div>
              )}
              {/* Hover overlay */}
              {!isUploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-[#191919] opacity-0 transition-opacity group-hover:opacity-100">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
                    <path
                      d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M17 8L12 3L7 8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 3V15"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </>
          )}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
      </motion.div>

      {/* Form Fields */}
      <motion.div
        className="flex w-full max-w-[480px] flex-col gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        {/* Username Input */}
        <div
          ref={usernameContainerRef}
          className="flex min-w-0 items-center justify-between rounded-[12px] bg-[#191919] px-4 py-4 transition-all"
          style={
            {
              boxShadow: "0px 2px 12px 0px rgba(0,0,0,0.2), inset 0 0 0 0.5px #313131",
            } as React.CSSProperties
          }
        >
          <div className="flex flex-1 items-center">
            <input
              ref={usernameInputRef}
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(sanitizeUsernameInput(e.target.value))
                if (!usernameModified) setUsernameModified(true)
              }}
              placeholder="@Username"
              maxLength={USERNAME_MAX_LENGTH}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              className="no-input-focus-ring w-full bg-transparent text-sm text-white outline-none placeholder:text-[#797979] focus:ring-0 focus:outline-none focus-visible:outline-none"
            />
          </div>
          <div className="flex shrink-0 items-center gap-2 pl-3">
            {usernameModified && username.length > 0 &&
              !isCheckingUsername &&
              (isUsernameAvailable && isUsernameFormatValid ? (
                <span className="text-green">
                  <CircleCheck size={14} />
                </span>
              ) : (
                <span className="text-red">
                  <CircleX size={14} />
                </span>
              ))}
            {usernameModified && isCheckingUsername && <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-400" />}
            {usernameModified && username.length > 0 && !isCheckingUsername && !isUsernameFormatValid ? (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[10px] whitespace-nowrap text-[#ea4949]"
              >
                {usernameValidationError}
              </motion.span>
            ) : usernameModified && shouldCheckAvailability && !isCheckingUsername && !isUsernameAvailable ? (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[10px] whitespace-nowrap text-[#ea4949]"
              >
                Name taken
              </motion.span>
            ) : null}
          </div>
        </div>

        {/* Bio Input */}
        <div
          ref={bioContainerRef}
          className="flex h-[111px] flex-col justify-between rounded-[12px] bg-[#191919] p-4 transition-all"
          style={
            {
              boxShadow:
                bio.length === BIO_MAX_LENGTH
                  ? "0px 2px 12px 0px rgba(0,0,0,0.2), inset 0 0 0 1.5px #ea4949"
                  : "0px 2px 12px 0px rgba(0,0,0,0.2), inset 0 0 0 0.5px #313131",
            } as React.CSSProperties
          }
        >
          <textarea
            ref={bioTextareaRef}
            value={bio}
            onChange={(e) => {
              const newValue = e.target.value
              // If already at limit and trying to add more, trigger shake
              if (bio.length === BIO_MAX_LENGTH && newValue.length > BIO_MAX_LENGTH) {
                triggerBioShake()
                return
              }
              setBio(newValue)
            }}
            onKeyDown={(e) => {
              // Trigger shake when at limit and user presses any key that would add text
              if (bio.length === BIO_MAX_LENGTH && !e.metaKey && !e.ctrlKey && !e.altKey) {
                const isTextKey = e.key.length === 1 || e.key === "Backspace" || e.key === "Delete"
                if (isTextKey && e.key !== "Backspace" && e.key !== "Delete") {
                  setShouldShake(true)
                  setTimeout(() => setShouldShake(false), 600)
                }
              }
            }}
            placeholder="Write a short bio..."
            maxLength={BIO_MAX_LENGTH}
            rows={3}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className="no-input-focus-ring w-full flex-1 resize-none overflow-hidden bg-transparent text-sm text-white outline-none placeholder:text-[#797979] focus:ring-0 focus:outline-none focus-visible:outline-none"
          />
          <div className="flex items-end justify-end">
            <span
              ref={bioCharCountRef}
              className={cn(
                "inline-block font-mono text-[10px] transition-colors",
                bio.length === BIO_MAX_LENGTH ? "text-[#ea4949]" : "text-[#494949]"
              )}
              style={
                shouldShake
                  ? {
                      animation: "shake-horizontal 0.6s ease-in-out",
                    }
                  : undefined
              }
            >
              {bio.length}/{BIO_MAX_LENGTH}
            </span>
          </div>
        </div>
      </motion.div>

    </div>
  )
}
