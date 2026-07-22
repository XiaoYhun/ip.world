"use client"

import { useForm, useWatch } from "react-hook-form"
import { Button } from "@/components/ui/button"
import CreateIpForm, { ICreateFormInputs } from "./CreateIpForm"
import RightSideView from "./RightSideView"
import { ArrowRight } from "lucide-react"
import { AnimatePresence } from "framer-motion"
import { useCallback, useMemo, useRef, useState, useEffect } from "react"
import CreateTokenForm, { ICreateTokenFormInputs } from "./CreateTokenForm"
import useCreateIp from "@/hooks/use-create-ip"
import useCreateToken from "@/hooks/use-create-token"
import { useCreationRelay, type CreationRelayStatus } from "@/hooks/use-creation-relay"
import { usePaymentCurrency } from "@/context/payment-currency-context"
import type { PaymentCurrency } from "@/config/relay-chains"
import { useNavAssetBalances } from "@/hooks/use-nav-asset-balances"
import { useRefreshAllBalances } from "@/hooks/use-refresh-all-balances"
import { Ip } from "@/types/ip"
import { Address } from "viem"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { floatToBigNumber } from "@/lib/bignumber"
import { detectSocialMediaType, extractTikTokUsername, extractTwitterUsername } from "@/lib/username-extractors"
import { useIsLoggedIn, useDynamicContext } from "@dynamic-labs/sdk-react-core"

const BRIDGE_TOAST_ID = "creation-bridge"
const BRIDGE_STATUS_LABELS: Partial<Record<CreationRelayStatus, string>> = {
  quoting: "Getting swap quote...",
  bridging: "Swapping to IP...",
}

export enum FormStep {
  CREATE_IP = 0,
  CREATE_TOKEN = 1,
}
const SOL_DECIMALS = 9
const USDC_DECIMALS = 6
const MIN_SOL_TX_FEE = 0.003

export default function CreateIpPageClient({ title, ip }: { title?: string; ip?: Ip }) {
  const router = useRouter()
  const isLoggedIn = useIsLoggedIn()
  const { setShowAuthFlow } = useDynamicContext()
  const { paymentCurrency: parentPaymentCurrency } = usePaymentCurrency()
  const [paymentCurrency, setPaymentCurrency] = useState<PaymentCurrency>(parentPaymentCurrency)

  useEffect(() => {
    setPaymentCurrency(parentPaymentCurrency)
  }, [parentPaymentCurrency])

  const isNonIp = paymentCurrency !== "IP"
  const balances = useNavAssetBalances()
  const { refreshAllBalances } = useRefreshAllBalances()
  const [formStep, setFormStep] = useState<FormStep>(FormStep.CREATE_TOKEN)
  const [createdIp, setCreatedIp] = useState<Ip | null>(ip || null)
  const [isBridging, setIsBridging] = useState(false)
  const [temporaryIpData, setTemporaryIpData] = useState<{
    name: string
    description: string
    image: string
  } | null>(null)

  const formIPMethods = useForm<ICreateFormInputs>({
    defaultValues: {
      title: title || "",
      description: "",
      alias: "",
      image: "",
      type: "creator",
      owner_account: "",
      owner_account_type: "",
      socials: [
        { type: "twitter", url: "" },
        { type: "tiktok", url: "" },
        { type: "instagram", url: "" },
        { type: "youtube", url: "" },
      ],
      category: "",
      launch_token: false,
      remix_name: "",
      remix_symbol: "",
      remix_image: "",
      remix_description: "",
      remix_socials: [
        { type: "twitter", url: "" },
        { type: "tiktok", url: "" },
        { type: "instagram", url: "" },
        { type: "youtube", url: "" },
      ],
      remix_buy_amount: 0,
      antiSnipe: false,
    },
  })

  const formTokenMethods = useForm<ICreateTokenFormInputs>({
    defaultValues: {
      name: "",
      symbol: "",
      image: "",
      description: "",
      socials: [
        { type: "twitter", url: "" },
        { type: "tiktok", url: "" },
        { type: "instagram", url: "" },
        { type: "youtube", url: "" },
      ],
      buy_amount: 0,
      antiSnipe: false,
      ip: {
        name: "",
        type: "creator",
        category: "",
        owner_link: "",
      },
    },
  })

  // Callback when token is created successfully
  const onSuccessToken = useCallback(
    (tokenAddress: Address, ipId: string) => {
      router.push(`/token/${tokenAddress}`)
    },
    [router]
  )

  const handleDeletedIp = useCallback((deletedIpId: string) => {
    setCreatedIp((currentIp) => (currentIp?.id === deletedIpId ? null : currentIp))
  }, [])

  const { isPending: isPendingTokenCreation, createTokenContractCall, creationFee } = useCreateToken(
    onSuccessToken,
    true,
    handleDeletedIp
  )

  const watchedBuyAmount = useWatch({
    control: formTokenMethods.control,
    name: "buy_amount",
    defaultValue: 0,
  })

  const creationRelay = useCreationRelay(
    isNonIp ? (watchedBuyAmount ?? 0) : 0,
    paymentCurrency,
    creationFee
  )

  // Show toast feedback as bridge status changes
  const prevBridgeStatusRef = useRef<CreationRelayStatus>("idle")
  useEffect(() => {
    const s = creationRelay.status
    if (s === prevBridgeStatusRef.current) return
    prevBridgeStatusRef.current = s
    const label = BRIDGE_STATUS_LABELS[s]
    if (label) {
      toast.loading(label, { id: BRIDGE_TOAST_ID })
    } else if (s === "complete" || s === "error" || s === "idle") {
      toast.dismiss(BRIDGE_TOAST_ID)
    }
  }, [creationRelay.status])

  const launch_token = useWatch({
    control: formIPMethods.control,
    name: "launch_token",
    defaultValue: false,
  })

  // Watch token image and description changes
  const tokenImage = useWatch({
    control: formTokenMethods.control,
    name: "image",
  })

  const tokenDescription = useWatch({
    control: formTokenMethods.control,
    name: "description",
  })

  // Update formTokenMethods with IP details when ip prop changes
  useEffect(() => {
    if (createdIp) {
      formTokenMethods.setValue("ip.name", createdIp.title)
      formTokenMethods.setValue("ip.category", createdIp.category || "")
      formTokenMethods.setValue("ip.type", createdIp.type || "")
      formTokenMethods.setValue("ip.owner_link", "")
      // Also set the IP in the form state if needed, though it's passed as prop to CreateTokenForm
    }
  }, [createdIp, formTokenMethods])

  // Sync token image and description with temporary IP data
  useEffect(() => {
    setTemporaryIpData((prev) => {
      if (!prev) return prev

      return {
        ...prev,
        image: tokenImage || prev.image,
        description: tokenDescription || prev.description,
      }
    })

    // Also update the IP form in case it's used
    if (tokenImage) {
      formIPMethods.setValue("image", tokenImage)
    }
    if (tokenDescription) {
      formIPMethods.setValue("description", tokenDescription)
    }
  }, [tokenImage, tokenDescription, formIPMethods])

  const insufficientBalance = useMemo((): string | null => {
    const buyAmount = watchedBuyAmount ?? 0

    switch (paymentCurrency) {
      case "IP": {
        const fee = creationFee ?? BigInt(0)
        const buyWei = BigInt(floatToBigNumber(buyAmount, 18).toFixed(0))
        const ipRaw = balances.IP.raw
        if (ipRaw < fee) return "Insufficient IP for creation fee"
        if (ipRaw < buyWei + fee) return "Insufficient IP balance"
        return null
      }
      case "SOL": {
        if (balances.SOL.raw === BigInt(0)) return "Insufficient SOL balance"
        const feeEquiv = creationRelay.feeInCurrency ?? 0
        const totalNeeded = buyAmount + feeEquiv
        if (totalNeeded <= 0) return null
        const totalLamports = BigInt(floatToBigNumber(totalNeeded, SOL_DECIMALS).toFixed(0))
        const txFeeLamports = BigInt(floatToBigNumber(MIN_SOL_TX_FEE, SOL_DECIMALS).toFixed(0))
        if (balances.SOL.raw < totalLamports + txFeeLamports) return "Insufficient SOL balance"
        return null
      }
      case "USDC": {
        if (balances.USDC.raw === BigInt(0)) return "Insufficient USDC balance"
        const feeEquiv = creationRelay.feeInCurrency ?? 0
        const totalNeeded = buyAmount + feeEquiv
        if (totalNeeded <= 0) return null
        const totalRaw = BigInt(floatToBigNumber(totalNeeded, USDC_DECIMALS).toFixed(0))
        if (balances.USDC.raw < totalRaw) return "Insufficient USDC balance"
        return null
      }
      default:
        return null
    }
  }, [paymentCurrency, watchedBuyAmount, creationFee, balances, creationRelay.feeInCurrency])

  // Resolve the buy amount that will be sent to the contract (always in IP).
  // The relay sends targetIpWei = estimatedBuyIp + creationFee, so the
  // fee is covered separately — don't subtract it from the purchase amount.
  const resolveIpBuyAmount = useCallback(
    (formBuyAmount: number): string => {
      if (!isNonIp) return formBuyAmount.toString()
      const estimatedIp = creationRelay.estimate?.estimatedIpHuman ?? 0
      return Math.max(0, estimatedIp).toString()
    },
    [isNonIp, creationRelay.estimate]
  )

  // Callback when IP is created successfully
  const onSuccessIp = useCallback(
    (ip: Ip) => {
      setCreatedIp(ip)

      // Check if we're on the token form step (meaning user already filled token form)
      if (formStep === FormStep.CREATE_TOKEN) {
        const tokenData = formTokenMethods.getValues()
        const tokenDataFormatted: Record<string, string | number | boolean> = {
          name: tokenData.name,
          symbol: tokenData.symbol,
          image: tokenData.image,
          description: tokenData.description,
          socials: JSON.stringify(tokenData.socials),
          buy_amount: resolveIpBuyAmount(tokenData.buy_amount),
          antiSnipe: tokenData.antiSnipe,
        }
        createTokenContractCall(tokenDataFormatted, ip)
      } else {
        router.push(`/ip/${ip.id}`)
      }
    },
    [router, formTokenMethods, createTokenContractCall, formStep, resolveIpBuyAmount]
  )

  const { isPending: isPendingIpCreation, preRegisterIpCall } = useCreateIp(undefined, onSuccessIp)


  // Handle saving temporary IP data from token form
  const handleSaveTemporaryIp = useCallback(
    (ipData: { name: string; description: string; image: string }) => {
      setTemporaryIpData(ipData)
      // Also pre-fill the IP form with this data
      formIPMethods.setValue("title", ipData.name)
      formIPMethods.setValue("description", ipData.description)
      formIPMethods.setValue("image", ipData.image)
      toast.success(`Topic "${ipData.name}" will be created with your token`)
    },
    [formIPMethods]
  )

  // Handle selecting an existing IP from suggestions
  const handleSelectExistingIp = useCallback(
    (ip: Ip) => {
      setCreatedIp(ip)
      // Clear temporary IP data since we're using an existing IP
      setTemporaryIpData(null)
      toast.success(`Topic "${ip.title}" selected`)
    },
    []
  )

  // Handle removing the selected IP
  const handleClearSelectedIp = useCallback(() => {
    setCreatedIp(null)
    toast.info("Topic removed")
  }, [])

  // Proceed with IP + token creation after bridge (or directly for IP currency)
  const proceedWithCreation = useCallback(
    (tokenData: ICreateTokenFormInputs) => {
      if (!createdIp) {
        let ipDataToSubmit: Record<string, string | number | boolean>

        if (temporaryIpData) {
          const ipDataTemp = {
            title: temporaryIpData.name,
            description: temporaryIpData.description,
            image: temporaryIpData.image,
            type: tokenData.ip.type || "creator",
            category: tokenData.ip.category || "",
            owner_account: tokenData.ip.owner_link || "",
            owner_account_type: "",
            socials: JSON.stringify(tokenData.socials),
            alias: "",
            launch_token: true,
          }

          if (ipDataTemp.owner_account) {
            const detectedType = detectSocialMediaType(ipDataTemp.owner_account)
            if (detectedType) {
              ipDataTemp.owner_account_type = detectedType
              ipDataTemp.owner_account =
                detectedType === "twitter"
                  ? extractTwitterUsername(ipDataTemp.owner_account)
                  : extractTikTokUsername(ipDataTemp.owner_account)
            }
          }

          ipDataToSubmit = ipDataTemp as unknown as Record<string, string | number | boolean>
        } else {
          const ipFormData = formIPMethods.getValues()
          const processedData = { ...ipFormData }

          if (processedData.owner_account) {
            const detectedType = detectSocialMediaType(processedData.owner_account)
            if (detectedType) {
              processedData.owner_account_type = detectedType
              processedData.owner_account =
                detectedType === "twitter"
                  ? extractTwitterUsername(processedData.owner_account)
                  : extractTikTokUsername(processedData.owner_account)
            }
          }

          ipDataToSubmit = processedData as unknown as Record<string, string | number | boolean>
        }

        preRegisterIpCall(ipDataToSubmit)
      } else {
        const tokenDataFormatted: Record<string, string | number | boolean> = {
          name: tokenData.name,
          symbol: tokenData.symbol,
          image: tokenData.image,
          description: tokenData.description,
          socials: JSON.stringify(tokenData.socials),
          buy_amount: resolveIpBuyAmount(tokenData.buy_amount),
          antiSnipe: tokenData.antiSnipe,
        }

        createTokenContractCall(tokenDataFormatted, createdIp)
      }
    },
    [createdIp, temporaryIpData, formIPMethods, preRegisterIpCall, createTokenContractCall, resolveIpBuyAmount]
  )

  // Handle Token form submission
  const handleTokenSubmit = useCallback(() => {
    if (!isLoggedIn) {
      setShowAuthFlow(true)
      return
    }
    if (insufficientBalance) {
      toast.error(insufficientBalance)
      return
    }
    formTokenMethods.handleSubmit(
      async (tokenData: ICreateTokenFormInputs) => {
        if (isNonIp) {
          const feeIpWei = creationFee ?? BigInt(0)
          const buyIpWei = creationRelay.estimate?.estimatedIpWei ?? BigInt(0)
          const targetIpWei = feeIpWei + buyIpWei
          setIsBridging(true)
          try {
            await creationRelay.execute(targetIpWei, paymentCurrency)
            await refreshAllBalances()
            proceedWithCreation(tokenData)
          } catch (err) {
            console.error("[createToken] relay execution failed:", err)
            const msg = err instanceof Error ? err.message : "Bridge failed"
            toast.error(msg.length > 100 ? "Swap failed. Please try again." : msg)
          } finally {
            setIsBridging(false)
          }
          return
        }

        proceedWithCreation(tokenData)
      },
      (errors) => {
        console.log("Token Form Errors:", errors)
        const firstError = Object.values(errors)[0]
        if (firstError?.message) {
          toast.error(firstError.message)
        }
      }
    )()
  }, [
    isLoggedIn,
    setShowAuthFlow,
    insufficientBalance,
    formTokenMethods,
    isNonIp,
    paymentCurrency,
    creationRelay,
    creationFee,
    proceedWithCreation,
    refreshAllBalances,
  ])

  const isPending = isBridging || isPendingIpCreation || isPendingTokenCreation
  const isButtonDisabled = isPending || !!insufficientBalance

  return (
    <div className="relative flex flex-col h-[calc(100vh-152px)]" style={{
      backgroundColor: '#000',
      backgroundImage: `
        linear-gradient(45deg, rgba(17,17,17,0.15) 25%, transparent 25%, transparent 75%, rgba(17,17,17,0.15) 75%),
        linear-gradient(45deg, rgba(17,17,17,0.15) 25%, transparent 25%, transparent 75%, rgba(17,17,17,0.15) 75%)
      `,
      backgroundSize: '60px 60px',
      backgroundPosition: '0 0, 30px 30px',
    }}>
      {/* Radial vignette overlay — desktop only */}
      <div className="pointer-events-none absolute inset-0 z-0 hidden sm:block" style={{
        background: 'radial-gradient(ellipse 60% 70% at 80% 50%, transparent 30%, rgba(0,0,0,0.7) 100%)',
        clipPath: 'inset(0 0 0 50%)',
      }} />
      <div className="relative z-10 flex w-full flex-1 flex-col lg:flex-row lg:flex-nowrap overflow-y-auto no-scrollbar">
        <div className="relative z-20 w-full shrink-0 lg:w-1/2 lg:min-w-[600px] sm:pb-0 flex flex-col items-center lg:items-start pt-8 pb-8 lg:pl-8">
          <div className="relative">
            <AnimatePresence mode="wait">
              {formStep === FormStep.CREATE_IP && <CreateIpForm key="ip-form" formMethods={formIPMethods} />}
              {formStep === FormStep.CREATE_TOKEN && (
                <CreateTokenForm
                  key="token-form"
                  formMethods={formTokenMethods}
                  ip={createdIp || undefined}
                  creationFee={creationFee}
                  creationRelay={creationRelay}
                  paymentCurrency={paymentCurrency}
                  onPaymentCurrencyChange={setPaymentCurrency}
                  onSaveTemporaryIp={handleSaveTemporaryIp}
                  onSelectExistingIp={handleSelectExistingIp}
                  onClearSelectedIp={handleClearSelectedIp}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="hidden lg:flex sticky top-0 z-0 w-full items-center justify-center overflow-hidden lg:w-[calc(50%-28.5px)]! pr-4 h-[calc(100vh-152px)]" style={{ contain: 'paint' }}>
          <RightSideView
            formIPMethods={formIPMethods}
            formTokenMethods={formTokenMethods}
            formStep={formStep}
            ipData={createdIp || undefined}
          />
        </div>
      </div>
      {/** Bottom nav */}
      <div className="bg-panel fixed right-0 bottom-0 left-0 z-10 border-t sm:bottom-10 sm:left-[57px]">
        <div className="flex w-full items-center justify-center gap-2 p-3 sm:justify-end">
          {formStep === FormStep.CREATE_TOKEN && (
            <>
              <Button
                variant="primary"
                onClick={handleTokenSubmit}
                disabled={isButtonDisabled}
                className="h-fit! w-full rounded-[16px]! bg-purple-200 p-3.5 text-base font-semibold text-purple-700 sm:w-auto sm:p-3 sm:text-sm"
              >
                {insufficientBalance
                  ? insufficientBalance
                  : isBridging
                    ? `Bridging ${paymentCurrency} to IP...`
                    : isPendingIpCreation
                      ? "Creating Topic..."
                      : isPendingTokenCreation
                        ? "Creating Coin..."
                        : !isLoggedIn
                          ? "Log in to create"
                          : "Create Coin"}{" "}
                <ArrowRight className="size-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
