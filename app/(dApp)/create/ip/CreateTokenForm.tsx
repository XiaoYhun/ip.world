"use client"

import { useIsLoggedIn } from "@dynamic-labs/sdk-react-core"
import { motion } from "framer-motion"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Control, Controller, UseFormReturn } from "react-hook-form"
import { Address } from "viem"

import Switch from "@/components/ui/switch"
import { useIsMobileView } from "@/context/mobile-ui-context"
import useCreateToken from "@/hooks/use-create-token"
import { useNavAssetBalances } from "@/hooks/use-nav-asset-balances"
import type { UseCreationRelayReturn } from "@/hooks/use-creation-relay"
import { cn, getErrorClassName } from "@/lib/utils"
import {
  calculateIPLabelPosition,
  calculatePercentageAllocations,
  calculateTokensFromIP,
  formatTokens,
  TOTAL_SUPPLY,
  validateIPAmount,
} from "@/lib/utils/token-calculations"
import { Ip } from "@/types/ip"
import Links, { SocialLink } from "../_components/SocialLinks"
import ImageUploader from "../_components/ImageUploader"
import { useRouter } from "next/navigation"
import { Ip as IpIcon, Solana, Usdc, UserFace, Wallet } from "@/components/icons"
import AssetSelectorDropdown from "@/components/ui/asset-selector-dropdown"
import type { PaymentCurrency } from "@/config/relay-chains"
import { useBalance } from "wagmi"
import { useAccount } from "@/hooks/use-account"
import { bigNumberToFloat } from "@/lib/bignumber"
import { formatNumber, formatNumberWithSuffix } from "@/lib/number"
import IpNameInput from "../_components/IpNameInput"
import OwnershipType from "../_components/ownership-type"
import CategorySelector from "../_components/CategorySelector"
import IpItem from "../_components/IpItem"
import { isValidOwnerLink } from "@/lib/username-extractors"

const CURRENCY_LABELS: Record<string, string> = { IP: "IP", SOL: "SOL", USDC: "USDC" }

export interface ICreateTokenFormInputs {
  name: string
  symbol: string
  image: string
  description: string
  socials: SocialLink[]
  buy_amount: number
  antiSnipe: boolean
  ip: {
    name: string
    type: "creator" | "community"
    category: string
    owner_link: string
  }
}

interface CreateTokenFormProps {
  formMethods: UseFormReturn<ICreateTokenFormInputs>
  ip?: Ip
  creationFee?: bigint
  creationRelay?: UseCreationRelayReturn
  paymentCurrency: PaymentCurrency
  onPaymentCurrencyChange: (currency: PaymentCurrency) => void
  onSaveTemporaryIp?: (ipData: { name: string; description: string; image: string }) => void
  onSelectExistingIp?: (ip: Ip) => void
  onClearSelectedIp?: () => void
}

const CreateTokenForm = ({ formMethods, ip, creationFee, creationRelay, paymentCurrency, onPaymentCurrencyChange, onSaveTemporaryIp, onSelectExistingIp, onClearSelectedIp }: CreateTokenFormProps) => {
  const router = useRouter()
  const isLoggedIn = useIsLoggedIn()
  const isMobile = useIsMobileView()
  const { address, isConnected } = useAccount()
  const balances = useNavAssetBalances()
  const { data: ipBalance, refetch: refetchIpBalance } = useBalance({
    address,
  })

  const isNonIp = paymentCurrency !== "IP"
  const currencyLabel = CURRENCY_LABELS[paymentCurrency] ?? "IP"

  const ipBalanceNumber = useMemo(() => {
    return ipBalance?.value ? bigNumberToFloat(ipBalance.value as bigint, ipBalance.decimals).toFixed(2) : 0
  }, [ipBalance])

  const CURRENCY_OPTIONS_IP: Array<{ value: PaymentCurrency; triggerLabel: string; icon: React.ReactNode }> = [
    { value: "IP", triggerLabel: "IP", icon: <IpIcon size={14} /> },
    { value: "SOL", triggerLabel: "SOL", icon: <Solana size={14} /> },
    { value: "USDC", triggerLabel: "USDC", icon: <Usdc size={14} /> },
  ]

  const currencySelectorOptions = useMemo(
    () =>
      CURRENCY_OPTIONS_IP.map((opt) => ({
        value: opt.value,
        triggerLabel: opt.triggerLabel,
        menuLabel:
          opt.value === "IP"
            ? `${formatNumberWithSuffix(Number(ipBalanceNumber), 2)} IP`
            : opt.value === "SOL"
              ? `${formatNumberWithSuffix(Number(balances.SOL.formatted), 2)} SOL`
              : `${formatNumberWithSuffix(Number(balances.USDC.formatted), 2)} USDC`,
        icon: opt.icon,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ipBalanceNumber, balances.SOL.formatted, balances.USDC.formatted]
  )

  const selectorBalance = useMemo(
    (): { amount: string; symbol: string } => {
      switch (paymentCurrency) {
        case "USDC":
          return { amount: formatNumberWithSuffix(Number(balances.USDC.formatted), 2), symbol: "USDC" }
        case "SOL":
          return { amount: formatNumberWithSuffix(Number(balances.SOL.formatted), 2), symbol: "SOL" }
        default:
          return { amount: formatNumberWithSuffix(Number(ipBalanceNumber), 2), symbol: "IP" }
      }
    },
    [paymentCurrency, ipBalanceNumber, balances.SOL.formatted, balances.USDC.formatted]
  )

  const definedValues = [0.0025, 0.005, 0.01, 0.02, 0.03]
  const [selectedPercentage, setSelectedPercentage] = useState<number | null>(null)
  const [isCreatingNewTopic, setIsCreatingNewTopic] = useState<boolean>(false)

  const {
    handleSubmit,
    control,
    register,
    watch,
    setValue,
    formState: { errors },
    clearErrors,
  } = formMethods

  const prevCurrencyRef = useRef(paymentCurrency)
  useEffect(() => {
    if (prevCurrencyRef.current === paymentCurrency) return
    prevCurrencyRef.current = paymentCurrency
    setValue("buy_amount", 0)
    setSelectedPercentage(null)
  }, [paymentCurrency, setValue])

  const watchedBuyAmount = watch("buy_amount")
  const watchedSymbol = watch("symbol")
  const watchedIpType = watch("ip.type")

  const effectiveIpAmount = useMemo(() => {
    if (!isNonIp) return watchedBuyAmount ?? 0
    return creationRelay?.estimate?.estimatedIpHuman ?? 0
  }, [isNonIp, watchedBuyAmount, creationRelay?.estimate])

  const currencyLabelPosition = useMemo(() => {
    const inputValue = watchedBuyAmount?.toString() || ""
    return calculateIPLabelPosition(inputValue, 11)
  }, [watchedBuyAmount])

  const expectedTokens = useMemo(() => {
    if (!effectiveIpAmount || effectiveIpAmount <= 0) return 0
    try {
      return calculateTokensFromIP(effectiveIpAmount)
    } catch {
      return 0
    }
  }, [effectiveIpAmount])

  const actualPercentage = useMemo(() => {
    if (!expectedTokens || expectedTokens <= 0) return 0
    return (expectedTokens / TOTAL_SUPPLY) * 100
  }, [expectedTokens])

  const percentageCalculations = useMemo(() => {
    return calculatePercentageAllocations(definedValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const formattedCreationFee = useMemo(() => {
    if (!creationFee) return "0"
    return bigNumberToFloat(creationFee, 18).toString()
  }, [creationFee])

  const validationError = useMemo(() => {
    if (!effectiveIpAmount || effectiveIpAmount <= 0) return null
    const validation = validateIPAmount(effectiveIpAmount)
    return validation.isValid ? null : validation.error
  }, [effectiveIpAmount])

  const handlePercentageClick = useCallback(
    (percentage: number) => {
      const calculation = percentageCalculations.find((calc) => calc.percentage === percentage)
      if (calculation && !calculation.error && calculation.ipRequired > 0) {
        setSelectedPercentage(percentage)
        if (isNonIp && creationRelay?.estimate?.inputPerIp) {
          const converted = calculation.ipRequired * creationRelay.estimate.inputPerIp
          const decimals = paymentCurrency === "SOL" ? 6 : 2
          const rounded = Math.round(converted * 10 ** decimals) / 10 ** decimals
          setValue("buy_amount", rounded)
        } else {
          setValue("buy_amount", calculation.ipRequired)
        }
        clearErrors("buy_amount")
      }
    },
    [percentageCalculations, setValue, clearErrors, isNonIp, creationRelay?.estimate, paymentCurrency]
  )

  const onSuccessToken = useCallback(
    (tokenAddress: Address) => {
      router.push(`/token/${tokenAddress}`)
    },
    [router]
  )

  const { isPending: isPendingTokenCreation, createTokenContractCall } = useCreateToken(onSuccessToken, true)

  const onSubmit = (data: ICreateTokenFormInputs) => {
    if (validationError || !ip) {
      return
    }

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
  }

  return (
    <motion.div
      // initial={{ opacity: 0, x: 100 }}
      // animate={{ opacity: 1, x: 0 }}
      // exit={{ opacity: 0, x: 100, transition: { duration: 0.2, ease: "easeInOut" } }}
      // transition={{ duration: 0.3 }}
      className="flex h-full w-full items-center justify-center px-6 py-4"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="flex w-full max-w-[575px] flex-col"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-panel mb-4 flex flex-col gap-4 rounded-[16px] border border-neutral-600 p-6"
        >
          <div className="flex flex-col gap-2">
            <div className="text-base font-medium text-white">Create New Coin</div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Controller
                name="name"
                rules={{ required: "Token Name is required" }}
                control={control}
                render={({ field: { onChange, ref, value } }) => (
                  <input
                    ref={ref}
                    value={value}
                    className={cn(
                      "h-[41px] min-w-0 flex-2 rounded-[12px] border bg-neutral-800 px-4 py-2 outline-none placeholder:text-neutral-300",
                      getErrorClassName(errors.name)
                    )}
                    type="text"
                    placeholder="Token Name"
                    onChange={onChange}
                  />
                )}
              />
              <Controller
                name="symbol"
                rules={{ required: "Token Ticker is required" }}
                control={control}
                render={({ field: { onChange, ref, value } }) => (
                  <input
                    ref={ref}
                    value={value}
                    className={cn(
                      "h-[41px] min-w-0 flex-1 rounded-[12px] border bg-neutral-800 px-4 py-2 outline-none placeholder:text-neutral-300",
                      getErrorClassName(errors.symbol)
                    )}
                    type="text"
                    placeholder="$TICKER"
                    onChange={onChange}
                  />
                )}
              />
            </div>
            <Controller
              name="description"
              rules={{
                // required: "Token Description is required",
                maxLength: { value: 255, message: "Token Description must be less than 255 characters" },
              }}
              control={control}
              render={({ field: { onChange, ref, value } }) => (
                <div className="relative">
                  <input
                    ref={ref}
                    value={value}
                    className={cn(
                      "h-[41px] w-full rounded-[12px] border bg-neutral-800 px-4 py-3 pr-18 placeholder:text-neutral-300",
                      getErrorClassName(errors.description)
                    )}
                    type="text"
                    placeholder="Token Description"
                    onChange={onChange}
                  />
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
                rules={{ required: "Token Image is required" }}
                render={({ field: { onChange, ref }, fieldState: { error } }) => (
                  <ImageUploader
                    ref={ref}
                    handleFileChange={(url) => onChange(url)}
                    className={cn(getErrorClassName(error))}
                  />
                )}
              />
              <Links name="socials" control={control as unknown as Control} register={register} />
            </div>

            {!!ip ? (
              <IpItem
                ip={ip}
                className="pointer-events-none rounded-[12px] border bg-neutral-800 p-2"
                onClose={onClearSelectedIp}
              />
            ) : (
              <div className={cn("flex flex-col gap-2.5 rounded-[16px]", isCreatingNewTopic ? "border p-2" : "")}>
                <Controller
                  name="ip.name"
                  rules={{ required: "Token Topic is required" }}
                  control={control}
                  render={({ field: { value, onChange, ref }, fieldState: { error } }) => (
                    <IpNameInput
                      ref={ref}
                      value={value}
                      className={cn(
                        "h-[41px] border bg-neutral-800 p-4 outline-none placeholder:text-neutral-300",
                        isCreatingNewTopic ? "rounded-[8px]" : "rounded-[12px]",
                        error ? "border-red-400!" : ""
                      )}
                      type="text"
                      placeholder="Token Topic*"
                      onChange={(name) => {
                        onChange(name)
                        setIsCreatingNewTopic(false)
                      }}
                      onSelectNewTopic={(ipName) => {
                        // Save temporary IP data with token information
                        const tokenData = formMethods.getValues()
                        setIsCreatingNewTopic(true)
                        onSaveTemporaryIp?.({
                          name: ipName,
                          description: tokenData.description || "",
                          image: tokenData.image || "",
                        })
                      }}
                      onSelectIp={(selectedIp) => {
                        // Handle selecting an existing IP from suggestions
                        setIsCreatingNewTopic(false)
                        onSelectExistingIp?.(selectedIp)
                      }}
                    />
                  )}
                />
                {isCreatingNewTopic && (
                  <div className="p-2">
                    <div className="mb-4">
                      <OwnershipType control={control as Control<ICreateTokenFormInputs>} />
                    </div>
                    <Controller
                      name="ip.category"
                      control={control}
                      render={({ field: { value, onChange } }) => <CategorySelector value={value} onChange={onChange} />}
                    />
                    {watchedIpType === "creator" && (
                      <div className="mt-2">
                        <Controller
                          name="ip.owner_link"
                          control={control}
                          rules={{ validate: isValidOwnerLink }}
                          render={({ field: { onChange, ref, value }, fieldState: { error } }) => (
                            <div>
                              <input
                                ref={ref}
                                value={value}
                                className={cn(
                                  "h-[41px] w-full min-w-0 flex-2 rounded-[12px] border bg-neutral-800 px-4 py-2 outline-none placeholder:text-neutral-300",
                                  getErrorClassName(error)
                                )}
                                type="text"
                                placeholder="IP Owner Social Link"
                                onChange={onChange}
                              />
                              {error?.message && (
                                <p className="mt-1 text-xs text-red-500">{error.message}</p>
                              )}
                            </div>
                          )}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-panel mb-4 flex flex-col gap-5 rounded-[16px] border border-neutral-600 p-6"
        >
          <div className="flex flex-col gap-1">
            <div className="text-base font-medium text-white">Purchase Options</div>
            {creationFee && creationFee > BigInt(0) && (
              <div className="flex items-center gap-1.5 text-sm font-light text-neutral-500">
                <span>ⓘ</span>
                <span>An additional fee of {formattedCreationFee} $IP will be charged for creation</span>
              </div>
            )}
            {isNonIp && watchedBuyAmount > 0 && creationRelay?.estimate && (
              <div className="flex items-center gap-1.5 text-sm font-light text-neutral-500">
                <span>ⓘ</span>
                <span>
                  You will swap {watchedBuyAmount} ${currencyLabel} for ~{formatNumber(creationRelay.estimate.estimatedIpHuman, 2)} $IP to cover the purchase
                  {creationFee && creationFee > BigInt(0) ? " and fee" : ""}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <AssetSelectorDropdown
              value={paymentCurrency}
              onChange={onPaymentCurrencyChange}
              options={currencySelectorOptions}
              balance={selectorBalance}
              balanceIcon={<span className="text-neutral-300"><Wallet size={14} /></span>}
              menuWidthClassName="min-w-[180px]"
              textSizeClassName="text-xs"
              triggerClassName="h-[28px] gap-1.5 px-2 bg-[#121212] border-[#2D2D2D]"
              menuItemClassName="px-2 py-2 gap-2"
              inline
            />
            <div className="relative">
              <Controller
                name="buy_amount"
                control={control}
                rules={{ required: "Buy amount is required" }}
                render={({ field: { onChange, value } }) => (
                  <>
                    <input
                      type="number"
                      step="0.000001"
                      value={value || ""}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value)
                        onChange(isNaN(val) ? 0 : val)
                        setSelectedPercentage(null)
                      }}
                      className={cn(
                        "h-[41px] w-full rounded-[8px] border bg-neutral-800 px-4 pr-48 text-base outline-none placeholder:text-neutral-300",
                        (errors.buy_amount || validationError) && "border-red-500"
                      )}
                      placeholder={`Buy Amount ($${currencyLabel})`}
                    />
                    {!!value && (
                      <span
                        className="pointer-events-none absolute top-1/2 -translate-y-1/2 pl-2 text-base font-medium text-white"
                        style={{ left: `${currencyLabelPosition}px` }}
                      >
                        {currencyLabel}
                      </span>
                    )}
                    <div className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-base text-neutral-500">
                      {expectedTokens > 0 ? (
                        <>
                          {formatTokens(expectedTokens)} {watchedSymbol ? `$${watchedSymbol}` : "$KITTY"} (
                          {actualPercentage.toFixed(1)}%)
                        </>
                      ) : (
                        <span className="text-neutral-500">
                          {isNonIp && creationRelay?.isEstimating ? "estimating..." : "0 tokens (0%)"}
                        </span>
                      )}
                    </div>
                  </>
                )}
              />
            </div>
            {(errors?.buy_amount || validationError) && (
              <div className="text-sm text-red-500">{errors?.buy_amount?.message || validationError}</div>
            )}

            <div className="flex items-center gap-2">
              {definedValues.map((definedValue) => {
                const calculation = percentageCalculations.find((calc) => calc.percentage === definedValue)
                const isSelected = selectedPercentage === definedValue
                const isDisabled = !!calculation?.error || !calculation?.ipRequired || (isNonIp && !creationRelay?.estimate?.inputPerIp)

                return (
                  <button
                    key={`buy-amount-${definedValue}`}
                    type="button"
                    onClick={() => !isDisabled && handlePercentageClick(definedValue)}
                    disabled={isDisabled}
                    className={cn(
                      "flex h-[32px] w-fit cursor-pointer items-center justify-center rounded-full border px-3 text-xs font-semibold transition-all",
                      isDisabled
                        ? "cursor-not-allowed border-neutral-600 text-neutral-500"
                        : "border-neutral-500 text-white hover:border-white",
                      isSelected && !isDisabled && "border-white bg-neutral-700 text-white"
                    )}
                    title={
                      calculation && !calculation.error
                        ? `${calculation.ipRequired.toFixed(6)} IP for ${calculation.tokenAmount.toLocaleString()} tokens`
                        : calculation?.error || undefined
                    }
                  >
                    {(definedValue * 100).toFixed(2)}%
                  </button>
                )
              })}
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-panel mb-4 rounded-[16px] border border-neutral-600 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-[66px] items-center justify-center rounded-[16px] border bg-neutral-700 p-4 text-white">
              <UserFace size={33} />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <div className="font-medium text-white">Enable Anti-Sniping</div>
              <div className="text-sm !leading-[17.5px] text-neutral-200">
                Only allow wallets to hold a maximum of 2% of supply 5 minutes post creation
              </div>
            </div>
            <Controller
              name="antiSnipe"
              control={control}
              render={({ field: { value, onChange } }) => <Switch checked={value} onCheckedChange={onChange} />}
            />
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default CreateTokenForm
