"use client"

import { useEffect, useMemo, useState } from "react"
import { useBalance } from "wagmi"
import { useAccount } from "@/hooks/use-account"
import { SheetClose, SheetContent } from "@/components/ui/sheet"
import AssetSelectorDropdown from "@/components/ui/asset-selector-dropdown"
import { useIpPrice } from "@/context/token-metrics-context"
import { usePaymentCurrency } from "@/context/payment-currency-context"
import { usePortfolio } from "@/context/portfolio-context"
import { useSolanaBalances } from "@/context/solana-balances-context"
import { bigNumberToFloat } from "@/lib/bignumber"
import { formatNumber } from "@/lib/number"
import { useUnifiedUsdcBalance } from "@/hooks/use-unified-usdc-balance"
import useGetSolPrice from "@/hooks/use-get-sol-price"
import DepositModal from "@/components/modals/deposit-modal"
import WithdrawModal from "@/components/modals/withdraw-modal"
import TokenBalance from "./token-balance"
import { Close, Ip, Solana, Usdc } from "../icons"

// ---------------------------------------------------------------------------
// Types & config
// ---------------------------------------------------------------------------

type PortfolioAsset = "IP" | "SOL" | "USDC"

// ---------------------------------------------------------------------------
// USD formatting — splits dollars and cents for styling
// ---------------------------------------------------------------------------

function formatUsdParts(value: number): { dollars: string; cents: string } {
  if (value <= 0) return { dollars: "$0", cents: ".00" }
  const formatted = value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const [whole, fraction] = formatted.split(".")
  return { dollars: `$${whole}`, cents: `.${fraction}` }
}

// ---------------------------------------------------------------------------
// Portfolio component
// ---------------------------------------------------------------------------

const Portfolio = () => {
  const { address } = useAccount()
  const { paymentCurrency } = usePaymentCurrency()
  const { isOpen, setOpen: setPortfolioOpen } = usePortfolio()
  const [selectedAsset, setSelectedAsset] = useState<PortfolioAsset>(paymentCurrency)
  const [depositOpen, setDepositOpen] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)

  useEffect(() => {
    if (isOpen) setSelectedAsset(paymentCurrency)
  }, [isOpen, paymentCurrency])

  // IP balance
  const { data: ipBalanceData } = useBalance({ address })
  const ipBalanceFloat = bigNumberToFloat(ipBalanceData?.value ?? "0", ipBalanceData?.decimals ?? 0)
  const ipPrice = useIpPrice()

  // SOL balance + price
  const { solBalance: solBalanceFloat } = useSolanaBalances()
  const { data: solPrice } = useGetSolPrice()

  // USDC balance
  const { totalUsdc } = useUnifiedUsdcBalance()

  // Derived values for the selected asset
  const { usdValue, nativeAmount, nativeSymbol, assetIcon } = useMemo(() => {
    switch (selectedAsset) {
      case "IP":
        return {
          usdValue: ipBalanceFloat * ipPrice,
          nativeAmount: formatNumber(ipBalanceFloat, 2, true),
          nativeSymbol: "IP",
          assetIcon: <Ip size={16} />,
        }
      case "SOL":
        return {
          usdValue: solBalanceFloat * solPrice,
          nativeAmount: formatNumber(solBalanceFloat, 4, true),
          nativeSymbol: "SOL",
          assetIcon: <Solana size={16} />,
        }
      case "USDC":
        return {
          usdValue: totalUsdc,
          nativeAmount: formatNumber(totalUsdc, 2, true),
          nativeSymbol: "USDC",
          assetIcon: <Usdc size={16} />,
        }
    }
  }, [selectedAsset, ipBalanceFloat, ipPrice, solBalanceFloat, solPrice, totalUsdc])

  const { dollars, cents } = formatUsdParts(usdValue)

  const selectorOptions = useMemo(
    () => [
      {
        value: "IP" as const,
        triggerLabel: "IP",
        menuLabel: `${formatNumber(ipBalanceFloat, 2, true)} IP`,
        icon: <Ip size={16} />,
      },
      {
        value: "SOL" as const,
        triggerLabel: "SOL",
        menuLabel: `${formatNumber(solBalanceFloat, 2, true)} SOL`,
        icon: <Solana size={16} />,
      },
      {
        value: "USDC" as const,
        triggerLabel: "USDC",
        menuLabel: `${formatNumber(totalUsdc, 2, true)} USDC`,
        icon: <Usdc size={16} />,
      },
    ],
    [ipBalanceFloat, solBalanceFloat, totalUsdc]
  )

  return (
    <>
      <SheetContent className="m-4! flex h-[calc(100vh-2rem)] w-[420px]! flex-col gap-0 overflow-visible rounded-[16px] border border-white/5 bg-black/60! backdrop-blur-2xl">
        {/* Top bar: asset selector + close */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <AssetSelectorDropdown
            value={selectedAsset}
            onChange={setSelectedAsset}
            options={selectorOptions}
            inline
            menuWidthClassName="w-[300px]"
            textSizeClassName="text-[18px]"
          />
          <SheetClose className="flex size-8 cursor-pointer items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white">
            <Close size={10} />
          </SheetClose>
        </div>

        {/* Balance card */}
        <div className="mx-6 mb-5 rounded-[12px] border-[0.5px] border-neutral-500 bg-dots [--dot-color:#1A1A1A] p-4">
          <p className="mb-3 text-sm text-neutral-300">Your Balance</p>

          <div className="mb-2 flex items-baseline justify-between">
            <p className="text-[32px] font-semibold leading-none text-white">
              {dollars}
              <span className="text-neutral-400">{cents}</span>
            </p>
          </div>

          <p className="mb-5 flex items-center gap-1.5 text-sm text-neutral-200">
            {assetIcon}
            {nativeAmount} {nativeSymbol}
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setPortfolioOpen(false)
                setDepositOpen(true)
              }}
              className="flex h-9 flex-1 cursor-pointer items-center justify-center border-[0.5px] border-neutral-500 bg-neutral-600 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-500"
              style={{ borderRadius: 31, boxShadow: "0px 16px 16px 0px rgba(12,12,13,0.1), 0px 4px 4px 0px rgba(12,12,13,0.05)" }}
            >
              Add Funds
            </button>
            <button
              onClick={() => {
                setPortfolioOpen(false)
                setWithdrawOpen(true)
              }}
              className="flex h-9 flex-1 cursor-pointer items-center justify-center border-[0.5px] border-neutral-500 bg-neutral-600 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-500"
              style={{ borderRadius: 31, boxShadow: "0px 16px 16px 0px rgba(12,12,13,0.1), 0px 4px 4px 0px rgba(12,12,13,0.05)" }}
            >
              Send
            </button>
          </div>
        </div>

        {/* Token list */}
        <div className="flex-1 overflow-hidden px-6">
          <TokenBalance />
        </div>
      </SheetContent>

      <DepositModal open={depositOpen} onOpenChange={setDepositOpen} />
      <WithdrawModal open={withdrawOpen} onOpenChange={setWithdrawOpen} />
    </>
  )
}

export default Portfolio
