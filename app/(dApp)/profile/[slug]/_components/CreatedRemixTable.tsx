"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Image from "@/components/image"
import { formatNumber, formatNumberWithSuffix } from "@/lib/number"
import { cn } from "@/lib/utils"
import { Remix } from "@/types/remix"
import Copy from "@/components/copy"
import { CATEGORIES } from "@/lib/constants"
import { IpInfoDialog } from "@/components/remixes/ip-info-badge"
import { Ip as IpType } from "@/types/ip"

export const CreatedRemixTableSkeleton = () => (
  <>
    {/* Desktop skeleton */}
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
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className="*:py-2">
              <td className="pr-5">
                <div className="flex items-center gap-3">
                  <div className="size-[40px] shrink-0 animate-pulse rounded-[10px] bg-neutral-700" />
                  <div className="flex flex-col gap-1.5">
                    <div className="h-3 w-24 animate-pulse rounded bg-neutral-700" />
                    <div className="h-2.5 w-14 animate-pulse rounded bg-neutral-800" />
                  </div>
                </div>
              </td>
              <td className="px-3">
                <div className="h-6 w-20 animate-pulse rounded-[10px] bg-neutral-700" />
              </td>
              {Array.from({ length: 6 }).map((_, j) => (
                <td key={j} className="px-2">
                  <div className="ml-auto h-3 w-14 animate-pulse rounded bg-neutral-700" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {/* Mobile skeleton */}
    <div className="flex w-full flex-col gap-2 sm:hidden">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-[12px] border border-neutral-700 bg-neutral-800/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-9 animate-pulse rounded-[10px] bg-neutral-700" />
              <div className="flex flex-col gap-1.5">
                <div className="h-3 w-20 animate-pulse rounded bg-neutral-700" />
                <div className="h-2.5 w-12 animate-pulse rounded bg-neutral-800" />
              </div>
            </div>
            <div className="h-3 w-14 animate-pulse rounded bg-neutral-700" />
          </div>
          <div className="flex justify-between">
            <div className="h-2.5 w-16 animate-pulse rounded bg-neutral-800" />
            <div className="h-2.5 w-16 animate-pulse rounded bg-neutral-800" />
          </div>
        </div>
      ))}
    </div>
  </>
)

const CreatedRemixTable = ({
  remixes,
  total,
  pnlByTokenAddress,
  isLoading = false,
}: {
  remixes: Remix[]
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
  valueByTokenAddress?: Record<string, number>
  isLoading?: boolean
}) => {
  const [selectedIp, setSelectedIp] = useState<IpType | null>(null)
  const router = useRouter()

  const getRemixPnl = (remix: Remix) => {
    const tokenAddress = remix.token_address?.toLowerCase?.()
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
    return <CreatedRemixTableSkeleton />
  }

  if (total === 0) {
    return (
      <div className="flex w-full justify-center py-10">
        <p className="text-neutral-300">No tokens created</p>
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
              <th className="h-auto py-2 pr-2 text-left text-[10px] font-semibold tracking-wide text-neutral-400 uppercase">
                TOKEN
              </th>
              <th className="h-auto py-2 pr-2 pl-3 text-left text-[10px] font-semibold tracking-wide text-neutral-400 uppercase">
                IP
              </th>
              <th className="h-auto px-2 py-2 text-right text-[10px] font-semibold tracking-wide text-neutral-400 uppercase">
                MCAP
              </th>
              <th className="h-auto px-2 py-2 text-right text-[10px] font-semibold tracking-wide text-neutral-400 uppercase">
                BOUGHT
              </th>
              <th className="h-auto px-2 py-2 text-right text-[10px] font-semibold tracking-wide text-neutral-400 uppercase">
                SOLD
              </th>
              <th className="h-auto px-2 py-2 text-right text-[10px] font-semibold tracking-wide text-neutral-400 uppercase">
                HOLDING
              </th>
              <th className="h-auto px-2 py-2 text-right text-[10px] font-semibold tracking-wide text-neutral-400 uppercase">
                VALUE
              </th>
              <th className="h-auto py-2 pl-2 text-right text-[10px] font-semibold tracking-wide text-neutral-400 uppercase">
                PNL
              </th>
            </tr>
          </thead>
          <tbody>
            {remixes.map((remix, i) => {
              const marketCapChangePct = remix.market_cap_change || 0
              const marketCapChangePctFormatted =
                marketCapChangePct == 0
                  ? "--"
                  : `${marketCapChangePct > 0 ? "+" : ""}${formatNumber(marketCapChangePct, 2, true)}%`

              return (
                <tr
                  key={remix.token_address || i}
                  onClick={() => router.push(`/token/${remix.token_address}`)}
                  className="group cursor-pointer *:py-2 hover:bg-transparent hover:[&>td]:bg-neutral-700 hover:[&>td:first-child]:rounded-l-xl hover:[&>td:last-child]:rounded-r-xl"
                >
                  <td className="overflow-visible pr-5">
                    <Link href={`/token/${remix.token_address}`} className="flex items-center gap-3">
                      <Image
                        src={remix.image}
                        alt={remix.name}
                        className="size-[36px] shrink-0 rounded-[10px] object-cover sm:size-[40px]"
                        width={40}
                        height={40}
                      />
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <div className="truncate text-sm font-semibold text-white">{remix.name}</div>
                        <Copy
                          copy={remix.token_address}
                          text={`$${remix.symbol}`}
                          toastLabel={`$${remix.symbol}`}
                          className="text-xs font-medium text-neutral-400"
                          size={10}
                        />
                      </div>
                    </Link>
                  </td>
                  <td className="px-3">
                    {(() => {
                      const ip = remix?.ip || null
                      if (!ip?.title) return <span className="text-xs text-neutral-500">—</span>
                      return (
                        <div
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] bg-neutral-700 px-2 py-1 transition-colors group-hover:bg-neutral-600/60 hover:bg-neutral-600!"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedIp(ip as IpType)
                          }}
                        >
                          {(() => {
                            const Icon = CATEGORIES.find((c) => c.key === ip?.category)?.icon
                            return Icon ? <Icon size={12} /> : null
                          })()}
                          <span className="max-w-[80px] truncate text-xs font-medium text-neutral-300">{ip.title}</span>
                        </div>
                      )
                    })()}
                  </td>
                  <td className="px-2 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <div className="font-mono text-sm font-semibold">
                        ${formatNumberWithSuffix(remix.market_cap || 0)}
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
                      const tokenAddress = remix.token_address?.toLowerCase?.()
                      const bought = tokenAddress ? pnlByTokenAddress?.[tokenAddress]?.boughtUsd : undefined
                      if (bought == null) return <span className="text-neutral-400">--</span>
                      return <span className="text-green-neon">${formatNumberWithSuffix(bought)}</span>
                    })()}
                  </td>
                  <td className="px-2 text-right font-mono text-sm">
                    {(() => {
                      const tokenAddress = remix.token_address?.toLowerCase?.()
                      const sold = tokenAddress ? pnlByTokenAddress?.[tokenAddress]?.soldUsd : undefined
                      if (sold == null) return <span className="text-neutral-400">--</span>
                      return <span className="text-pink-neon">${formatNumberWithSuffix(sold)}</span>
                    })()}
                  </td>
                  <td className="px-2 text-right font-mono text-sm">
                    {remix.holdings_amount && Number(remix.holdings_amount) !== 0 ? (
                      formatNumberWithSuffix(Number(remix.holdings_amount))
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="px-2 text-right font-mono text-sm">
                    {remix?.holdings_value_usd && Number(remix.holdings_value_usd) !== 0 ? (
                      `$${formatNumberWithSuffix(Number(remix.holdings_value_usd))}`
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="pl-2 text-right font-mono text-sm">
                    {(() => {
                      const remixPnl = getRemixPnl(remix)
                      if (!remixPnl) return <span className="text-neutral-400">—</span>
                      return (
                        <div className="flex flex-col items-end gap-0.5">
                          <span className={remixPnl.isPositive ? "text-green-neon" : "text-pink-neon"}>
                            {remixPnl.pnlAmount}
                          </span>
                          <span className={cn("text-xs", remixPnl.isPositive ? "text-green-neon" : "text-pink-neon")}>
                            {remixPnl.pnlPercent}
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
        {remixes.map((remix, index) => (
          <Link
            key={remix.token_address || index}
            href={`/token/${remix.token_address}`}
            className="rounded-[12px] border border-neutral-700 bg-neutral-800/60 p-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex min-w-0 items-center gap-2.5">
                <Image
                  src={remix.image}
                  alt={remix.name}
                  className="aspect-square h-9 w-9 shrink-0 rounded-[6px] object-cover"
                  width={36}
                  height={36}
                />
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-medium">{remix.name}</div>
                  <div className="text-sm text-neutral-400 uppercase">${remix.symbol}</div>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-xs text-neutral-400">MC</div>
                <div className="font-mono text-sm font-medium">${formatNumberWithSuffix(remix.market_cap || 0)}</div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 border-t border-neutral-700 pt-2">
              <div>
                <div className="text-xs text-neutral-400">Bought</div>
                {(() => {
                  const tokenAddress = remix.token_address?.toLowerCase?.()
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
                  const tokenAddress = remix.token_address?.toLowerCase?.()
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
                {(() => {
                  const tokenAddress = remix.token_address?.toLowerCase?.()
                  const position = tokenAddress ? pnlByTokenAddress?.[tokenAddress] : undefined
                  if (!position) return <div className="font-mono text-sm font-medium text-neutral-400">--</div>
                  return (
                    <div className="font-mono text-sm font-medium">${formatNumberWithSuffix(position.holdingUsd)}</div>
                  )
                })()}
              </div>
              <div className="text-right">
                <div className="text-xs text-neutral-400">PnL</div>
                {(() => {
                  const tokenAddress = remix.token_address?.toLowerCase?.()
                  const position = tokenAddress ? pnlByTokenAddress?.[tokenAddress] : undefined
                  if (!position) return <div className="font-mono text-sm font-medium text-neutral-400">--</div>
                  const isPositive = position.pnlUsd >= 0
                  return (
                    <div
                      className={`font-mono text-sm font-medium ${isPositive ? "text-green-neon" : "text-pink-neon"}`}
                    >
                      {isPositive ? "+" : "-"}${formatNumberWithSuffix(Math.abs(position.pnlUsd))}
                      <span className="ml-1 text-xs">
                        ({position.pnlPercentage >= 0 ? "+" : ""}
                        {Math.round(position.pnlPercentage)}%)
                      </span>
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

export default CreatedRemixTable
