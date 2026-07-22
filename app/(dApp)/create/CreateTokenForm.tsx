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
import Links, { SocialLink } from "./_components/SocialLinks"
import ImageUploader from "./_components/ImageUploader"
import { useRouter } from "next/navigation"
import { Ip as IpIcon, Solana, Usdc, UserFace, Wallet } from "@/components/icons"
import AssetSelectorDropdown from "@/components/ui/asset-selector-dropdown"
import type { PaymentCurrency } from "@/config/relay-chains"
import { useBalance } from "wagmi"
import { useAccount } from "@/hooks/use-account"
import { bigNumberToFloat } from "@/lib/bignumber"
import { formatNumber, formatNumberWithSuffix } from "@/lib/number"
import IpNameInput from "./_components/IpNameInput"
import OwnershipType from "./_components/ownership-type"
import CategorySelector from "./_components/CategorySelector"
import IpItem from "./_components/IpItem"
import { isValidOwnerLink } from "@/lib/username-extractors"
import OwnerLinkInput from "./_components/OwnerLinkInput"

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

  const CURRENCY_OPTIONS: Array<{ value: PaymentCurrency; triggerLabel: string; icon: React.ReactNode }> = [
    { value: "IP", triggerLabel: "IP", icon: <IpIcon size={14} /> },
    { value: "SOL", triggerLabel: "SOL", icon: <Solana size={14} /> },
    { value: "USDC", triggerLabel: "USDC", icon: <Usdc size={14} /> },
  ]

  const currencySelectorOptions = useMemo(
    () =>
      CURRENCY_OPTIONS.map((opt) => ({
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

  const definedValues = isMobile ? [0.0025, 0.005, 0.01] : [0.0025, 0.005, 0.01, 0.02, 0.03]
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

  // The IP amount used for token calculations — direct input for IP, relay estimate for SOL/USDC
  const effectiveIpAmount = useMemo(() => {
    if (!isNonIp) return watchedBuyAmount ?? 0
    return creationRelay?.estimate?.estimatedIpHuman ?? 0
  }, [isNonIp, watchedBuyAmount, creationRelay?.estimate])

  // Calculate dynamic position for currency label based on input length
  const currencyLabelPosition = useMemo(() => {
    const inputValue = watchedBuyAmount?.toString() || ""
    return calculateIPLabelPosition(inputValue, 11)
  }, [watchedBuyAmount])

  // Calculate expected tokens from the effective IP amount
  const expectedTokens = useMemo(() => {
    if (!effectiveIpAmount || effectiveIpAmount <= 0) return 0
    try {
      return calculateTokensFromIP(effectiveIpAmount)
    } catch {
      return 0
    }
  }, [effectiveIpAmount])

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

  const formattedCreationFee = useMemo(() => {
    if (!creationFee) return "0"
    return bigNumberToFloat(creationFee, 18).toString()
  }, [creationFee])

  // Validation for IP amount
  const validationError = useMemo(() => {
    if (!effectiveIpAmount || effectiveIpAmount <= 0) return null
    const validation = validateIPAmount(effectiveIpAmount)
    return validation.isValid ? null : validation.error
  }, [effectiveIpAmount])

  // Handle percentage button click — converts IP-required to user's currency when needed
  const handlePercentageClick = useCallback(
    (percentage: number) => {
      const calculation = percentageCalculations.find((calc) => calc.percentage === percentage)
      if (calculation && !calculation.error && calculation.ipRequired > 0) {
        setSelectedPercentage(percentage)
        if (isNonIp && creationRelay?.inputPerIp) {
          const converted = calculation.ipRequired * creationRelay.inputPerIp
          const decimals = paymentCurrency === "SOL" ? 6 : 2
          const rounded = Math.round(converted * 10 ** decimals) / 10 ** decimals
          setValue("buy_amount", rounded)
        } else {
          setValue("buy_amount", Math.round(calculation.ipRequired * 1000) / 1000)
        }
        clearErrors("buy_amount")
      }
    },
    [percentageCalculations, setValue, clearErrors, isNonIp, creationRelay?.inputPerIp, paymentCurrency]
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
      className="flex w-full items-center justify-center px-4 py-4 sm:px-6"
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
          className="bg-panel mb-4 flex flex-col gap-5 rounded-[16px] border border-[#242424] px-4 py-5 sm:gap-4 sm:p-6"
        >
          <div>
            <div className="text-2xl font-bold text-white sm:text-base sm:font-medium">Create New Coin</div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
              <Controller
                name="name"
                rules={{ required: "Name is required" }}
                control={control}
                render={({ field: { onChange, ref, value } }) => (
                  <input
                    ref={ref}
                    value={value}
                    className={cn(
                      "h-[48px] min-w-0 flex-2 rounded-[12px] border bg-neutral-800 px-4 py-2 text-base outline-none placeholder:text-neutral-300 sm:h-[41px]",
                      getErrorClassName(errors.name)
                    )}
                    type="text"
                    placeholder="Name"
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
                      "h-[48px] min-w-0 flex-1 rounded-[12px] border bg-neutral-800 px-4 py-2 text-base outline-none placeholder:text-neutral-300 sm:h-[41px]",
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
                // required: "Description is required",
                maxLength: { value: 255, message: "Description must be less than 255 characters" },
              }}
              control={control}
              render={({ field: { onChange, ref, value } }) => (
                <div className="relative">
                  <input
                    ref={ref}
                    value={value}
                    className={cn(
                      "h-[48px] w-full rounded-[12px] border bg-neutral-800 px-4 py-3 pr-18 text-base placeholder:text-neutral-300 sm:h-[41px]",
                      getErrorClassName(errors.description)
                    )}
                    type="text"
                    placeholder="Description"
                    onChange={onChange}
                  />
                  <div className="absolute top-1/2 right-4 -translate-y-1/2 text-xs text-neutral-300">
                    {value?.length || 0}/255
                  </div>
                </div>
              )}
            />
            <div className="flex flex-col gap-3 sm:flex-row">
              <Controller
                name="image"
                control={control}
                rules={{ required: "Image is required" }}
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
                  rules={{ required: "Topic is required" }}
                  control={control}
                  render={({ field: { value, onChange, ref }, fieldState: { error } }) => (
                    <IpNameInput
                      ref={ref}
                      value={value}
                      className={cn(
                        "h-[48px] border bg-neutral-800 pl-9 pr-4 py-4 text-base outline-none placeholder:text-neutral-300 sm:h-[41px]",
                        isCreatingNewTopic ? "rounded-[8px]" : "rounded-[12px]",
                        error ? "border-red-400!" : ""
                      )}
                      type="text"
                      placeholder="Select an IP"
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
                            <OwnerLinkInput value={value ?? ""} onChange={onChange} inputRef={ref} error={error} />
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
          className="bg-panel mb-4 flex flex-col gap-5 rounded-[16px] border border-[#242424] px-4 py-5 sm:gap-5 sm:p-6"
        >
          <div className="flex flex-col gap-2">
            <div className="text-2xl font-bold text-white sm:text-base sm:font-medium">Purchase Options</div>
            {creationFee && creationFee > BigInt(0) && (
              <motion.div
                key="creation-fee"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="text-sm text-neutral-400 sm:flex sm:items-center sm:gap-1.5 sm:text-[#797979]"
              >
                <span className="hidden sm:inline">ⓘ</span>
                <span>
                  An additional{" "}
                  {isNonIp && creationRelay?.feeInCurrency
                    ? `${formatNumber(creationRelay.feeInCurrency, paymentCurrency === "SOL" ? 4 : 2)} $${currencyLabel}`
                    : `${formattedCreationFee} $IP`}{" "}
                  will be charged for creation
                </span>
              </motion.div>
            )}
          </div>

          <div className="flex flex-col gap-4 sm:gap-3">
            <div className="flex flex-col gap-3 sm:gap-2">
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
                        step={isNonIp && paymentCurrency === "SOL" ? "0.000001" : "0.001"}
                        value={value || ""}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value)
                          if (isNonIp && paymentCurrency === "SOL") {
                            onChange(isNaN(val) ? 0 : val)
                          } else {
                            onChange(isNaN(val) ? 0 : Math.round(val * 1000) / 1000)
                          }
                          setSelectedPercentage(null)
                        }}
                        className={cn(
                          "h-[48px] w-full rounded-[8px] border bg-neutral-800 px-4 pr-4 text-base outline-none placeholder:text-neutral-300 sm:h-[41px] sm:pr-48",
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
                      <div className="pointer-events-none absolute top-1/2 right-4 hidden -translate-y-1/2 text-base text-neutral-500 sm:block">
                        {expectedTokens > 0 ? (
                          <>
                            {formatTokens(expectedTokens)} {watchedSymbol ? `$${watchedSymbol}` : "$TICKER"} (
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
            </div>

            <div className="flex items-center gap-2">
              {definedValues.map((definedValue) => {
                const calculation = percentageCalculations.find((calc) => calc.percentage === definedValue)
                const isSelected = selectedPercentage === definedValue
                const isDisabled = !!calculation?.error || !calculation?.ipRequired || (isNonIp && !creationRelay?.inputPerIp)

                return (
                  <button
                    key={`buy-amount-${definedValue}`}
                    type="button"
                    onClick={() => !isDisabled && handlePercentageClick(definedValue)}
                    disabled={isDisabled}
                    className={cn(
                      "flex h-[40px] flex-1 cursor-pointer items-center justify-center rounded-full border px-3 text-sm font-semibold transition-all sm:h-[32px] sm:flex-none sm:text-xs",
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
                    {parseFloat((definedValue * 100).toFixed(2))}%
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
          className="bg-panel mb-4 hidden rounded-[16px] border border-[#242424] p-4 sm:block"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-[66px] items-center justify-center rounded-[16px] border bg-neutral-700 p-4 text-white">
              <UserFace size={33} />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <div className="font-medium text-white">Enable Anti-Sniping</div>
              <div className="text-sm !leading-[15px] text-neutral-400">
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
