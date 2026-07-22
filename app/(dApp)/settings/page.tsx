"use client"

import { useDynamicContext } from "@dynamic-labs/sdk-react-core"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { useAccount } from "@/hooks/use-account"
import { useTikTokVerificationStatus } from "@/hooks/use-tiktok-verification-status"
import { updateUser } from "@/actions/users/update"
// import { ConnectGoogleComponent } from "./_components/ConnectGoogleComponent"
import { ConnectTikTokComponent } from "./_components/ConnectTikTokComponent"
import { ConnectTwitterComponent } from "./_components/ConnectTwitterComponent"
import { Button } from "@/components/ui/button"
import Spinner from "@/components/ui/spinner"
import { useNavigation } from "@/context/navigation-context"
import { useProfile } from "@/hooks/use-profile"
import { useCheckUsername } from "@/hooks/use-check-username"
import useDebounce from "@/hooks/use-debounce"
import { BIO_MAX_LENGTH, USERNAME_MAX_LENGTH } from "@/lib/constants"
import { getAuthToken } from "@/lib/dynamic"
import { getUsernameValidationError, normalizeUsernameInput } from "@/lib/username"
import { cn } from "@/lib/utils"
import { isErrResponse } from "@/types/error"
import { User } from "@/types/user"
import ImageUploader from "./_components/ImageUploader"
import { motion, AnimatePresence } from "framer-motion"
import UsernameInput from "./_components/UsernameInput"
import CustomTextarea from "./_components/CustomTextarea"
import SettingsNav, { type SettingsTab } from "./_components/SettingsNav"
import SecuritySettings from "./_components/SecuritySettings"
import NetworkRpcSettings from "./_components/NetworkRpcSettings"

const SettingsPage = () => {
  const { user, isUserLoading } = useProfile()
  // Prefetch TikTok status early so it's cached by the time ConnectTikTokComponent renders
  useTikTokVerificationStatus()
  const { previousPage, clearPreviousPage } = useNavigation()
  const router = useRouter()
  const { sdkHasLoaded, setShowAuthFlow } = useDynamicContext()
  const { address, isConnecting } = useAccount()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile")

  // Clear navigation context when component unmounts (navigating away)
  useEffect(() => {
    return () => {
      clearPreviousPage()
    }
  }, [clearPreviousPage])

  const { mutate: updateUserMutation, isPending } = useMutation({
    mutationFn: async (user: Partial<User>) => await updateUser(user, getAuthToken()),
    onSuccess: (res, variables) => {
      if (isErrResponse(res)) {
        if (res?.error === "username already exists") {
          toast.error("Username already exists")
        } else {
          toast.error("Failed to update profile")
        }
      } else {
        // Optimistic update via React Query cache
        queryClient.setQueryData<User | null>(["user", address], (old) => (old ? { ...old, ...variables } : null))
        toast.success("Profile updated successfully")
      }
    },
    onError: () => {
      toast.error("Failed to update profile")
    },
  })

  const {
    register,
    handleSubmit,
    watch,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: {
      username: user?.username || "",
      bio: user?.bio || "",
      avatar_url: user?.avatar_url || "",
    },
  })

  const [isUploading, setIsUploading] = useState(false)

  // Track previous user state to detect logout
  const prevUserRef = useRef(user)

  useEffect(() => {
    // Detect logout - user was logged in but now is null
    if (prevUserRef.current && !user) {
      reset({
        username: "",
        bio: "",
        avatar_url: "",
      })
      queryClient.invalidateQueries({ queryKey: ["user"] })
      setIsUploading(false)
    }
    prevUserRef.current = user
  }, [user, queryClient, reset])

  useEffect(() => {
    if (user) {
      reset({
        username: user.username || "",
        bio: user.bio || "",
        avatar_url: user.avatar_url || "",
      })
    }
  }, [user, reset])

  const handleBackToProfile = () => {
    router.push("/profile")
  }

  // Check if user came from profile page
  const showBackToProfile = previousPage === "profile"

  // Simple loading check - SDK loading or wallet connecting
  if (!sdkHasLoaded || isConnecting) {
    return (
      <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
        <Spinner />
      </div>
    )
  }

  // If no address, show connect wallet
  if (!address) {
    return (
      <div className="flex h-[calc(100vh-200px)] w-full flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-medium">Connect Your Wallet</h2>
        <p className="text-sm text-neutral-200">Please connect your wallet to access settings</p>
        <Button onClick={() => setShowAuthFlow(true)} className="rounded-full">
          Connect Wallet
        </Button>
      </div>
    )
  }

  // If address exists but no user data yet, show loading
  if (address && (isUserLoading || !user)) {
    return (
      <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
        <Spinner />
      </div>
    )
  }

  const onSubmit = async (data: { username: string; bio: string; avatar_url: string }) => {
    if (!isPending && !isUploading) {
      const normalizedSubmittedUsername = normalizeUsernameInput(data.username)
      const normalizedCurrentUsername = normalizeUsernameInput(user?.username || "")
      const usernameChanged = normalizedSubmittedUsername !== normalizedCurrentUsername

      updateUserMutation({
        ...(usernameChanged ? { username: normalizedSubmittedUsername } : {}),
        bio: data.bio,
        avatar_url: data.avatar_url,
      })
    }
  }

  const watchedUsername = watch("username") || ""
  const watchedBio = watch("bio") || ""
  const normalizedCurrentUsername = normalizeUsernameInput(user?.username || "")
  const normalizedWatchedUsername = normalizeUsernameInput(watchedUsername)
  const hasUsernameChanged = normalizedWatchedUsername !== normalizedCurrentUsername
  const usernameValidationError = hasUsernameChanged ? getUsernameValidationError(watchedUsername) : null
  const shouldCheckAvailability = hasUsernameChanged && !usernameValidationError
  const debouncedUsername = useDebounce(watchedUsername, 300)
  const { data: checkUsernameData, isLoading: isCheckingUsername } = useCheckUsername(shouldCheckAvailability ? debouncedUsername : "")
  const isUsernameTaken = shouldCheckAvailability && checkUsernameData?.exists === true
  const usernameHelperError =
    errors.username?.message?.toString() ||
    usernameValidationError ||
    (shouldCheckAvailability && !isCheckingUsername && isUsernameTaken ? "Name taken" : "")

  return (
    /* Outer: full viewport height, no scroll */
    <div className="fixed inset-0 top-[56px] md:left-[57px] overflow-y-auto no-scrollbar px-10 md:grid md:grid-cols-[minmax(200px,1fr)_minmax(480px,3fr)_minmax(0px,1fr)] md:gap-4">

      {/* LEFT: sidebar nav — sticky */}
      <nav className="hidden md:flex sticky top-0 self-start flex-col gap-4 py-10">
        {showBackToProfile && (
          <span
            className="mb-2 flex cursor-pointer items-center gap-2 text-sm font-medium text-white/70 hover:text-white/90"
            onClick={handleBackToProfile}
          >
            <ArrowLeft size={16} /> return to profile
          </span>
        )}
        <SettingsNav activeTab={activeTab} onTabChange={setActiveTab} />
      </nav>

      {/* Mobile tab switcher */}
      <div className="mb-6 flex gap-2 md:hidden">
        <button
          onClick={() => setActiveTab("profile")}
          className={cn(
            "rounded-[10px] px-3 py-2 text-sm font-medium transition-colors",
            activeTab === "profile" ? "bg-white/10 text-white" : "text-neutral-400"
          )}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={cn(
            "rounded-[10px] px-3 py-2 text-sm font-medium transition-colors",
            activeTab === "security" ? "bg-white/10 text-white" : "text-neutral-400"
          )}
        >
          Security
        </button>
        <button
          onClick={() => setActiveTab("network")}
          className={cn(
            "rounded-[10px] px-3 py-2 text-sm font-medium transition-colors",
            activeTab === "network" ? "bg-white/10 text-white" : "text-neutral-400"
          )}
        >
          Network
        </button>
      </div>

      {/* CENTER: scrollable content — grid centers this on the full page */}
      <div className="px-4 py-10">
        <div className="mx-auto max-w-[520px] pb-32">
          {activeTab === "profile" ? (
            <div className="flex flex-col gap-10">
              <div className="flex flex-col gap-5">
                <h1 className="text-base font-medium">Profile Details</h1>
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-neutral-300">Profile Picture</span>
                    <Controller
                      control={control}
                      name="avatar_url"
                      render={({ field: { onChange, value } }) => (
                        <ImageUploader
                          handleFileChange={(url) => onChange(url)}
                          previewUrl={value || ""}
                          onUploadStarted={() => setIsUploading(true)}
                          onUploadEnded={() => setIsUploading(false)}
                        />
                      )}
                    />
                  </div>
                  <UsernameInput
                    {...register("username", {
                      validate: (value) => {
                        const normalizedValue = normalizeUsernameInput(value || "")
                        if (normalizedValue === normalizedCurrentUsername) {
                          return true
                        }

                        return getUsernameValidationError(value || "") ?? true
                      },
                    })}
                    className={cn(errors.username && "border-red!")}
                    maxLength={USERNAME_MAX_LENGTH}
                    suffixEl={
                      <span className="absolute top-1/2 right-2 -translate-y-1/2 text-xs text-neutral-400">
                        {watchedUsername.length}/{USERNAME_MAX_LENGTH}
                      </span>
                    }
                    placeholder="@Username"
                    label="Username"
                  />
                  {usernameHelperError && <ErrorMessage error={usernameHelperError} />}

                  <div className="mt-1" />
                  <CustomTextarea
                    {...register("bio", { maxLength: BIO_MAX_LENGTH })}
                    className={cn("min-h-[80px]", errors.bio && "border-red!")}
                    maxLength={BIO_MAX_LENGTH}
                    suffixEl={
                      <span>
                        {watchedBio.length}/{BIO_MAX_LENGTH}
                      </span>
                    }
                    placeholder="Write a personal bio"
                    label="Bio"
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                  />
                  {errors.bio?.message && <ErrorMessage error={errors.bio?.message || ""} />}
                  {errors.avatar_url?.message && <ErrorMessage error={errors.avatar_url?.message || ""} />}
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <h1 className="text-base font-medium">Link Socials</h1>
                <div className="flex flex-col gap-3">
                  <ConnectTwitterComponent />
                  {/* <ConnectGoogleComponent /> */}
                  <ConnectTikTokComponent />
                </div>
              </div>
            </div>
          ) : activeTab === "security" ? (
            <SecuritySettings />
          ) : (
            <NetworkRpcSettings />
          )}
        </div>
      </div>

      {/* Bottom save bar — fixed above footer on desktop, flush on mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-end border-t border-neutral-600 bg-panel/95 px-6 py-4 backdrop-blur-md md:bottom-[40px] md:left-[57px] md:px-10">
        <Button
          variant="primary"
          className={cn(
            "group flex h-fit items-center gap-0! rounded-x px-6 py-3 text-sm font-semibold",
            (isPending || isUploading) && "pointer-events-none"
          )}
          onClick={handleSubmit(onSubmit)}
          disabled={activeTab !== "profile" || !isDirty || !!usernameValidationError || isUsernameTaken || isCheckingUsername}
        >
          <AnimatePresence>
            {isPending && (
              <motion.div
                layoutId="submit-spinner"
                transition={{ duration: 0.2 }}
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "auto", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
              >
                <Loader2 size={18} className="mr-2 animate-spin" />
              </motion.div>
            )}
          </AnimatePresence>
          Save Settings
          <AnimatePresence>
            {!isPending && (
              <motion.div
                layoutId="submit-arrow"
                transition={{ duration: 0.2 }}
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "auto", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
              >
                <ArrowRight className="ml-2 size-4" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </div>
    </div>
  )
}

const ErrorMessage = ({ error }: { error: string }) => {
  return (
    <motion.div
      initial={{ height: 0 }}
      animate={{ height: "auto" }}
      exit={{ height: 0 }}
      className="flex items-center overflow-hidden pl-1"
      transition={{ duration: 0.1 }}
    >
      <p className="text-red text-xs">{error}</p>
    </motion.div>
  )
}

export default SettingsPage
