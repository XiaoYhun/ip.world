"use client"

import { useIsLoggedIn, useDynamicContext } from "@dynamic-labs/sdk-react-core"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Address } from "viem"
import { Button } from "@/components/ui/button"
import useCreateToken from "@/hooks/use-create-token"
import { usePaymentCurrency } from "@/context/payment-currency-context"
import type { PaymentCurrency } from "@/config/relay-chains"
import { Ip } from "@/types/ip"
import { toast } from "sonner"
import CreateTokenForm, { ICreateTokenFormInputs } from "../CreateTokenForm"
import RightSideView from "../RightSideView"
import { ArrowRight } from "lucide-react"
import { FormStep } from "../CreateIpPageClient"

const Form = ({ ip }: { ip: Ip }) => {
  const router = useRouter()
  const isLoggedIn = useIsLoggedIn()
  const { setShowAuthFlow } = useDynamicContext()
  const { paymentCurrency: parentPaymentCurrency } = usePaymentCurrency()
  const [paymentCurrency, setPaymentCurrency] = useState<PaymentCurrency>(parentPaymentCurrency)

  useEffect(() => {
    setPaymentCurrency(parentPaymentCurrency)
  }, [parentPaymentCurrency])

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
    },
  })

  // Callback when token is created successfully
  const onSuccessToken = useCallback(
    (tokenAddress: Address) => {
      router.push(`/token/${tokenAddress}`)
    },
    [router]
  )

  const { isPending: isPendingTokenCreation, createTokenContractCall, creationFee } = useCreateToken(onSuccessToken, true)

  // Handle Token form submission
  const handleTokenSubmit = useCallback(() => {
    if (!isLoggedIn) {
      setShowAuthFlow(true)
      return
    }
    formTokenMethods.handleSubmit(
      (data: ICreateTokenFormInputs) => {
        const tokenData: Record<string, string | number | boolean> = {
          name: data.name,
          symbol: data.symbol,
          image: data.image,
          description: data.description,
          socials: JSON.stringify(data.socials),
          buy_amount: data.buy_amount.toString(),
          antiSnipe: data.antiSnipe,
        }

        createTokenContractCall(tokenData, ip)
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
  }, [formTokenMethods, ip, createTokenContractCall, isLoggedIn, setShowAuthFlow])

  return (
    <div className="flex h-full flex-col">
      <div className="flex w-full flex-1 flex-nowrap">
        <div className="w-1/2 bg-black pb-10">
          <CreateTokenForm formMethods={formTokenMethods} ip={ip} creationFee={creationFee} paymentCurrency={paymentCurrency} onPaymentCurrencyChange={setPaymentCurrency} />
        </div>
        <div className="fixed top-[102px] right-0 bottom-24 flex !w-[calc(50%-28.5px)] items-center justify-center pr-6">
          <RightSideView formTokenMethods={formTokenMethods} formStep={FormStep.CREATE_TOKEN} ipData={ip} />
        </div>
      </div>
      {/** Bottom nav */}
      <div className="bg-panel fixed right-0 bottom-10 left-[57px] h-14 border-t">
        <div className="flex h-full w-full items-center justify-end gap-2 p-3">
          <Button
            variant="primary"
            onClick={handleTokenSubmit}
            disabled={isPendingTokenCreation}
            className="!h-fit !rounded-[8px] bg-purple-200 p-3 text-sm text-purple-700"
          >
            {isPendingTokenCreation ? "Launching Token..." : !isLoggedIn ? "Log in to launch" : "Launch Token"}{" "}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Form
