"use client"

import { useIsLoggedIn } from "@dynamic-labs/sdk-react-core"
import { motion } from "framer-motion"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Control, Controller, UseFormReturn } from "react-hook-form"
import { Address } from "viem"
import Switch from "@/components/ui/switch"
import { useIsMobileView } from "@/context/mobile-ui-context"
import useCreateIp from "@/hooks/use-create-ip"
import useCreateToken from "@/hooks/use-create-token"
import { TOTAL_SUPPLY } from "@/lib/constants"
import { detectSocialMediaType, extractTikTokUsername, extractTwitterUsername } from "@/lib/username-extractors"
import { cn, getErrorClassName } from "@/lib/utils"
import {
  calculateIPLabelPosition,
  calculatePercentageAllocations,
  calculateTokensFromIP,
  validateIPAmount,
} from "@/lib/utils/token-calculations"
import { Ip } from "@/types/ip"
import Links, { SocialLink } from "./_components/SocialLinks"
import OwnershipType from "./_components/ownership-type"
import { MoneyBag } from "@/components/icons"
import ImageUploader from "./_components/ImageUploader"
import CategorySelector from "./_components/CategorySelector"
import IpNameInput from "./_components/IpNameInput"

export interface ICreateFormInputs {
  title: string
  description: string
  alias: string
  image: string
  type: "creator" | "community"
  owner_account: string
  owner_account_type: string
  socials: SocialLink[]
  category: string

  launch_token: boolean
  remix_name: string
  remix_symbol: string
  remix_image: string
  remix_description: string
  remix_socials: SocialLink[]
  remix_buy_amount: number
  antiSnipe: boolean
}

interface FormProps {
  formMethods: UseFormReturn<ICreateFormInputs>
}

const CreateIpForm = ({ formMethods }: FormProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isLoggedIn = useIsLoggedIn()
  const isMobile = useIsMobileView()

  const definedValues = [0.001, 0.005, 0.01, 0.02, 0.03]
  const [selectedPercentage, setSelectedPercentage] = useState<number | null>(null)

  const {
    handleSubmit,
    control,
    register,
    watch,
    setValue,
    setFocus,
    formState: { errors },
    clearErrors,
  } = formMethods

  const watchedRemixBuyAmount = watch("remix_buy_amount")
  const watchedRemixSymbol = watch("remix_symbol")
  const title = watch("title")
  const description = watch("description")

  // Calculate dynamic position for IP label based on input length
  const ipLabelPosition = useMemo(() => {
    const inputValue = watchedRemixBuyAmount?.toString() || ""
    return calculateIPLabelPosition(inputValue)
  }, [watchedRemixBuyAmount])

  // Calculate expected tokens from IP input
  const expectedTokens = useMemo(() => {
    if (!watchedRemixBuyAmount || watchedRemixBuyAmount <= 0) {
      return 0
    }

    try {
      return calculateTokensFromIP(watchedRemixBuyAmount)
    } catch {
      return 0
    }
  }, [watchedRemixBuyAmount])

  // Calculate actual percentage of total supply
  const actualPercentage = useMemo(() => {
    if (!expectedTokens || expectedTokens <= 0) return 0
    return (expectedTokens / TOTAL_SUPPLY) * 100
  }, [expectedTokens])

  // Calculate IP amounts for percentage buttons
  const percentageCalculations = useMemo(() => {
    return calculatePercentageAllocations(definedValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Validation for IP amount
  const validationError = useMemo(() => {
    if (!watchedRemixBuyAmount || watchedRemixBuyAmount <= 0) {
      return null
    }

    const validation = validateIPAmount(watchedRemixBuyAmount)
    return validation.isValid ? null : validation.error
  }, [watchedRemixBuyAmount])

  // Handle percentage button click
  const handlePercentageClick = useCallback(
    (percentage: number) => {
      const calculation = percentageCalculations.find((calc) => calc.percentage === percentage)
      if (calculation && !calculation.error && calculation.ipRequired > 0) {
        setSelectedPercentage(percentage)
        setValue("remix_buy_amount", calculation.ipRequired)
        clearErrors("remix_buy_amount")
      }
    },
    [percentageCalculations, setValue, clearErrors]
  )

  const [showIpCard, setShowIpCard] = useState(true)

  const onSuccessToken = useCallback(
    (tokenAddress: Address, ipId: string) => {
      console.debug("onSuccessToken", tokenAddress, ipId)
      router.push(`/token/${tokenAddress}`)
    },
    [router]
  )

  const { isPending: isPendingTokenCreation, createTokenContractCall } = useCreateToken(onSuccessToken, true)

  const onSuccess = useCallback(
    (ip: Ip) => {
      if (watch("launch_token") === true) {
        const remixData: Record<string, string | number | boolean> = {
          name: watch("remix_name"),
          symbol: watch("remix_symbol"),
          image: watch("remix_image"),
          description: watch("remix_description"),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          socials: watch("remix_socials") as any,
          buy_amount: watch("remix_buy_amount").toString(),
          antiSnipe: watch("antiSnipe"),
        }
        createTokenContractCall(remixData, ip)
      } else {
        router.push(`/ip/${ip.id}`)
      }
    },
    [router, watch, createTokenContractCall]
  )

  const { isPending: isPendingIpCreation, preRegisterIpCall } = useCreateIp(undefined, onSuccess)

  useEffect(() => {
    if (isMobile) return // Only run this on desktop views if needed

    const scrollArea = document.getElementById("scroll-area")
    const viewport = scrollArea?.querySelector("[data-radix-scroll-area-viewport]")

    if (!viewport) return

    // Debounce the scroll handler
    const debounceTimeout = 100 // ms
    let timeoutId: NodeJS.Timeout

    const handleScroll = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        const launchTokenForm = document.getElementById("launch-token-form")
        if (launchTokenForm) {
          const scrollTop = viewport.scrollTop
          const formTop = launchTokenForm.offsetTop
          setShowIpCard(scrollTop < formTop - 300)
        }
      }, debounceTimeout)
    }

    // Use passive event listener for better performance
    viewport.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      clearTimeout(timeoutId)
      viewport.removeEventListener("scroll", handleScroll)
    }
  }, [isMobile])

  const onSubmit = (data: ICreateFormInputs) => {
    // Extract username from owner_account URL before sending to API
    const processedData = { ...data }

    if (processedData.owner_account) {
      const detectedType = detectSocialMediaType(processedData.owner_account)
      if (detectedType) {
        // Extract only the username for the API call
        processedData.owner_account =
          detectedType === "twitter"
            ? extractTwitterUsername(processedData.owner_account)
            : extractTikTokUsername(processedData.owner_account)
      }
    }

    preRegisterIpCall(processedData as unknown as Record<string, string | number | boolean>)
  }

  const isLaunchingToken = watch("launch_token")
  const shouldShowIpCard = useMemo(() => showIpCard || !isLaunchingToken, [showIpCard, isLaunchingToken])
  const type = watch("type")

  useEffect(() => {
    if (title && searchParams?.has("title")) {
      // Create new URLSearchParams without the title
      const params = new URLSearchParams(searchParams)
      params.delete("title")

      // Replace the URL without page reload
      router.replace(`${pathname}?${params.toString()}`)
    }
  }, [title, pathname, router, searchParams])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -100, transition: { duration: 0.2, ease: "easeInOut" } }}
      transition={{ duration: 0.3 }}
      className="flex h-full w-full items-center justify-center px-6 py-4"
    >
      <div className="flex w-full max-w-[575px] flex-col">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-panel mb-4 flex flex-col gap-4 rounded-[16px] border border-neutral-600 p-6"
        >
          <div className="flex flex-col gap-2">
            <div className="font-medium text-white">Create a culture market</div>
            <div className="text-xs font-light text-neutral-300">Choose the category that best describes your IP</div>
          </div>
          <div className="flex flex-col gap-4">
            <Controller
              name="title"
              rules={{ required: "IP Name is required" }}
              control={control}
              render={({ field: { value, onChange, ref }, fieldState: { error } }) => (
                <IpNameInput
                  ref={ref}
                  value={value}
                  className={cn(
                    "h-[41px] rounded-[8px] border bg-neutral-800 p-4 outline-none placeholder:text-neutral-300",
                    error ? "border-red-400!" : ""
                  )}
                  type="text"
                  placeholder="IP Name*"
                  onChange={(name) => onChange(name)}
                />
              )}
            />
            <Controller
              name="description"
              rules={{
                required: "IP Description is required",
                maxLength: { value: 255, message: "IP Description must be less than 255 characters" },
              }}
              control={control}
              render={({ field: { onChange, ref, value } }) => (
                <div className="relative">
                  <input
                    ref={ref}
                    className="h-[41px] w-full rounded-[8px] border bg-neutral-800 px-4 py-3 pr-18 placeholder:text-neutral-300"
                    type="text"
                    defaultValue={description ? description : ""}
                    placeholder="IP Description*"
                    onChange={(name) => onChange(name)}
                  ></input>
                  <div className="absolute top-1/2 right-4 -translate-y-1/2 text-xs text-neutral-300">
                    {value?.length || 0}/255
                  </div>
                </div>
              )}
            />
            <div className="flex gap-3">
              <Controller
                name="image"
                control={control}
                rules={{ required: "Image is required" }}
                render={({ field: { onChange, ref }, fieldState: { error } }) => (
                  <ImageUploader ref={ref} handleFileChange={(url) => onChange(url)} className="" />
                )}
              />
              <Links name="socials" control={control as unknown as Control} register={register} />
            </div>
            <Controller
              name="category"
              control={control}
              render={({ field: { value, onChange } }) => <CategorySelector value={value} onChange={onChange} />}
            />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-panel mb-4 rounded-[16px] border border-neutral-600 p-6"
        >
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-panel flex items-center gap-3 rounded-[16px] border border-neutral-600 p-4"
        >
          <div className="flex items-center gap-[10px]">
            <div className="flex size-[66px] items-center justify-center rounded-[16px] border bg-neutral-700 p-4">
              <MoneyBag size={34} />
            </div>
            <div className="flex flex-col gap-1">
              <div className="font-medium text-white">Create Token</div>
              <div className="text-sm leading-[17.5px]! text-neutral-200">
                Create a new coin to launch alongside this market
              </div>
            </div>
          </div>
          <Controller
            name="launch_token"
            control={control}
            render={({ field: { value, onChange } }) => <Switch checked={value} onCheckedChange={onChange} />}
          />
        </motion.div>
      </div>
    </motion.div>
  )
}

export default CreateIpForm
