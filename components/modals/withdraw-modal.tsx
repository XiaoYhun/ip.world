"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { X, Loader2, ArrowDown, Clock } from "lucide-react"
import { isAddress, parseUnits, formatUnits } from "viem"
import { useBalance, useReadContract } from "wagmi"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Ip, Solana, Usdc } from "@/components/icons"
import AssetSelectorDropdown from "@/components/ui/asset-selector-dropdown"
import { SelectDropdown } from "@/components/ui/select-dropdown"
import { cn } from "@/lib/utils"
import { useEmbeddedWallets } from "@/hooks/use-embedded-wallets"
import { useRefreshAllBalances } from "@/hooks/use-refresh-all-balances"
import { useSolanaBalances } from "@/context/solana-balances-context"
import {
  useWithdraw,
  isDirectTransfer as checkIsDirectTransfer,
  getGasReserve,
  type SourceChain,
  type WithdrawAsset,
  type WithdrawStatus,
} from "@/hooks/use-withdraw"
import {
  RELAY_SOLANA_CHAIN_ID,
  RELAY_STORY_CHAIN_ID,
  STORY_USDC_ADDRESS,
} from "@/config/relay-chains"
import {
  WITHDRAW_DESTINATION_CHAINS,
} from "@/config/withdraw-chains"

// ── Config ───────────────────────────────────────────────────────────────────

const SOURCE_CHAINS: SourceChain[] = ["Story", "Solana"]

const SOURCE_CHAIN_ICON: Record<SourceChain, React.ReactNode> = {
  Story: <Ip size={16} />,
  Solana: <Solana size={16} />,
}

const ASSETS_PER_SOURCE: Record<SourceChain, WithdrawAsset[]> = {
  Story: ["IP", "USDC"],
  Solana: ["SOL", "USDC"],
}

const ASSET_CONFIG: Record<
  WithdrawAsset,
  { label: string; icon: React.ReactNode; decimals: number }
> = {
  IP: { label: "IP", icon: <Ip size={16} />, decimals: 18 },
  SOL: { label: "Solana", icon: <Solana size={16} />, decimals: 9 },
  USDC: { label: "USDC", icon: <Usdc size={16} />, decimals: 6 },
}

function getOutputAssetsForChain(chainId: number): WithdrawAsset[] {
  if (chainId === RELAY_STORY_CHAIN_ID) return ["IP", "USDC"]
  if (chainId === RELAY_SOLANA_CHAIN_ID) return ["SOL", "USDC"]
  return ["USDC"]
}

const ERC20_BALANCE_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const

function getDefaultDestChainId(sourceChain: SourceChain): number {
  return sourceChain === "Story" ? RELAY_STORY_CHAIN_ID : RELAY_SOLANA_CHAIN_ID
}

function isValidSolanaAddress(addr: string): boolean {
  if (addr.length < 32 || addr.length > 44) return false
  return /^[1-9A-HJ-NP-Za-km-z]+$/.test(addr)
}

function isValidAddress(addr: string, isEvm: boolean): boolean {
  if (!addr) return false
  return isEvm ? isAddress(addr) : isValidSolanaAddress(addr)
}

const STATUS_LABELS: Record<WithdrawStatus, string> = {
  idle: "Withdraw",
  quoting: "Getting quote...",
  signing: "Sending...",
  sending: "Sending...",
  bridging: "Bridging...",
  complete: "Done",
  error: "Try Again",
}

function formatTimeEstimate(seconds: number): string {
  if (seconds < 60) return `~${seconds}s`
  const mins = Math.round(seconds / 60)
  return `~${mins}m`
}

function formatReceiveDisplay(amount: string): string {
  if (!amount) return "0.00"
  const num = parseFloat(amount)
  if (isNaN(num) || num <= 0) return "0.00"
  if (num < 0.000001) return "<0.000001"
  return num.toLocaleString(undefined, { maximumFractionDigits: 6 })
}

// ── Balance hook ─────────────────────────────────────────────────────────────

function useAssetBalance(
  sourceChain: SourceChain,
  asset: WithdrawAsset
): { balance: bigint; formatted: string; isLoading: boolean } {
  const { evmAddress } = useEmbeddedWallets()
  const { solLamports, solanaUsdcRaw, isLoading: solCtxLoading } = useSolanaBalances()

  const { data: ipBalance, isLoading: ipLoading } = useBalance({
    address: evmAddress,
    query: {
      enabled: sourceChain === "Story" && asset === "IP" && !!evmAddress,
      staleTime: 15_000,
    },
  })

  const { data: storyUsdcRaw, isLoading: storyUsdcLoading } = useReadContract({
    address: STORY_USDC_ADDRESS,
    abi: ERC20_BALANCE_ABI,
    functionName: "balanceOf",
    args: evmAddress ? [evmAddress] : undefined,
    query: {
      enabled: sourceChain === "Story" && asset === "USDC" && !!evmAddress,
      staleTime: 15_000,
    },
  })

  if (sourceChain === "Story" && asset === "IP") {
    const raw = ipBalance?.value ?? BigInt(0)
    return { balance: raw, formatted: formatUnits(raw, 18), isLoading: ipLoading }
  }

  if (sourceChain === "Story" && asset === "USDC") {
    const raw = typeof storyUsdcRaw === "bigint" ? storyUsdcRaw : BigInt(0)
    return { balance: raw, formatted: formatUnits(raw, 6), isLoading: storyUsdcLoading }
  }

  if (sourceChain === "Solana" && asset === "SOL") {
    return { balance: solLamports, formatted: formatUnits(solLamports, 9), isLoading: solCtxLoading }
  }

  return { balance: solanaUsdcRaw, formatted: formatUnits(solanaUsdcRaw, 6), isLoading: solCtxLoading }
}

// ── Asset selector pill ──────────────────────────────────────────────────────

interface AssetPillProps {
  asset: WithdrawAsset
  assets: WithdrawAsset[]
  onChange?: (asset: WithdrawAsset) => void
  interactive?: boolean
}

function AssetPill({ asset, assets, onChange, interactive = false }: AssetPillProps) {
  const cfg = ASSET_CONFIG[asset]

  if (!interactive || !onChange || assets.length <= 1) {
    return (
      <div className="flex items-center gap-1.5 rounded-[30px] bg-neutral-500 px-3 py-1.5">
        {cfg.icon}
        <span className="text-sm font-medium text-white">{asset}</span>
      </div>
    )
  }

  return (
    <AssetSelectorDropdown
      value={asset}
      onChange={onChange}
      options={assets.map((token) => ({
        value: token,
        triggerLabel: token,
        menuLabel: ASSET_CONFIG[token].label,
        icon: ASSET_CONFIG[token].icon,
      }))}
      inline
      menuWidthClassName="w-[240px]"
      textSizeClassName="text-sm"
      triggerClassName="bg-neutral-500 border-neutral-400 hover:bg-neutral-400"
    />
  )
}

// ── Main modal ───────────────────────────────────────────────────────────────

interface WithdrawModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function WithdrawModal({ open, onOpenChange }: WithdrawModalProps) {
  const [sourceChain, setSourceChain] = useState<SourceChain>("Story")
  const [asset, setAsset] = useState<WithdrawAsset>("IP")
  const [destChainId, setDestChainId] = useState<number>(RELAY_STORY_CHAIN_ID)
  const [destAsset, setDestAsset] = useState<WithdrawAsset>("IP")
  const [amountStr, setAmountStr] = useState("")
  const [destAddress, setDestAddress] = useState("")

  const { balance, formatted: balanceFormatted, isLoading: balanceLoading } = useAssetBalance(sourceChain, asset)
  const { refreshAllBalances } = useRefreshAllBalances()

  const decimals = ASSET_CONFIG[asset].decimals
  const outputAssets = useMemo(() => getOutputAssetsForChain(destChainId), [destChainId])

  const amountBigInt = useMemo(() => {
    if (!amountStr || isNaN(Number(amountStr)) || Number(amountStr) <= 0) return BigInt(0)
    try {
      return parseUnits(amountStr, decimals)
    } catch {
      return BigInt(0)
    }
  }, [amountStr, decimals])

  const selectedDestChain = WITHDRAW_DESTINATION_CHAINS.find((c) => c.chainId === destChainId)

  const addressIsEvm = selectedDestChain?.isEvm ?? true
  const addressValid = destAddress.length > 0 ? isValidAddress(destAddress, addressIsEvm) : null
  const hasInsufficientBalance = amountBigInt > BigInt(0) && amountBigInt > balance

  const isDirect = checkIsDirectTransfer(sourceChain, asset, destChainId, destAsset)
  const needsQuoteForSubmit = !isDirect
  const canSubmit =
    amountBigInt > BigInt(0) &&
    !hasInsufficientBalance &&
    addressValid === true

  const {
    status,
    txHash,
    execute,
    reset,
    isQuoting,
    quoteError,
    receiveAmount,
    feeSummary,
    timeEstimate,
  } = useWithdraw({
    sourceChain,
    asset,
    destinationChainId: destChainId,
    destinationAsset: destAsset,
    amount: amountBigInt,
    destinationAddress: destAddress,
    enabled: canSubmit,
  })

  const isProcessing = status === "quoting" || status === "signing" || status === "sending" || status === "bridging"

  const handleSourceChainChange = useCallback(
    (chain: SourceChain) => {
      setSourceChain(chain)
      const assets = ASSETS_PER_SOURCE[chain]
      setAsset(assets[0])
      setDestChainId(getDefaultDestChainId(chain))
      const defaultDestAssets = getOutputAssetsForChain(getDefaultDestChainId(chain))
      setDestAsset(defaultDestAssets[0])
      setAmountStr("")
      setDestAddress("")
      reset()
    },
    [reset]
  )

  const handleAssetChange = useCallback(
    (newAsset: WithdrawAsset) => {
      setAsset(newAsset)
      setAmountStr("")
      reset()
    },
    [reset]
  )

  const handleDestChainChange = useCallback(
    (chainId: number) => {
      const prevChain = WITHDRAW_DESTINATION_CHAINS.find((c) => c.chainId === destChainId)
      const nextChain = WITHDRAW_DESTINATION_CHAINS.find((c) => c.chainId === chainId)
      setDestChainId(chainId)
      const available = getOutputAssetsForChain(chainId)
      if (!available.includes(destAsset)) {
        setDestAsset(available[0])
      }
      if (prevChain?.isEvm !== nextChain?.isEvm) {
        setDestAddress("")
      }
      reset()
    },
    [destChainId, destAsset, reset]
  )

  const handleMax = useCallback(() => {
    if (balance <= BigInt(0)) return
    const reserve = getGasReserve(sourceChain, asset)
    const maxAmount = balance > reserve ? balance - reserve : BigInt(0)
    if (maxAmount > BigInt(0)) {
      setAmountStr(formatUnits(maxAmount, decimals))
    }
  }, [balance, decimals, sourceChain, asset])

  useEffect(() => {
    if (!open) {
      setAmountStr("")
      setDestAddress("")
      reset()
    }
  }, [open, reset])

  useEffect(() => {
    if (status !== "complete") return
    refreshAllBalances()
    const timer = setTimeout(() => {
      reset()
      setAmountStr("")
    }, 1500)
    return () => clearTimeout(timer)
  }, [status, reset, refreshAllBalances])

  const handleSubmit = useCallback(() => {
    if (status === "error") {
      reset()
      setAmountStr("")
      return
    }
    if (status === "complete") return
    execute()
  }, [status, execute, reset])

  const sourceChainOptions = SOURCE_CHAINS.map((c) => ({
    value: c,
    label: c,
    icon: SOURCE_CHAIN_ICON[c],
  }))

  const destChainOptions = WITHDRAW_DESTINATION_CHAINS.map((c) => ({
    value: c.chainId,
    label: c.name,
    icon: c.chainId === RELAY_STORY_CHAIN_ID
      ? <Ip size={16} />
      : c.chainId === RELAY_SOLANA_CHAIN_ID
        ? <Solana size={16} />
        : <span className="flex size-4 items-center justify-center rounded-full bg-neutral-500 text-[8px] font-bold text-white">{c.name[0]}</span>,
  }))

  const buttonDisabled =
    isProcessing ||
    (status === "idle" && !canSubmit) ||
    hasInsufficientBalance ||
    (needsQuoteForSubmit && isQuoting) ||
    (needsQuoteForSubmit && !receiveAmount && !quoteError && amountBigInt > BigInt(0))

  const buttonLabel = hasInsufficientBalance
    ? "Insufficient Balance"
    : isQuoting && status === "idle"
      ? "Fetching quote..."
      : STATUS_LABELS[status]

  const showReceiveLoading = isQuoting && amountBigInt > BigInt(0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hasCloseButton={false}
        className="w-[calc(100vw-32px)] max-w-[400px] gap-0 overflow-hidden rounded-[16px] border-neutral-600 bg-transparent p-0 shadow-2xl sm:w-[400px] sm:rounded-[12px]"
      >
        {/* Header */}
        <div className="flex h-[48px] items-center justify-between border-b border-neutral-600 bg-neutral-700 px-4">
          <span className="text-sm font-medium text-white">Withdraw</span>
          <button
            onClick={() => onOpenChange(false)}
            className="flex size-6 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X size={12} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-3 bg-neutral-700 p-4">

          {/* Source chain + Balance row */}
          <div className="flex gap-3">
            <SelectDropdown
              value={sourceChain}
              onChange={handleSourceChainChange}
              options={sourceChainOptions}
              disabled={isProcessing}
              className="w-[140px]"
            />
            <div className="flex h-9 flex-1 items-center justify-between rounded-[10px] border border-neutral-500 px-4">
              <span className="text-xs text-neutral-400">Balance:</span>
              {balanceLoading ? (
                <div className="h-4 w-20 animate-pulse rounded bg-white/10" />
              ) : (
                <span className="text-sm font-medium text-white">
                  {`${Number(balanceFormatted).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${asset}`}
                </span>
              )}
            </div>
          </div>

          {/* Withdrawing panel */}
          <div className="rounded-[12px] border border-neutral-500 bg-neutral-600 px-4 py-3" style={{ boxShadow: "0 2px 12px 0 rgba(0, 0, 0, 0.20)" }}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-neutral-400">Withdrawing</span>
              <button
                onClick={handleMax}
                disabled={isProcessing}
                className="text-xs font-medium text-purple-200 transition-colors hover:text-purple-100 disabled:opacity-50"
              >
                Max
              </button>
            </div>
            <div className="flex items-center justify-between">
              <input
                type="text"
                inputMode="decimal"
                value={amountStr}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === "" || /^\d*\.?\d*$/.test(val)) setAmountStr(val)
                }}
                disabled={isProcessing}
                className="w-full bg-transparent font-mono text-lg text-white outline-none placeholder:text-white/40"
                placeholder="0.00"
              />
              <div className="ml-3 shrink-0">
                <AssetPill
                  asset={asset}
                  assets={ASSETS_PER_SOURCE[sourceChain]}
                  onChange={handleAssetChange}
                  interactive
                />
              </div>
            </div>
            {hasInsufficientBalance && (
              <p className="mt-2 text-xs text-red-400">Exceeds available balance</p>
            )}
          </div>

          {/* Arrow down separator */}
          <div className="flex justify-center -my-1">
            <ArrowDown size={18} className="text-neutral-400" />
          </div>

          {/* Destination chain */}
          <SelectDropdown
            value={String(destChainId)}
            onChange={(v) => handleDestChainChange(Number(v))}
            options={destChainOptions.map((o) => ({ ...o, value: String(o.value) }))}
            disabled={isProcessing}
          />

          {/* Destination address */}
          <input
            type="text"
            value={destAddress}
            onChange={(e) => setDestAddress(e.target.value.trim())}
            disabled={isProcessing}
            className={cn(
              "h-9 w-full rounded-[10px] border bg-neutral-600 px-4 font-mono text-sm text-white outline-none transition-colors placeholder:text-neutral-400",
              destAddress.length > 0 && addressValid === false
                ? "border-red/50"
                : destAddress.length > 0 && addressValid === true
                  ? "border-green/30"
                  : "border-neutral-500"
            )}
            placeholder="Address: Destination Wallet"
          />

          {/* Receiving panel */}
          <div className="rounded-[12px] border border-neutral-500 bg-neutral-600 px-4 py-3" style={{ boxShadow: "0 2px 12px 0 rgba(0, 0, 0, 0.20)" }}>
            <div className="mb-2">
              <span className="text-xs text-neutral-400">Receiving</span>
            </div>
            <div className="flex items-center justify-between">
              {showReceiveLoading ? (
                <div className="h-6 w-24 animate-pulse rounded bg-white/10" />
              ) : (
                <span className="font-mono text-lg text-white">
                  {formatReceiveDisplay(receiveAmount)}
                </span>
              )}
              <div className="ml-3 shrink-0">
                <AssetPill
                  asset={destAsset}
                  assets={outputAssets}
                />
              </div>
            </div>
            {quoteError && amountBigInt > BigInt(0) && (
              <p className="mt-2 text-xs text-red-400">{quoteError}</p>
            )}
          </div>

          {/* Fee / time estimate row */}
          {(feeSummary || timeEstimate) && amountBigInt > BigInt(0) && !showReceiveLoading && (
            <div className="flex items-center justify-between px-1 text-xs text-neutral-300">
              {feeSummary && <span>{feeSummary}</span>}
              {timeEstimate && timeEstimate > 0 && (
                <span className="flex items-center gap-1">
                  <Clock size={10} />
                  {formatTimeEstimate(timeEstimate)}
                </span>
              )}
            </div>
          )}

          {/* Withdraw button */}
          <button
            onClick={handleSubmit}
            disabled={buttonDisabled}
            className={cn(
              "flex h-10 w-full items-center justify-center gap-2 rounded-[12px] text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              status === "error"
                ? "border border-red/30 bg-red/10 text-red hover:bg-red/20"
                : "bg-purple-200 text-neutral-900 hover:opacity-90"
            )}
          >
            {(isProcessing || (isQuoting && status === "idle")) && <Loader2 size={16} className="animate-spin" />}
            {buttonLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
