"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Image from "@/components/image"
import { formatBigNumber } from "@/lib/bignumber"
import { formatNumber, formatNumberWithSuffix } from "@/lib/number"
import { cn } from "@/lib/utils"
import { Holding } from "@/types/holding"
import Copy from "@/components/copy"
import { CATEGORIES } from "@/lib/constants"
import { IpInfoDialog } from "@/components/remixes/ip-info-badge"
import { Ip as IpType } from "@/types/ip"
import { CreatedRemixTableSkeleton } from "./CreatedRemixTable"

export const HoldingsTableSkeleton = CreatedRemixTableSkeleton

const HoldingsTable = ({
  holdings,
  total,
  pnlByTokenAddress,
  isLoading = false,
}: {
  holdings: Holding[]
  total: number
  walletAddress: string
  pnlByTokenAddress?: Record<
    string,
    {
      pnlUsd: number
      pnlPercentage: number
      boughtUsd: number
      soldUsd: number
      holdingUsd: number
      quantityHeld: string
    }
  >
  isLoading?: boolean
}) => {
  const [selectedIp, setSelectedIp] = useState<IpType | null>(null)
  const router = useRouter()

  const getHoldingPnl = (holding: Holding) => {
    const tokenAddress = holding.token_address?.toLowerCase?.()
    if (!tokenAddress) return null

    const positionPnl = pnlByTokenAddress?.[tokenAddress]
    if (!positionPnl) return null

    const pnlUsd = Number.isFinite(positionPnl.pnlUsd) ? positionPnl.pnlUsd : 0
    const pnlPercentage = Number.isFinite(positionPnl.pnlPercentage) ? positionPnl.pnlPercentage : 0
    const isPositive = pnlUsd >= 0

    return {
      isPositive,
      pnlAmount: `${isPositive ? "+" : "-"}$${formatNumberWithSuffix(Math.abs(pnlUsd), 2)}`,
      pnlPercent: `${pnlPercentage >= 0 ? "+" : ""}${pnlPercentage.toFixed(2)}%`,
    }
  }

  if (isLoading) {
    return <HoldingsTableSkeleton />
  }

  if (total === 0) {
    return (
      <div className="flex w-full justify-center py-10">
        <p className="text-neutral-300">No holdings data</p>
      </div>
    )
  }

  return (
    <>
      {/* Desktop */}
      <div className="hidden w-full sm:block">
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col style={{ width: "20%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "15%" }} />
          </colgroup>
          <thead className="bg-background">
            <tr className="bg-background border-b border-neutral-600">
              <th className="h-auto py-2 pr-2 text-left text-xxs font-semibold tracking-wide text-neutral-400 uppercase">
                TOKEN
              </th>
              <th className="h-auto py-2 pr-2 pl-3 text-left text-xxs font-semibold tracking-wide text-neutral-400 uppercase">
                IP
              </th>
              <th className="h-auto px-2 py-2 text-right text-xxs font-semibold tracking-wide text-neutral-400 uppercase">
                MCAP
              </th>
              <th className="h-auto px-2 py-2 text-right text-xxs font-semibold tracking-wide text-neutral-400 uppercase">
                BOUGHT
              </th>
              <th className="h-auto px-2 py-2 text-right text-xxs font-semibold tracking-wide text-neutral-400 uppercase">
                SOLD
              </th>
              <th className="h-auto px-2 py-2 text-right text-xxs font-semibold tracking-wide text-neutral-400 uppercase">
                HOLDING
              </th>
              <th className="h-auto px-2 py-2 text-right text-xxs font-semibold tracking-wide text-neutral-400 uppercase">
                VALUE
              </th>
              <th className="h-auto py-2 pl-2 text-right text-xxs font-semibold tracking-wide text-neutral-400 uppercase">
                PNL
              </th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((holding, i) => {
              const marketCapChangePct = holding.market_cap_change || 0
              const marketCapChangePctFormatted =
                marketCapChangePct == 0
                  ? "--"
                  : `${marketCapChangePct > 0 ? "+" : ""}${formatNumber(marketCapChangePct, 2, true)}%`
              return (
                <tr
                  key={holding.token_address || i}
                  onClick={() => router.push(`/token/${holding?.token_address}`)}
                  className="group cursor-pointer *:py-2 hover:bg-transparent hover:[&>td]:bg-neutral-700 hover:[&>td:first-child]:rounded-l-xl hover:[&>td:last-child]:rounded-r-xl"
                >
                  <td className="overflow-visible pr-5">
                    <Link href={`/token/${holding?.token_address}`} className="flex items-center gap-3">
                      <Image
                        src={holding?.token_image}
                        alt={holding?.token_name}
                        className="size-[36px] shrink-0 rounded-[10px] object-cover sm:size-[40px]"
                        width={40}
                        height={40}
                      />
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <div className="truncate text-sm font-semibold text-white">{holding?.token_name}</div>
                        <Copy
                          copy={holding?.token_address}
                          text={`$${holding?.token_ticker}`}
                          toastLabel={`$${holding?.token_ticker}`}
                          className="text-xs font-medium text-neutral-400"
                          size={10}
                        />
                      </div>
                    </Link>
                  </td>
                  <td className="px-3">
                    {holding?.ip?.title ? (
                      <div
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] bg-neutral-700 px-2 py-1 transition-colors group-hover:bg-neutral-600/60 hover:bg-neutral-600!"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedIp(holding.ip as unknown as IpType)
                        }}
                      >
                        {(() => {
                          const Icon = CATEGORIES.find((c) => c.key === (holding.ip as any)?.category)?.icon
                          return Icon ? <Icon size={12} /> : null
                        })()}
                        <span className="max-w-[80px] truncate text-xs font-medium text-neutral-300">
                          {holding.ip.title}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-neutral-500">—</span>
                    )}
                  </td>
                  <td className="px-2 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <div className="font-mono text-sm font-semibold">
                        ${formatNumberWithSuffix(holding?.market_cap)}
                      </div>
                      <div
                        className={cn(
                          "text-xs font-medium",
                          marketCapChangePct > 0
                            ? "text-green-neon"
                            : marketCapChangePct < 0
                              ? "text-pink-neon"
                              : "text-neutral-400"
                        )}
                      >
                        {marketCapChangePctFormatted}
                      </div>
                    </div>
                  </td>
                  <td className="px-2 text-right font-mono text-sm">
                    {(() => {
                      const tokenAddress = holding.token_address?.toLowerCase?.()
                      const bought = tokenAddress ? pnlByTokenAddress?.[tokenAddress]?.boughtUsd : undefined
                      if (bought == null) return <span className="text-neutral-400">--</span>
                      return <span className="text-green-neon">${formatNumberWithSuffix(bought)}</span>
                    })()}
                  </td>
                  <td className="px-2 text-right font-mono text-sm">
                    {(() => {
                      const tokenAddress = holding.token_address?.toLowerCase?.()
                      const sold = tokenAddress ? pnlByTokenAddress?.[tokenAddress]?.soldUsd : undefined
                      if (sold == null) return <span className="text-neutral-400">--</span>
                      return <span className="text-pink-neon">${formatNumberWithSuffix(sold)}</span>
                    })()}
                  </td>
                  <td className="px-2 text-right font-mono text-sm">
                    {formatNumberWithSuffix(Number(formatBigNumber(String(holding?.amount), holding?.decimals)))}
                  </td>
                  <td className="px-2 text-right font-mono text-sm">
                    ${formatNumberWithSuffix(Number(holding?.value))}
                  </td>
                  <td className="pl-2 text-right font-mono text-sm">
                    {(() => {
                      const holdingPnl = getHoldingPnl(holding)
                      if (!holdingPnl) return <span className="text-neutral-400">--</span>
                      return (
                        <div className="flex flex-col items-end gap-0.5">
                          <span className={holdingPnl.isPositive ? "text-green-neon" : "text-pink-neon"}>
                            {holdingPnl.pnlAmount}
                          </span>
                          <span className={cn("text-xs", holdingPnl.isPositive ? "text-green-neon" : "text-pink-neon")}>
                            {holdingPnl.pnlPercent}
                          </span>
                        </div>
                      )
                    })()}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="flex w-full flex-col gap-2 sm:hidden">
        {holdings.map((holding, index) => (
          <Link
            key={holding.token_address || index}
            href={`/token/${holding?.token_address}`}
            className="rounded-[12px] border border-neutral-700 bg-neutral-800/60 p-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex min-w-0 items-center gap-2.5">
                <Image
                  src={holding?.token_image}
                  alt={holding?.token_name}
                  className="aspect-square h-9 w-9 shrink-0 rounded-[6px] object-cover"
                  width={36}
                  height={36}
                />
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-medium">{holding?.token_name}</div>
                  <div className="text-sm text-neutral-400 uppercase">${holding?.token_ticker}</div>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-xs text-neutral-400">MC</div>
                <div className="font-mono text-sm font-medium">${formatNumberWithSuffix(holding?.market_cap)}</div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 border-t border-neutral-700 pt-2">
              <div>
                <div className="text-xs text-neutral-400">Bought</div>
                {(() => {
                  const tokenAddress = holding.token_address?.toLowerCase?.()
                  const bought = tokenAddress ? pnlByTokenAddress?.[tokenAddress]?.boughtUsd : undefined
                  return (
                    <div className="text-green-neon font-mono text-sm font-medium">
                      {bought != null ? `$${formatNumberWithSuffix(bought)}` : "--"}
                    </div>
                  )
                })()}
              </div>
              <div>
                <div className="text-xs text-neutral-400">Sold</div>
                {(() => {
                  const tokenAddress = holding.token_address?.toLowerCase?.()
                  const sold = tokenAddress ? pnlByTokenAddress?.[tokenAddress]?.soldUsd : undefined
                  return (
                    <div className="text-pink-neon font-mono text-sm font-medium">
                      {sold != null ? `$${formatNumberWithSuffix(sold)}` : "--"}
                    </div>
                  )
                })()}
              </div>
              <div>
                <div className="text-xs text-neutral-400">Value</div>
                <div className="font-mono text-sm font-medium">${formatNumberWithSuffix(Number(holding?.value))}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-neutral-400">PnL</div>
                {(() => {
                  const holdingPnl = getHoldingPnl(holding)
                  if (!holdingPnl) return <div className="font-mono text-sm font-medium text-neutral-400">--</div>
                  return (
                    <div
                      className={`font-mono text-sm font-medium ${holdingPnl.isPositive ? "text-green-neon" : "text-pink-neon"}`}
                    >
                      {holdingPnl.pnlAmount}
                      <span className="ml-1 text-xs">({holdingPnl.pnlPercent})</span>
                    </div>
                  )
                })()}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {selectedIp && <IpInfoDialog ip={selectedIp} isOpen={!!selectedIp} onClose={() => setSelectedIp(null)} />}
    </>
  )
}

export default HoldingsTable
