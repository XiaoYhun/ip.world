"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export enum Mode {
  BUY = "buy",
  SELL = "sell",
}

/** Shared with trade card content so motion matches the tab highlight. */
export const TRADE_MODE_SPRING = { type: "spring" as const, stiffness: 440, damping: 35 }

const TradeSwitch = ({ mode, onChange }: { mode: Mode; onChange: (mode: Mode) => void }) => {
  return (
    <div className="flex items-center gap-2">
      {[Mode.BUY, Mode.SELL].map((tMode) => {
        const active = tMode === mode
        return (
          <Button
            key={tMode}
            type="button"
            onClick={() => onChange(tMode)}
            className={cn(
              "relative h-auto min-h-0 overflow-hidden rounded-[6px] border-[0.5px] px-3.5 py-2 text-[14px] font-semibold capitalize shadow-none transition-colors hover:scale-100 focus-visible:ring-0 focus-visible:ring-offset-0",
              active
                ? "border-transparent focus-visible:border-transparent"
                : "border-[#313131] bg-[#191919] text-[#797979] hover:bg-[#191919] hover:text-[#797979] focus-visible:border-[#313131]"
            )}
          >
            {active && (
              <motion.div
                layoutId="trade-mode-tab-highlight"
                className={cn(
                  "absolute inset-0 rounded-[6px] border-[0.5px]",
                  tMode === Mode.BUY
                    ? "border-[#AFFF2E] bg-[#243B00]"
                    : "border-pink-neon bg-[#3B102C]"
                )}
                transition={TRADE_MODE_SPRING}
              />
            )}
            <span
              className={cn(
                "relative z-10 inline-block",
                active
                  ? tMode === Mode.BUY
                    ? "text-[#AFFF2E]"
                    : "text-pink-neon"
                  : "text-[#797979]"
              )}
            >
              {tMode === Mode.BUY ? "Buy" : "Sell"}
            </span>
          </Button>
        )
      })}
    </div>
  )
}

export default TradeSwitch
