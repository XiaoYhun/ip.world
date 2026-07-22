"use client"

import { useCallback, useMemo, useState } from "react"
import { X, Copy, Check } from "lucide-react"
import { BeautifulQRCode } from "@beautiful-qr-code/react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Ip, Solana, Usdc } from "@/components/icons"
import AssetSelectorDropdown from "@/components/ui/asset-selector-dropdown"
import { cn } from "@/lib/utils"
import { useConvert } from "@/hooks/use-convert"
import { useEmbeddedWallets } from "@/hooks/use-embedded-wallets"
import { useIpPrice } from "@/context/token-metrics-context"
import useGetSolPrice from "@/hooks/use-get-sol-price"
import { formatNumber } from "@/lib/number"
import HallidayPaymentDialog from "@/components/dialog/halliday-payment-dialog"
import { SelectDropdown } from "@/components/ui/select-dropdown"
import type { PaymentCurrency } from "@/config/relay-chains"
import { usePaymentCurrency } from "@/context/payment-currency-context"
import { useBalanceInflowWatch } from "@/hooks/use-balance-inflow-watch"
import { toast } from "sonner"

const TABS = ["Convert", "Deposit", "Buy"] as const
type Tab = (typeof TABS)[number]

// Surface the "Price impact" hint once a conversion would lose more than this %
// of the user's input value. The hard block (red) lives in `useConvert`.
const PRICE_IMPACT_WARN_PCT_UI = 1

// ── Token definitions ────────────────────────────────────────────────────────

type TokenId = "IP" | "SOL" | "USDC"

const TOKEN_CONFIG: Record<TokenId, { label: string; icon: (size?: number) => React.ReactNode }> = {
  IP: { label: "IP", icon: (size = 16) => <Ip size={size} /> },
  SOL: { label: "Solana", icon: (size = 16) => <Solana size={size} /> },
  USDC: { label: "USDC", icon: (size = 16) => <Usdc size={size} /> },
}

const ALL_TOKENS: TokenId[] = ["IP", "SOL", "USDC"]

// ── Convert tab ──────────────────────────────────────────────────────────────

function ConvertTab({ initialFromToken = "SOL" }: { initialFromToken?: TokenId }) {
  const [fromToken, setFromToken] = useState<TokenId>(initialFromToken)
  const [toToken, setToToken] = useState<TokenId>(initialFromToken === "IP" ? "SOL" : "IP")
  const [amountInput, setAmountInput] = useState("")
  const ipPriceUsd = useIpPrice()
  const { data: solPriceUsd, isLoading: solPriceLoading } = useGetSolPrice()

  const toTokenSpotLabel = useMemo(() => {
    if (toToken === "USDC") return "$1.00"
    if (toToken === "IP") {
      if (!ipPriceUsd || ipPriceUsd <= 0) return "—"
      return `$${formatNumber(ipPriceUsd, ipPriceUsd < 0.01 ? 6 : 4, true)}`
    }
    if (solPriceLoading) return "…"
    if (!solPriceUsd || solPriceUsd <= 0) return "—"
    return `$${formatNumber(solPriceUsd, 2, true)}`
  }, [ipPriceUsd, solPriceLoading, solPriceUsd, toToken])

  const {
    maxInputValue,
    isQuoting,
    receiveAmount,
    receiveSymbol,
    feeSummary,
    timeEstimate,
    quoteError,
    status,
    statusLabel,
    canExecute,
    disabledReason,
    execute,
    fromBalanceLabel,
    toBalanceLabel,
    priceImpactPct,
    priceImpactUsd,
    priceImpactSevere,
  } = useConvert({
    fromToken,
    toToken,
    amountInput,
    ipPriceUsd,
    solPriceUsd,
  })

  const showPriceImpact = !isQuoting && priceImpactPct >= PRICE_IMPACT_WARN_PCT_UI
  const priceImpactClass = priceImpactSevere ? "text-red" : "text-orange"

  const handleSwap = () => {
    setFromToken(toToken)
    setToToken(fromToken)
  }

  const formatBalance = (raw: string): string => {
    const n = parseFloat(raw)
    if (isNaN(n) || n === 0) return "0.00"
    if (n >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 2 })
    return n.toFixed(n < 0.01 ? 6 : 2)
  }
  const fromOptions = ALL_TOKENS.filter((token) => token !== toToken).map((token) => ({
    value: token,
    triggerLabel: token,
    menuLabel: token,
    icon: TOKEN_CONFIG[token].icon(16),
  }))
  const toOptions = ALL_TOKENS.filter((token) => token !== fromToken).map((token) => ({
    value: token,
    triggerLabel: token,
    menuLabel: token,
    icon: TOKEN_CONFIG[token].icon(16),
  }))

  return (
    <div className="flex flex-col h-full justify-between">
      <div className="flex flex-col">
        {/* From panel */}
        <div className="rounded-[12px] bg-neutral-600 px-4 py-3 border border-neutral-500" style={{ boxShadow: "0 2px 12px 0 rgba(0, 0, 0, 0.20)" }}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-neutral-400">Converting</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-200">{fromToken} Balance: {formatBalance(fromBalanceLabel)}</span>
              <button
                type="button"
                onClick={() => setAmountInput(maxInputValue)}
                className="rounded-full border border-neutral-400 px-2 py-0.5 text-[10px] text-neutral-100 transition-colors hover:bg-white/5"
              >
                Max
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <input
              type="number"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="w-32 bg-transparent font-mono text-lg text-white outline-none placeholder:text-white/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              placeholder="0.00"
            />
            <AssetSelectorDropdown
              value={fromToken}
              onChange={setFromToken}
              options={fromOptions}
              inline
              menuWidthClassName="w-[240px]"
              textSizeClassName="text-sm"
              triggerClassName="bg-neutral-500 border-neutral-400 hover:bg-neutral-400"
            />
          </div>
        </div>

        {/* Swap button */}
        <div className="relative z-10 flex justify-center py-5">
          <button
            onClick={handleSwap}
            className="flex size-[36px] items-center justify-center rounded-full bg-neutral-600 shadow-lg transition-all hover:bg-neutral-500 hover:rotate-180"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="24" viewBox="0 0 20 24" fill="none">
              <path d="M14.4728 19.3663L17.5508 16.2884L19.2623 17.9999L13.2624 24L7.26243 17.9999L8.97394 16.2884L12.052 19.3663V10.7896H14.4728V19.3663ZM11.9999 5.99999L10.2884 7.71157L7.21039 4.63356V13.2104H4.78959V4.63356L1.71158 7.71157L0 5.99999L5.99999 0L11.9999 5.99999Z" fill="currentColor" />
            </svg>
          </button>
        </div>

        {/* To panel */}
        <div className="rounded-[12px] bg-neutral-600 px-4 py-3 border border-neutral-500" style={{ boxShadow: "0 2px 12px 0 rgba(0, 0, 0, 0.20)" }}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-neutral-400">Receiving</span>
            <span className="text-xs text-neutral-200">
              {toToken} Balance: {formatBalance(toBalanceLabel)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            {isQuoting ? (
              <div className="h-6 w-24 animate-pulse rounded bg-white/10" />
            ) : (
              <span className="font-mono text-lg text-white">{receiveAmount || "0.00"}</span>
            )}
            <AssetSelectorDropdown
              value={toToken}
              onChange={setToToken}
              options={toOptions}
              inline
              menuWidthClassName="w-[240px]"
              textSizeClassName="text-sm"
              triggerClassName="bg-neutral-500 border-neutral-400 hover:bg-neutral-400"
            />
          </div>
          {(quoteError || feeSummary || timeEstimate != null) && (
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className={quoteError ? "text-red" : "text-neutral-300"}>
                {quoteError ?? feeSummary ?? ""}
              </span>
              {timeEstimate != null && <span className="text-neutral-300">~{Math.ceil(timeEstimate)}s</span>}
            </div>
          )}
          {showPriceImpact && (
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className={priceImpactClass}>
                Price impact {priceImpactPct.toFixed(2)}% (~${Math.abs(priceImpactUsd).toFixed(2)})
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-1">
        <p className="text-right text-[11px] font-medium tabular-nums text-neutral-400">
          {toToken} price {toTokenSpotLabel}
        </p>
        <button
          type="button"
          onClick={execute}
          disabled={!canExecute || status === "quoting" || status === "signing" || status === "bridging" || status === "swapping"}
          className="h-10 w-full rounded-[12px] bg-purple-200 text-sm font-semibold text-neutral-900 transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {canExecute ? statusLabel : (disabledReason === "Select different assets" ? "Convert" : disabledReason ?? "Convert")}
        </button>
      </div>
    </div>
  )
}

type Network = "Story" | "Solana"

const NETWORK_CONFIG: Record<Network, { icon: React.ReactNode }> = {
  Story: { icon: <Ip size={16} /> },
  Solana: { icon: <Solana size={16} /> },
}

const NETWORK_OPTIONS = (Object.keys(NETWORK_CONFIG) as Network[]).map((net) => ({
  value: net,
  label: net,
  icon: NETWORK_CONFIG[net].icon,
}))

function DepositTabContent() {
  const { evmAddress, solanaAddress } = useEmbeddedWallets()
  const [copied, setCopied] = useState(false)
  const [network, setNetwork] = useState<Network>("Story")

  const walletAddress =
    network === "Story"
      ? (evmAddress ?? "")
      : (solanaAddress ?? "")
  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : "Connect wallet"

  const handleCopy = () => {
    if (!walletAddress) return
    navigator.clipboard.writeText(walletAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-4">
      <SelectDropdown
        value={network}
        onChange={setNetwork}
        options={NETWORK_OPTIONS}
      />

      <div className="flex flex-col items-center gap-4">
        <div className="flex size-[160px] items-center justify-center overflow-hidden rounded-[10px]">
          {walletAddress ? (
            <BeautifulQRCode
              data={walletAddress}
              foregroundColor="#ffffff"
              backgroundColor="#242424"
              radius={2}
              className="size-[160px]"
            />
          ) : (
            <span className="text-center text-xs text-neutral-400">Connect wallet to view QR</span>
          )}
        </div>

        <p className="max-w-[320px] text-center text-sm font-medium leading-5 text-neutral-200">
          Send tokens on the {network} network to your wallet.{" "}
          Deposit {network === "Story" ? "IP" : "SOL"} to fund your cash balance.
        </p>
      </div>

      <div className="flex items-center justify-center">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 rounded-[12px] border border-neutral-500 bg-neutral-400/50 px-4 py-2.5 transition-colors hover:bg-neutral-400"
        >
          <span className="font-mono text-sm font-medium text-neutral-200">{shortAddress}</span>
          {copied
            ? <Check size={14} className="text-neutral-200" />
            : <Copy size={14} className="text-neutral-200" />
          }
        </button>
      </div>
    </div>
  )
}

const CreditCardIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#cc-clip)">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2 2C0.89543 2 0 2.89543 0 4V6H24V4C24 2.89543 23.1046 2 22 2H2ZM24 9H0V20C0 21.1046 0.895431 22 2 22H22C23.1046 22 24 21.1046 24 20V9ZM12 14H3V12H12V14ZM3 19H9V17H3V19ZM21 14H17V12H21V14Z"
        fill="#C093FF"
      />
    </g>
    <defs>
      <clipPath id="cc-clip"><rect width="24" height="24" fill="white" /></clipPath>
    </defs>
  </svg>
)

const BUY_OPTIONS = [
  {
    title: "Debit",
    description: "Buy IP instantly using your debit card.",
  },
  {
    title: "Credit Card",
    description: "Buy IP with Visa, Mastercard and more.",
  },
]

function BuyTab() {
  const [hallidayOpen, setHallidayOpen] = useState(false)
  // selectedMethod kept for future BuyStep integration
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)

  return (
    <>
      <div className="flex flex-col gap-2">
        {BUY_OPTIONS.map((option) => (
          <button
            key={option.title}
            onClick={() => {
              setSelectedMethod(option.title)
              setHallidayOpen(true)
            }}
            className="flex w-full items-center gap-2 rounded-2xl bg-neutral-700 px-4 py-3 text-left transition-all hover:bg-neutral-600"
          >
            <div className="flex flex-1 flex-col gap-2">
              <span className="text-sm font-bold text-white">{option.title}</span>
              <span className="text-xs font-medium text-neutral-100">{option.description}</span>
            </div>
            <div className="flex size-10 shrink-0 items-center justify-center">
              <CreditCardIcon />
            </div>
          </button>
        ))}
      </div>

      <HallidayPaymentDialog
        isOpen={hallidayOpen}
        onOpenChange={setHallidayOpen}
        paymentMethod={selectedMethod ?? undefined}
      />
    </>
  )
}

interface DepositModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultFromToken?: TokenId
}

export default function DepositModal({ open, onOpenChange, defaultFromToken }: DepositModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("Convert")
  const { setPaymentCurrency } = usePaymentCurrency()
  const ipPriceUsd = useIpPrice()
  const { data: solPriceUsd } = useGetSolPrice()

  const onDepositInflow = useCallback(
    (currency: PaymentCurrency) => {
      setPaymentCurrency(currency)
      onOpenChange(false)
      toast.success(`Deposit received. Now using ${currency}.`)
    },
    [onOpenChange, setPaymentCurrency]
  )

  useBalanceInflowWatch({
    enabled: open,
    pollIntervalMs: 2000,
    detectMode: "depositModal",
    onInflow: onDepositInflow,
    ipPriceUsd: ipPriceUsd > 0 ? ipPriceUsd : undefined,
    solPriceUsd: solPriceUsd > 0 ? solPriceUsd : undefined,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hasCloseButton={false}
        className="w-[calc(100vw-32px)] max-w-[400px] gap-0 overflow-visible rounded-[16px] border-neutral-600 bg-transparent p-0 shadow-2xl sm:w-[400px] sm:rounded-[12px]"
      >
        {/* Header */}
        <div className="flex h-[48px] items-center justify-between border-b border-neutral-600 bg-neutral-700 px-4">
          <span className="text-sm font-medium text-white">Exchange</span>
          <button
            onClick={() => onOpenChange(false)}
            className="flex size-6 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X size={12} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-4 bg-neutral-700 p-4">
          {/* Tab switcher */}
          <div className="flex gap-1 rounded-[10px] border border-neutral-500 p-1">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex h-[32px] flex-1 items-center justify-center rounded-[8px] text-sm transition-all",
                  activeTab === tab
                    ? "bg-purple-200 font-semibold text-purple-700"
                    : "font-medium text-neutral-100 hover:bg-white/5"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content — fixed height matches the tallest tab (Convert) */}
          <div className="min-h-[336px]">
            {activeTab === "Convert" && <ConvertTab initialFromToken={defaultFromToken} />}
            {activeTab === "Deposit" && <DepositTabContent />}
            {activeTab === "Buy" && <BuyTab />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
