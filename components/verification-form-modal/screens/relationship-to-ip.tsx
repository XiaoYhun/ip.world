"use client"

import { cn } from "@/lib/utils"
import { normalizeCategoryKey } from "@/lib/verification-criteria"
import { Ip } from "@/types/ip"
import { Check, ChevronDown, Loader2, X } from "lucide-react"
import { Tiktok, Twitter } from "@/components/icons"
import { useCallback, useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { isAddress } from "viem"
import { useVerificationForm } from "../form-context"
import { useDynamicContext } from "@dynamic-labs/sdk-react-core"
import { useSocialAccounts } from "@dynamic-labs/sdk-react-core"
import { ProviderEnum } from "@dynamic-labs/types"
import { useTikTokVerificationStatus } from "@/hooks/use-tiktok-verification-status"
import VerifyTikTok from "@/components/verify-tiktok"
import { useQueryClient } from "@tanstack/react-query"
import { unlinkTwitter } from "@/actions/users/unlink-twitter"
import { getAuthToken } from "@/lib/dynamic"
import { isErrResponse } from "@/types/error"
import { useAccount } from "@/hooks/use-account"
import { useAllRemixes } from "@/hooks/use-remixes"
import Image from "@/components/image"

const titleCase = (s: string) =>
  s.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ")

const CREATOR_ROLE_OPTIONS = (categoryName: string) => [
  {
    key: "creator" as const,
    title: "Original Creator",
    description: `I am the original creator behind this ${categoryName}.`,
  },
  {
    key: "representative" as const,
    title: "Authorized Representative",
    description: `I represent this ${categoryName} or have licensing rights.`,
  },
]

const COMMUNITY_ROLE_OPTIONS = [
  {
    key: "community_lead" as const,
    title: "Community Lead",
    description: "I am the community lead for this token.",
  },
  {
    key: "community_member" as const,
    title: "Community Member",
    description: "I am a token community member.",
  },
]

const inputClass = cn(
  "h-[45px] rounded-[10px] border bg-neutral-700 px-4 outline-none w-full",
  "placeholder:text-neutral-400"
)
const inputShadow = { boxShadow: "0 2px 12px 0 rgba(0, 0, 0, 0.20)" }

export default function RelationshipToIP({ ip, payoutAttempted: payoutAttemptedProp }: { ip: Ip; payoutAttempted?: boolean }) {
  const form = useVerificationForm()
  const queryClient = useQueryClient()
  const categoryName = normalizeCategoryKey(ip.category)
  const isCreator = ip.type === "creator"

  const selectedRole = form.watch("identity_role")
  const fundAddressValue = form.watch("identity_fund_management_address") || ""
  const useMyAccount = form.watch("identity_use_my_account") ?? true
  const [showFundManagementAddressWarning, setShowFundManagementAddressWarning] = useState<boolean>(false)
  const showedErrorWarning = useRef<boolean>(false)
  const [showTikTokVerification, setShowTikTokVerification] = useState(false)
  const payoutAttempted = payoutAttemptedProp ?? false

  const { address: connectedAddress } = useAccount()
  const { showAuthFlow } = useDynamicContext()
  const { getLinkedAccountInformation, linkSocialAccount, unlinkSocialAccount } = useSocialAccounts()
  const xProvider = ProviderEnum.Twitter
  const xAccount = getLinkedAccountInformation(xProvider)
  const isTwitterConnected = !!xAccount?.username
  const { data: tikTokStatus, isLoading: isTikTokStatusLoading, refetch: refetchTikTok } = useTikTokVerificationStatus()
  const [isTwitterDisconnecting, setIsTwitterDisconnecting] = useState(false)

  const tikTokVerified = !!tikTokStatus?.verification?.tiktok_username

  const { remixes: ipRemixes, isLoading: isRemixesLoading } = useAllRemixes(ip.id, "created_at", "asc")
  const officialTokenValue = form.watch("official_token_address") || ""
  const [tokenDropdownOpen, setTokenDropdownOpen] = useState(false)
  const tokenDropdownRef = useRef<HTMLDivElement>(null)

  const selectedRemix = ipRemixes.find((r) => r.token_address === officialTokenValue)

  const referralCodeValue = form.watch("identity_referral_code") || ""
  const [referralStatus, setReferralStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle")
  const referralAbortRef = useRef<AbortController | null>(null)
  const referralTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const REFERRAL_DEBOUNCE_MS = 500

  const validateReferralCode = useCallback(async (code: string) => {
    referralAbortRef.current?.abort()
    const controller = new AbortController()
    referralAbortRef.current = controller

    setReferralStatus("checking")
    form.clearErrors("identity_referral_code")

    try {
      const response = await fetch(
        `/api/users/${encodeURIComponent(code)}/profile`,
        { signal: controller.signal }
      )
      if (controller.signal.aborted) return

      if (!response.ok) {
        setReferralStatus("invalid")
        form.setValue("identity_referral_address", "")
        form.setError("identity_referral_code", { type: "validate", message: "User not found" })
        return
      }
      const user = await response.json()
      if (!user?.wallet_address) {
        setReferralStatus("invalid")
        form.setValue("identity_referral_address", "")
        form.setError("identity_referral_code", { type: "validate", message: "User has no wallet" })
        return
      }
      setReferralStatus("valid")
      form.setValue("identity_referral_address", user.wallet_address)
      form.clearErrors("identity_referral_code")
    } catch (err) {
      if (controller.signal.aborted) return
      setReferralStatus("invalid")
      form.setValue("identity_referral_address", "")
      form.setError("identity_referral_code", { type: "validate", message: "Failed to verify referral code" })
    }
  }, [form])

  useEffect(() => {
    if (referralTimerRef.current) clearTimeout(referralTimerRef.current)
    referralAbortRef.current?.abort()

    const trimmed = referralCodeValue.trim()
    if (!trimmed) {
      setReferralStatus("idle")
      form.setValue("identity_referral_address", "")
      form.clearErrors("identity_referral_code")
      return
    }

    // Block navigation immediately while we wait for debounce + validation
    form.setError("identity_referral_code", { type: "validate", message: "Verifying..." })

    referralTimerRef.current = setTimeout(() => {
      validateReferralCode(trimmed)
    }, REFERRAL_DEBOUNCE_MS)

    return () => {
      if (referralTimerRef.current) clearTimeout(referralTimerRef.current)
    }
  }, [referralCodeValue, validateReferralCode, form])

  // Normalize role when ip type and current role don't match
  useEffect(() => {
    if (isCreator && !["creator", "representative"].includes(selectedRole || "")) {
      form.setValue("identity_role", "creator")
    }
    if (!isCreator && !["community_lead", "community_member"].includes(selectedRole || "")) {
      form.setValue("identity_role", "community_lead")
    }
  }, [ip.type, isCreator, selectedRole, form])

  // Preselect first token if field is empty and remixes are loaded
  useEffect(() => {
    if (!officialTokenValue && ipRemixes.length > 0) {
      form.setValue("official_token_address", ipRemixes[0].token_address)
    }
  }, [ipRemixes, officialTokenValue, form])

  // Close token dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tokenDropdownRef.current && !tokenDropdownRef.current.contains(e.target as Node)) {
        setTokenDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // When "Use my account" is true, sync payout address to connected wallet
  useEffect(() => {
    if (isCreator && useMyAccount && connectedAddress) {
      form.setValue("identity_fund_management_address", connectedAddress)
    }
  }, [isCreator, useMyAccount, connectedAddress, form])

  const fundAddressError = fundAddressValue.trim().length > 0 && !isAddress(fundAddressValue.trim())
  const roleOptions = isCreator ? CREATOR_ROLE_OPTIONS(categoryName) : COMMUNITY_ROLE_OPTIONS
  const effectiveRole = selectedRole || (isCreator ? "creator" : "community_lead")
  const showCompanyRole = isCreator && (effectiveRole === "representative")

  // Clear referral validation when role switches away from "creator" (field becomes hidden)
  useEffect(() => {
    if (effectiveRole !== "creator") {
      setReferralStatus("idle")
      form.clearErrors("identity_referral_code")
    }
  }, [effectiveRole, form])

  const handleConnectX = () => {
    linkSocialAccount(xProvider)
  }

  const handleDisconnectX = async () => {
    setIsTwitterDisconnecting(true)
    try {
      await unlinkSocialAccount(xProvider)
      const sync = await unlinkTwitter(getAuthToken())
      if (isErrResponse(sync)) {
        console.error("unlinkTwitter sync failed:", sync)
      }
      queryClient.invalidateQueries({ queryKey: ["user"] })
    } finally {
      setIsTwitterDisconnecting(false)
    }
  }

  return (
    <div className="rounded-[16px] border bg-neutral-800 p-6 max-h-[540px] min-h-[540px] overflow-y-auto">
      <div className="flex flex-col gap-6">
        <div>
          <div className="font-archivo mb-2 text-[24px] font-medium">
            Verifier Details
          </div>
          <div className="font-archivo text-sm text-neutral-100">
            Please submit information regarding your relationship to {titleCase(ip.title)}.
          </div>
        </div>

        {/* Relationship */}
        <div style={inputShadow}>
          <div className="font-archivo mb-4 text-lg font-medium">
            {isCreator
              ? `Select your relationship to this ${categoryName}`
              : "Select your relationship to this token community"}
          </div>
          <div className="flex flex-col gap-4 md:flex-row">
            {roleOptions.map((option) => {
              const isSelected = effectiveRole === option.key
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => form.setValue("identity_role", option.key)}
                  className={cn(
                    "h-fit flex-1 cursor-pointer rounded-[12px] border bg-neutral-800 p-4 text-left transition-colors",
                    isSelected ? "border-white bg-neutral-700" : "border-neutral-500 hover:border-neutral-300"
                  )}
                  style={inputShadow}
                >
                  <div className="font-archivo mb-3 text-base">{option.title}</div>
                  <div className="font-archivo text-sm text-wrap text-neutral-200">{option.description}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Name, Email, Telegram (and Company/Role when Authorized Representative) */}
        <div className="rounded-[16px] border p-4" style={inputShadow}>
          {showCompanyRole && (
            <div className="flex w-full gap-4">
              <div className="mb-4 flex flex-1 flex-col gap-2">
                <label className="font-archivo text-sm font-semibold">Company Name</label>
                <input
                  {...form.register("identity_company_name")}
                  className={cn(
                    "h-[45px] rounded-[10px] border bg-neutral-700 px-4 outline-none",
                    "placeholder:text-neutral-400"
                  )}
                  type="text"
                  placeholder="Company Name"
                  style={{ boxShadow: "0 2px 12px 0 rgba(0, 0, 0, 0.20)" }}
                />
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <label className="font-archivo text-sm font-semibold">Your Role</label>
                <input
                  {...form.register("identity_your_role")}
                  className={cn(
                    "h-[45px] rounded-[10px] border bg-neutral-700 px-4 outline-none",
                    "placeholder:text-neutral-400"
                  )}
                  type="text"
                  placeholder="Your Role"
                  style={{ boxShadow: "0 2px 12px 0 rgba(0, 0, 0, 0.20)" }}
                />
              </div>
            </div>
          )}
          <div className="flex w-full gap-4">
            <div className="flex flex-1 flex-col gap-2">
              <label className="font-archivo text-sm font-semibold">Name</label>
              <input
                {...form.register("identity_name_pseudonym")}
                className={inputClass}
                type="text"
                placeholder="Name"
                style={inputShadow}
              />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <label className="font-archivo text-sm font-semibold">Email</label>
              <input
                {...form.register("identity_email")}
                className={inputClass}
                type="email"
                placeholder="Email"
                style={inputShadow}
              />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <label className="font-archivo text-sm font-semibold">Telegram</label>
              <input
                {...form.register("identity_telegram")}
                className={cn(inputClass, "w-full")}
                placeholder="@telegramhandle"
                style={inputShadow}
              />
            </div>
          </div>
        </div>

        {/* X Connect & TikTok Connect */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div
            className={cn(
              "flex flex-1 items-center justify-between rounded-[12px] border px-4 py-3",
              isTwitterConnected ? "border-green/30 bg-green/5" : "border-neutral-500 bg-neutral-800"
            )}
          >
            <div className="flex items-center gap-3">
              <span className={isTwitterConnected ? "text-green" : "text-white"}>
                <Twitter size={22} />
              </span>
              <span className="font-archivo text-sm font-medium">
                {isTwitterConnected ? "@" + (xAccount?.username ?? "") : "Connect X"}
              </span>
            </div>
            {isTwitterConnected ? (
              <button
                type="button"
                onClick={handleDisconnectX}
                disabled={isTwitterDisconnecting}
                className="font-archivo text-xs text-neutral-400 hover:text-white disabled:opacity-50"
              >
                {isTwitterDisconnecting ? <Loader2 size={14} className="animate-spin" /> : "Remove"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnectX}
                disabled={showAuthFlow}
                className="font-archivo text-sm font-medium text-white hover:underline disabled:opacity-50"
              >
                {showAuthFlow ? <Loader2 size={16} className="animate-spin" /> : "Connect"}
              </button>
            )}
          </div>
          <div
            className={cn(
              "flex flex-1 items-center justify-between rounded-[12px] border px-4 py-3",
              tikTokVerified ? "border-green/30 bg-green/5" : "border-neutral-500 bg-neutral-800"
            )}
          >
            <div className="flex items-center gap-3">
              <span className={tikTokVerified ? "text-green" : "text-white"}>
                <Tiktok size={22} />
              </span>
              <span className="font-archivo text-sm font-medium">
                {tikTokVerified ? "@" + (tikTokStatus?.verification?.tiktok_username ?? "") : "Connect TikTok"}
              </span>
            </div>
            {tikTokVerified ? (
              <span className="font-archivo text-xs text-green">Connected</span>
            ) : (
              <button
                type="button"
                onClick={() => setShowTikTokVerification(true)}
                disabled={isTikTokStatusLoading}
                className="font-archivo text-sm font-medium text-white hover:underline disabled:opacity-50"
              >
                {isTikTokStatusLoading ? <Loader2 size={16} className="animate-spin" /> : "Connect"}
              </button>
            )}
          </div>
        </div>
        <VerifyTikTok
          isOpen={showTikTokVerification}
          onOpenChange={setShowTikTokVerification}
          onComplete={() => {
            refetchTikTok()
            setShowTikTokVerification(false)
          }}
        />

        {/* Official Token Selector (all IP types) */}
        {ipRemixes.length > 0 && (
          <div className="w-full">
            <div className="font-archivo mb-2 font-medium leading-normal">Official Token</div>
            <div className="font-archivo mb-4 text-sm text-neutral-100">
              Select the official token for this IP. This token will be marked as the default.
            </div>
            <div ref={tokenDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setTokenDropdownOpen((prev) => !prev)}
                className={cn(
                  inputClass,
                  "flex items-center justify-between gap-3 cursor-pointer"
                )}
                style={inputShadow}
              >
                {selectedRemix ? (
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Image
                      src={selectedRemix.image}
                      alt={selectedRemix.name}
                      width={24}
                      height={24}
                      className="size-6 shrink-0 rounded-full object-cover"
                    />
                    <span className="truncate">{selectedRemix.name}</span>
                    <span className="shrink-0 text-neutral-400">${selectedRemix.symbol}</span>
                  </div>
                ) : (
                  <span className="text-neutral-400">
                    {isRemixesLoading ? "Loading tokens..." : "Select a token"}
                  </span>
                )}
                <ChevronDown size={16} className={cn("shrink-0 text-neutral-400 transition-transform", tokenDropdownOpen && "rotate-180")} />
              </button>
              {tokenDropdownOpen && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[200px] overflow-y-auto rounded-[10px] border border-neutral-600 bg-neutral-700 shadow-lg">
                  {ipRemixes.map((remix) => (
                    <button
                      key={remix.token_address}
                      type="button"
                      onClick={() => {
                        form.setValue("official_token_address", remix.token_address)
                        setTokenDropdownOpen(false)
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-600",
                        remix.token_address === officialTokenValue && "bg-neutral-600"
                      )}
                    >
                      <Image
                        src={remix.image}
                        alt={remix.name}
                        width={24}
                        height={24}
                        className="size-6 shrink-0 rounded-full object-cover"
                      />
                      <span className="truncate">{remix.name}</span>
                      <span className="shrink-0 text-neutral-400">${remix.symbol}</span>
                      {remix.token_address === officialTokenValue && (
                        <Check size={14} className="ml-auto shrink-0 text-green" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Creator-only: Referral Code (only for Original Creator role) */}
        {isCreator && effectiveRole === "creator" && (
          <div className="w-full">
            <div className="font-archivo mb-2 font-medium leading-normal">Referral Code</div>
            <div className="font-archivo mb-4 text-sm text-neutral-100">
              Referral code of the user who referred you to verify
            </div>
            <div className="relative">
              <input
                {...form.register("identity_referral_code")}
                className={cn(
                  inputClass,
                  referralStatus === "invalid" && "border-[#EA4949]",
                  referralStatus === "valid" && "border-green"
                )}
                type="text"
                placeholder="Referral code (optional)"
                style={inputShadow}
              />
              {referralStatus === "checking" && (
                <div className="absolute top-1/2 right-3 -translate-y-1/2">
                  <Loader2 size={16} className="animate-spin text-neutral-400" />
                </div>
              )}
              {referralStatus === "valid" && (
                <div className="absolute top-1/2 right-3 -translate-y-1/2">
                  <Check size={16} className="text-green" />
                </div>
              )}
              {referralStatus === "invalid" && (
                <div className="absolute top-1/2 right-3 -translate-y-1/2">
                  <X size={16} className="text-[#EA4949]" />
                </div>
              )}
            </div>
            {referralStatus === "valid" && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-archivo mt-1 text-xs text-green"
              >
                Valid referral code
              </motion.p>
            )}
            {referralStatus === "invalid" && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-archivo mt-1 text-xs text-[#EA4949]"
              >
                Invalid referral code — user not found or has no wallet
              </motion.p>
            )}
          </div>
        )}

        {/* Creator-only: Payout Address */}
        {isCreator && (
          <div>
            <div className="font-archivo mb-2 font-medium leading-normal">Payout Address</div>
            <div className="font-archivo mb-2 text-sm text-neutral-100">
              Address that will receive verified creator fees. We recommend using the platform embedded wallet (pre-filled as My Account).
            </div>
            <div className="font-archivo mb-4 text-xs font-semibold text-[#EA4949]">
              IMPORTANT: This address cannot be changed after verification. Double-check before submitting.
            </div>
            <div className="flex flex-col gap-4 md:flex-row">
              <button
                type="button"
                onClick={() => {
                  form.setValue("identity_use_my_account", true)
                  if (connectedAddress) {
                    form.setValue("identity_fund_management_address", connectedAddress)
                  }
                }}
                className={cn(
                  "flex-1 cursor-pointer rounded-[12px] border bg-neutral-800 p-4 text-left transition-colors",
                  useMyAccount ? "border-white bg-neutral-700" : "border-neutral-500 hover:border-neutral-300"
                )}
                style={inputShadow}
              >
                <div className="font-archivo mb-1 text-base">Use My Account</div>
                <div className="font-archivo text-sm text-neutral-200">
                  Use your account as the payout address
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  form.setValue("identity_use_my_account", false)
                  form.setValue("identity_fund_management_address", "")
                }}
                className={cn(
                  "flex-1 cursor-pointer rounded-[12px] border bg-neutral-800 p-4 text-left transition-colors",
                  !useMyAccount ? "border-white bg-neutral-700" : "border-neutral-500 hover:border-neutral-300"
                )}
                style={inputShadow}
              >
                <div className="font-archivo mb-1 text-base">Use a Different Address</div>
                <div className="font-archivo text-sm text-neutral-200">
                  Enter a custom payout address
                </div>
              </button>
            </div>
            <div className="relative mt-4">
              <input
                {...form.register("identity_fund_management_address")}
                disabled={useMyAccount}
                className={cn(
                  "w-full rounded-[10px] border bg-neutral-700 px-4 outline-none transition-all duration-200",
                  "placeholder:text-neutral-400",
                  useMyAccount && "cursor-not-allowed text-neutral-300",
                  !useMyAccount && (showFundManagementAddressWarning || fundAddressError) ? "h-[70px] pb-6 pt-3" : "h-[45px]",
                  !useMyAccount && fundAddressError ? "border-[#EA4949]" : "",
                  payoutAttempted && !useMyAccount && !fundAddressValue.trim() ? "border-[#EA4949]" : ""
                )}
                type="text"
                placeholder={useMyAccount ? (connectedAddress || "0x...") : "Enter your address here"}
                value={useMyAccount ? (connectedAddress || "") : undefined}
                style={inputShadow}
                onChange={useMyAccount ? undefined : (e) => {
                  form.setValue("identity_fund_management_address", e.target.value)
                  if (
                    e.target.value.trim() &&
                    !showedErrorWarning.current &&
                    isAddress(e.target.value.trim())
                  ) {
                    setShowFundManagementAddressWarning(true)
                    showedErrorWarning.current = true
                  }
                }}
              />
              {!useMyAccount && fundAddressError && (
                <motion.div
                  initial={{ opacity: 0, y: -2 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-4 bottom-2 left-4 font-mono text-[11px] text-[#EA4949]"
                >
                  <span>Please enter a valid EVM address (0x...)</span>
                </motion.div>
              )}
              {!useMyAccount && !fundAddressError && showFundManagementAddressWarning && (
                <motion.div
                  initial={{ opacity: 0, y: -2 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-4 bottom-2 left-4 flex items-center justify-end gap-2 font-mono text-[11px] text-[#EA4949]"
                >
                  <span>Double-check this address - incorrect addresses cannot receive funds!</span>
                  <button
                    type="button"
                    className="flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-full bg-neutral-500 text-white hover:bg-neutral-400"
                    onClick={() => setShowFundManagementAddressWarning(false)}
                  >
                    <Check size={12} />
                  </button>
                </motion.div>
              )}
              {payoutAttempted && !useMyAccount && !fundAddressValue.trim() && (
                <div className="mt-2 font-mono text-[11px] text-[#EA4949]">
                  Please enter a payout address to continue.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
