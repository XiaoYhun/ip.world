"use client"

import { motion } from "framer-motion"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatNumberWithSuffix } from "@/lib/number"
import { cn } from "@/lib/utils"

export type TradeShelfPnl = {
  totalBoughtUsd: number
  totalSoldUsd: number
  netPnlUsd: number
  pnlPercent: number
  boughtQtyTokens: number
  soldQtyTokens: number
}

/** Shelf card entrance — snappy spring with visible overshoot / bounce */
export const TRADE_SHELF_SPRING = {
  type: "spring" as const,
  stiffness: 620,
  damping: 15,
  mass: 0.36,
  bounce: 0.45,
}

const TRADE_SHELF_SPRING_SOFT = {
  type: "spring" as const,
  stiffness: 480,
  damping: 22,
  mass: 0.42,
  bounce: 0.32,
}

function fmtUsdPrimary(v: number) {
  return `$${v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: v % 1 !== 0 ? 2 : 0 })}`
}

function fmtTokenLine(qty: number, symbol: string) {
  if (qty <= 0) return `0 $${symbol}`
  return `${formatNumberWithSuffix(qty, 2)} $${symbol}`
}

function TradeHoldingShelfContent({
  pnl,
  tokenSymbol,
  onOpenPnlCard,
}: {
  pnl: TradeShelfPnl
  tokenSymbol: string
  onOpenPnlCard?: () => void
}) {
  const isPositive = pnl.pnlPercent >= 0
  const pctLabel = `${isPositive ? "+" : ""}${pnl.pnlPercent.toFixed(1)}%`

  return (
    <>
      <div className="flex min-w-0 flex-col gap-1">
        <span className="font-sf-pro-rounded text-[11px] font-semibold leading-tight tracking-wide text-[#494949]">
          Bought
        </span>
        <span className="font-sf-pro-rounded text-base font-bold leading-none text-[#D9D9D9]">
          {fmtUsdPrimary(pnl.totalBoughtUsd)}
        </span>
        <span className="font-sf-pro-rounded text-[11px] font-bold leading-tight text-[#797979]">
          {fmtTokenLine(pnl.boughtQtyTokens, tokenSymbol)}
        </span>
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <span className="font-sf-pro-rounded text-[11px] font-semibold leading-tight tracking-wide text-[#494949]">
          Sold
        </span>
        <span className="font-sf-pro-rounded text-base font-bold leading-none text-[#D9D9D9]">
          {fmtUsdPrimary(pnl.totalSoldUsd)}
        </span>
        <span className="font-sf-pro-rounded text-[11px] font-bold leading-tight text-[#797979]">
          {fmtTokenLine(pnl.soldQtyTokens, tokenSymbol)}
        </span>
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex min-w-0 items-center justify-between gap-0.5 pr-0.5">
          <span className="font-sf-pro-rounded text-[11px] font-semibold leading-tight tracking-wide text-[#494949]">
            PnL
          </span>
          {onOpenPnlCard ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-3 w-3 shrink-0 text-[#797979] hover:bg-white/10 hover:text-[#D9D9D9]"
              aria-label="Generate PnL card"
              onClick={onOpenPnlCard}
            >
              <Upload className="size-3.5" strokeWidth={2} />
            </Button>
          ) : null}
        </div>
        <span className="font-sf-pro-rounded text-base font-bold leading-none text-[#D9D9D9]">
          {fmtUsdPrimary(pnl.netPnlUsd)}
        </span>
        <p className="font-sf-pro-rounded text-[11px] leading-tight font-extrabold">
          <span className={cn(isPositive ? "text-[#AFFF2E]" : "text-pink-neon")}>{pctLabel}</span>
          <span className="ml-1 font-medium text-[#494949]">7d</span>
        </p>
      </div>
    </>
  )
}

/**
 * Shelf card under the trade CTA — negative margin tucks it under the button
 * (z-0) while the button stays on top (z-10 in trade.tsx).
 */
export function TradeHoldingShelfPanel({
  pnl,
  tokenSymbol,
  onOpenPnlCard,
}: {
  pnl: TradeShelfPnl
  tokenSymbol: string
  onOpenPnlCard?: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={TRADE_SHELF_SPRING}
      className="relative z-0 -mt-4 w-full rounded-b-2xl rounded-t-none border border-[#242424] border-t-0 bg-[#121212] px-3 pt-6 pb-3"
    >
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={TRADE_SHELF_SPRING_SOFT}
        className="grid w-full grid-cols-3 gap-2 text-[12px] sm:gap-3"
      >
        <TradeHoldingShelfContent pnl={pnl} tokenSymbol={tokenSymbol} onOpenPnlCard={onOpenPnlCard} />
      </motion.div>
    </motion.div>
  )
}
