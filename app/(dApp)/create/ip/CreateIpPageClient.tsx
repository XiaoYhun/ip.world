"use client"

import { useForm, useWatch } from "react-hook-form"
import { Button } from "@/components/ui/button"
import CreateIpForm, { ICreateFormInputs } from "./CreateIpForm"
import RightSideView from "./RightSideView"
import { ArrowRight } from "lucide-react"
import { AnimatePresence } from "framer-motion"
import { useCallback, useState, useEffect } from "react"
import CreateTokenForm, { ICreateTokenFormInputs } from "./CreateTokenForm"
import useCreateIp from "@/hooks/use-create-ip"
import useCreateToken from "@/hooks/use-create-token"
import { Ip } from "@/types/ip"
import { Address } from "viem"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { detectSocialMediaType, extractTikTokUsername, extractTwitterUsername } from "@/lib/username-extractors"
import { useIsLoggedIn, useDynamicContext } from "@dynamic-labs/sdk-react-core"

export enum FormStep {
  CREATE_IP = 0,
  CREATE_TOKEN = 1,
}
export default function CreateIpPageClient({ title, ip }: { title?: string; ip?: Ip }) {
  const router = useRouter()
  const isLoggedIn = useIsLoggedIn()
  const { setShowAuthFlow } = useDynamicContext()
  const [formStep, setFormStep] = useState<FormStep>(FormStep.CREATE_TOKEN)
  const [createdIp, setCreatedIp] = useState<Ip | null>(ip || null)
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

  // Callback when IP is created successfully
  const onSuccessIp = useCallback(
    (ip: Ip) => {
      setCreatedIp(ip)

      // Check if we're on the token form step (meaning user already filled token form)
      if (formStep === FormStep.CREATE_TOKEN) {
        // IP was created from token form submission
        // Now create the token automatically
        const tokenData = formTokenMethods.getValues()
        const tokenDataFormatted: Record<string, string | number | boolean> = {
          name: tokenData.name,
          symbol: tokenData.symbol,
          image: tokenData.image,
          description: tokenData.description,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          socials: tokenData.socials as any,
          buy_amount: tokenData.buy_amount.toString(),
          antiSnipe: tokenData.antiSnipe,
        }
        createTokenContractCall(tokenDataFormatted, ip)
      } else {
        // IP was created from IP form directly (launch_token was false)
        // Just redirect to IP page
        router.push(`/ip/${ip.id}`)
      }
    },
    [router, formTokenMethods, createTokenContractCall, formStep]
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

  // Handle Token form submission
  const handleTokenSubmit = useCallback(() => {
    if (!isLoggedIn) {
      setShowAuthFlow(true)
      return
    }
    // First validate token form
    formTokenMethods.handleSubmit(
      (tokenData: ICreateTokenFormInputs) => {
        // If IP not created yet, create it first
        if (!createdIp) {
          // Use temporary IP data if available, otherwise use IP form data
          let ipDataToSubmit: Record<string, string | number | boolean>

          if (temporaryIpData) {
            // Create IP from temporary data saved from token form
            const ipDataTemp = {
              title: temporaryIpData.name,
              description: temporaryIpData.description,
              image: temporaryIpData.image,
              type: tokenData.ip.type || "creator",
              category: tokenData.ip.category || "",
              owner_account: tokenData.ip.owner_link || "",
              owner_account_type: "",
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              socials: tokenData.socials as any,
              alias: "",
              launch_token: true,
            }

            // Extract username and detect platform type if owner_account is provided
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
            // Get IP form data (fallback to original behavior)
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

          // Submit IP first - the token will be created in onSuccessIp callback
          preRegisterIpCall(ipDataToSubmit)
        } else {
          // IP already exists, just create token
          const tokenDataFormatted: Record<string, string | number | boolean> = {
            name: tokenData.name,
            symbol: tokenData.symbol,
            image: tokenData.image,
            description: tokenData.description,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            socials: tokenData.socials as any,
            buy_amount: tokenData.buy_amount.toString(),
            antiSnipe: tokenData.antiSnipe,
          }

          createTokenContractCall(tokenDataFormatted, createdIp)
        }
      },
      (errors) => {
        console.log("Token Form Errors:", errors)
        // Show first error
        const firstError = Object.values(errors)[0]
        if (firstError?.message) {
          toast.error(firstError.message)
        }
      }
    )()
  }, [
    isLoggedIn,
    setShowAuthFlow,
    formTokenMethods,
    createdIp,
    createTokenContractCall,
    formIPMethods,
    preRegisterIpCall,
    temporaryIpData,
  ])

  const isPending = isPendingIpCreation || isPendingTokenCreation

  return (
    <div className="flex h-full flex-col">
      <div className="flex w-full flex-1 flex-nowrap">
        <div className="w-1/2 bg-black pb-10">
          <AnimatePresence mode="wait">
            {formStep === FormStep.CREATE_IP && <CreateIpForm key="ip-form" formMethods={formIPMethods} />}
            {formStep === FormStep.CREATE_TOKEN && (
              <CreateTokenForm
                key="token-form"
                formMethods={formTokenMethods}
                ip={createdIp || undefined}
                creationFee={creationFee}
                onSaveTemporaryIp={handleSaveTemporaryIp}
                onSelectExistingIp={handleSelectExistingIp}
                onClearSelectedIp={handleClearSelectedIp}
              />
            )}
          </AnimatePresence>
        </div>
        <div className="fixed top-[102px] right-0 bottom-24 flex w-[calc(50%-28.5px)]! items-center justify-center pr-4">
          <RightSideView
            formIPMethods={formIPMethods}
            formTokenMethods={formTokenMethods}
            formStep={formStep}
            ipData={createdIp || undefined}
          />
        </div>
      </div>
      {/** Bottom nav */}
      <div className="bg-panel fixed right-0 bottom-10 left-[57px] h-14 border-t">
        <div className="flex h-full w-full items-center justify-end gap-2 p-3">
          {formStep === FormStep.CREATE_TOKEN && (
            <>
              <Button
                variant="primary"
                onClick={handleTokenSubmit}
                disabled={isPending}
                className="h-fit! rounded-[16px]! bg-purple-200 p-3 text-sm text-purple-700"
              >
                {isPendingIpCreation
                  ? "Creating Topic..."
                  : isPendingTokenCreation
                    ? "Creating Token..."
                    : !isLoggedIn
                      ? "Log in to create"
                      : "Create"}{" "}
                <ArrowRight className="size-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
