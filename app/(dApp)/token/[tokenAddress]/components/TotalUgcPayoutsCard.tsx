"use client"

import { ExternalLink, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { env } from "@/config"

export type UgcPayout = {
  id: string
  amountUsd: number
  tokenAmount: string
  ipAmount: string
  rangeLabel: string
  txHash?: `0x${string}`
}

export type TotalUgcPayoutsCardProps = {
  title?: string
  totalPayoutUsd?: number
  payouts?: UgcPayout[]
  onClose?: () => void
  className?: string
}

function formatUsd(value: number) {
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function UsdAmount({
  value,
  className,
  dimDecimals = false,
}: {
  value: number
  className?: string
  dimDecimals?: boolean
}) {
  if (value > 0 && value < 0.001) {
    return (
      <span className={className}>
        &lt;$0.<span className={dimDecimals ? "text-neutral-400!" : "text-neutral-300!"}>001</span>
      </span>
    )
  }
  const [whole, decimal] = formatUsd(value).split(".")
  return (
    <span className={className}>
      {whole}
      <span className={dimDecimals ? "text-neutral-400!" : "text-neutral-300!"}>
        .{(decimal ?? "00").padEnd(2, "0")}
      </span>
    </span>
  )
}

export default function TotalUgcPayoutsCard({
  title = "Total UGC Payouts",
  totalPayoutUsd = 0,
  payouts = [],
  onClose,
  className,
}: TotalUgcPayoutsCardProps) {
  return (
    <div
      className={cn(
        "relative flex max-w-sm flex-col gap-5 rounded-[16px] border border-neutral-700 bg-[#121212] p-4 text-white shadow-[0_18px_40px_rgba(0,0,0,0.7)]",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-neutral-100">{title}</div>
        <button
          type="button"
          onClick={onClose}
          className="flex size-6 items-center justify-center rounded-full bg-neutral-700 text-neutral-300 transition-colors hover:bg-neutral-600 hover:text-white"
          aria-label="Close payouts"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div className="rounded-[12px] border border-neutral-700 bg-[#191919] p-5">
        <div className="text-xxs font-medium tracking-[0.12em] text-neutral-400">TOTAL PAYOUT</div>
        <div className="mt-3 font-mono text-3xl leading-none font-medium">
          <UsdAmount value={totalPayoutUsd} dimDecimals />
        </div>
      </div>

      <div className="relative rounded-[16px] bg-[#191919] px-3 pt-4 pb-2">
        <div className="mb-3 text-xs font-medium tracking-[0.12em] text-neutral-400">PAYOUT HISTORY</div>

        <div className="max-h-48 space-y-1 overflow-y-auto pr-1">
          {payouts.length === 0 && (
            <div className="flex h-30! flex-col items-center justify-center py-6 text-center">
              <div className="text-sm font-medium text-neutral-300">No payouts yet</div>
            </div>
          )}
          {payouts.map((payout) => {
            return (
              <div
                key={payout.id}
                className="flex items-center justify-between border-b border-neutral-700 px-3 py-3 last:border-b-0"
              >
                <div>
                  <div className="font-mono text-base font-medium">
                    <UsdAmount value={payout.amountUsd} />
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] font-medium text-neutral-300">
                    <span>{payout.tokenAmount}</span>
                    {payout.ipAmount && (
                      <>
                        <span className="inline-block size-[2px] rounded-full bg-neutral-500" />
                        <span>{payout.ipAmount}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {payout.txHash ? (
                    <a
                      href={`${env.NEXT_PUBLIC_EXPLORER_URL.replace(/\/$/, "")}/tx/${payout.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative z-10 flex items-center gap-1 rounded-full bg-neutral-700 px-3 py-1 text-[11px] font-medium text-neutral-200 underline decoration-neutral-500 cursor-pointer hover:text-white hover:bg-neutral-600"
                    >
                      {payout.rangeLabel}
                      <ExternalLink size={10} className="text-neutral-400" />
                    </a>
                  ) : (
                    <span className="relative z-10 flex items-center gap-1 rounded-full bg-neutral-800 px-3 py-1 text-[11px] font-medium text-neutral-400">
                      {payout.rangeLabel}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
