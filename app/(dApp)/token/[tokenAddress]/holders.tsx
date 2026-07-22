"use client"

import Link from "next/link"
import { useMemo } from "react"
import { Address } from "viem"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useTokenMetricsByAddressContext } from "@/context/token-metrics-context"
import { useResolveUsers, lookupUser } from "@/hooks/use-resolve-users"
import { truncateAddress, truncateUsername } from "@/lib/strings"
import { cn } from "@/lib/utils"
import { safeImageSrc } from "@/lib/safe-url"
import { Crown, DevIcon, LpIcon } from "@/components/icons"
import { LinkIcon } from "@/components/icons/link"
import { UserIcon } from "lucide-react"
const SUPPLY = 1_000_000_000

function percentOwnership(qty: string | number) {
  const total_supply = SUPPLY * 10 ** 18
  const quantity = typeof qty === "string" ? parseFloat(qty) : qty
  return (quantity / total_supply) * 100
}


function formatUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(2)}`
}

function formatHeldSeconds(secs: number): string {
  const days = Math.floor(secs / 86400)
  const hours = Math.floor(secs / 3600)
  const mins = Math.floor(secs / 60)
  if (days > 0) return `${days}d`
  if (hours > 0) return `${hours}h`
  if (mins > 0) return `${mins}m`
  return `${Math.max(1, secs)}s`
}

function formatHeldDuration(firstSwapMs: number | null): string {
  if (!firstSwapMs) return "—"
  const diffMs = Date.now() - firstSwapMs
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) return `${diffDays}d`
  if (diffHours > 0) return `${diffHours}h`
  if (diffMins > 0) return `${diffMins}m`
  return `${Math.max(1, diffSecs)}s`
}

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 9 9" fill="none" className="shrink-0">
    <g clipPath="url(#clip0_4227_7981)">
      <path fillRule="evenodd" clipRule="evenodd" d="M4.5 9C6.98527 9 9 6.98527 9 4.5C9 2.01472 6.98527 0 4.5 0C2.01472 0 0 2.01472 0 4.5C0 6.98527 2.01472 9 4.5 9ZM4.5 1.5C4.18934 1.5 3.9375 1.75184 3.9375 2.0625V4.5C3.9375 4.81065 4.18935 5.0625 4.5 5.0625H6.5625C6.87316 5.0625 7.125 4.81066 7.125 4.5C7.125 4.18934 6.87316 3.9375 6.5625 3.9375H5.0625V2.0625C5.0625 1.75184 4.81066 1.5 4.5 1.5Z" fill="#D9D9D9" />
    </g>
    <defs>
      <clipPath id="clip0_4227_7981">
        <rect width="9" height="9" fill="white" />
      </clipPath>
    </defs>
  </svg>
)

const ROLE_LABEL: Record<string, string> = {
  creator: "Token Creator",
  pool: "Liquidity Pool",
  owner: "IP Owner",
}

const Holders = () => {
  const { metrics } = useTokenMetricsByAddressContext()

  // Batch resolve addresses that top_holders didn't enrich with username
  const unenrichedAddresses = useMemo(
    () => (metrics?.top_holders ?? []).filter((h) => !h.username).map((h) => h.owner_address),
    [metrics?.top_holders]
  )
  const { userMap } = useResolveUsers(unenrichedAddresses)

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "creator": return <DevIcon />
      case "pool": return <LpIcon />
      case "owner": return <Crown width={12} height={12} />
      default: return null
    }
  }

  return (
    <div className="p-4 min-h-[500px]">
      {!metrics?.top_holders ? (
        <p className="text-sm font-medium text-neutral-400">There aren&apos;t any holders right now</p>
      ) : (
        <div className="flex flex-col gap-4">
          {/* ── Desktop header (≥640px) ── */}
          <div
            className={cn(
              "sticky top-[140px] z-10 bg-background hidden sm:grid items-center px-3 py-2 font-semibold uppercase tracking-wide text-neutral-400 font-mono",
            )}
            style={{
              gridTemplateColumns: "1.4fr 0.6fr 0.6fr 0.6fr 0.55fr 0.45fr 0.5fr 0.45fr",
              fontFeatureSettings: "'lnum' 1, 'tnum' 1",
              fontSize: "10px",
            }}
          >
            <span>Account</span>
            <span>Bought</span>
            <span>Sold</span>
            <span>Amount</span>
            <span>Holding</span>
            <span>Held</span>
            <span>Holder Rewards</span>
            <span>PnL</span>
          </div>

          {/* ── Mobile header (<640px) ── */}
          <div
            className="sticky top-[55px] z-10 bg-background grid sm:hidden items-center px-3 py-2 font-semibold uppercase tracking-wide text-neutral-400 font-mono"
            style={{
              gridTemplateColumns: "1fr 0.5fr 0.6fr 0.4fr",
              fontFeatureSettings: "'lnum' 1, 'tnum' 1",
              fontSize: "10px",
            }}
          >
            <span>Account</span>
            <span>Holding</span>
            <span>Held</span>
            <span>PnL</span>
          </div>

          {/* Rows */}
          <div className="flex flex-col gap-px">
            {metrics.top_holders.map((holder, i) => {
              const resolved = !holder.username ? lookupUser(userMap, holder.owner_address) : undefined
              const displayName = holder.username || resolved?.username
              const avatarUrl = holder.avatar_url || resolved?.avatar_url
              const roleIcon = getRoleIcon(holder.role || "")

              const bought = parseFloat(holder.total_bought_usd || holder.total_tokens_bought || "0")
              const sold = parseFloat(holder.total_sold_usd || holder.total_tokens_sold || "0")
              const holdingValueUsd = parseFloat(holder.holdings_usd || "0")
              const totalPnlUsd = parseFloat(holder.pnl_usd || "0")
              const pnlPercent = bought > 0 ? (totalPnlUsd / bought) * 100 : 0
              const rewards = parseFloat(holder.holder_rewards_amount_usd || "0")
              const heldDuration = holder.held_seconds
                ? formatHeldSeconds(holder.held_seconds)
                : formatHeldDuration(holder.held_since ? new Date(holder.held_since).getTime() : null)

              return (
                <div key={`holder-${holder.owner_address}`}>
                  {/* ── Desktop row (≥640px) ── */}
                  <div
                    className={cn(
                      "hidden sm:grid items-center rounded-[12px] px-3 py-3 transition-colors hover:bg-neutral-800/60",
                    )}
                    style={{
                      gridTemplateColumns: "1.4fr 0.6fr 0.6fr 0.6fr 0.55fr 0.45fr 0.5fr 0.45fr",
                      fontFeatureSettings: "'lnum' 1, 'tnum' 1",
                    }}
                  >
                    {/* Account */}
                    <div className="flex min-w-0 items-center gap-2">
                      {holder.role !== "pool" && (
                        <div className="relative size-5 shrink-0 overflow-hidden rounded-full bg-neutral-700">
                          {avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={safeImageSrc(avatarUrl)} alt="" className="absolute inset-0 size-full object-cover" />
                          ) : displayName ? (
                            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold text-neutral-300">
                              {displayName.charAt(0).toUpperCase()}
                            </span>
                          ) : (
                            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold text-neutral-300">
                              <UserIcon size={11} />
                            </span>
                          )}
                        </div>
                      )}
                      {roleIcon && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="shrink-0 cursor-help">{roleIcon}</span>
                          </TooltipTrigger>
                          <TooltipContent><p>{ROLE_LABEL[holder.role ?? ""] ?? ""}</p></TooltipContent>
                        </Tooltip>
                      )}
                      <Link href={`/@${displayName || holder.owner_address}`} className="flex min-w-0 items-center gap-1.5 text-neutral-200 hover:text-white">
                          <span className="truncate text-xs font-medium text-white font-mono">{displayName ? truncateUsername(displayName) : truncateAddress(holder.owner_address as Address)}</span>
                          <LinkIcon size={11} />
                        </Link>
                    </div>

                    <span className="text-xs font-medium font-mono text-green-neon">{formatUsd(bought)}</span>

                    <span className="text-xs font-medium font-mono">
                      {sold > 0 ? <span className="text-pink-neon">{formatUsd(sold)}</span> : <span className="text-neutral-600">—</span>}
                    </span>

                    <span className="text-xs font-semibold text-white font-mono">{holdingValueUsd > 0 ? formatUsd(holdingValueUsd) : "—"}</span>

                    <span className="rounded-sm bg-neutral-700/60 px-1 py-px text-xs font-semibold text-white font-mono inline-block w-fit">
                      {percentOwnership(holder.quantity).toFixed(2)}%
                    </span>

                    <span className="flex items-center gap-1 text-xs font-medium text-neutral-100 font-mono">
                      <ClockIcon />
                      {heldDuration}
                    </span>

                    <span className="text-xs font-medium font-mono text-neutral-100">{rewards > 0 ? formatUsd(rewards) : "—"}</span>

                    <span className={cn("text-xs font-medium font-mono",
                      bought === 0 ? "text-neutral-500" : totalPnlUsd >= 0 ? "text-green-neon" : "text-pink-neon"
                    )}>
                      {bought === 0 ? "—" : `${totalPnlUsd >= 0 ? "+" : ""}${pnlPercent.toFixed(1)}%`}
                    </span>
                  </div>

                  {/* ── Mobile row (<640px) ── */}
                  <div
                    className="grid sm:hidden items-center rounded-[12px] px-3 py-3 transition-colors hover:bg-neutral-800/60"
                    style={{
                      gridTemplateColumns: "1fr 0.5fr 0.6fr 0.4fr",
                      fontFeatureSettings: "'lnum' 1, 'tnum' 1",
                    }}
                  >
                    {/* Account — compact */}
                    <div className="flex min-w-0 items-center gap-1.5">
                      {holder.role !== "pool" && (
                        <div className="relative size-5 shrink-0 overflow-hidden rounded-full bg-neutral-700">
                          {avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={safeImageSrc(avatarUrl)} alt="" className="absolute inset-0 size-full object-cover" />
                          ) : displayName ? (
                            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold text-neutral-300">
                              {displayName.charAt(0).toUpperCase()}
                            </span>
                          ) : (
                            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold text-neutral-300">
                              <UserIcon size={11} />
                            </span>
                          )}
                        </div>
                      )}
                      {roleIcon && <span className="shrink-0">{roleIcon}</span>}
                      <Link href={`/@${displayName || holder.owner_address}`} className="min-w-0">
                          <span className="truncate text-xs font-medium text-white font-mono block">{displayName ? truncateUsername(displayName) : truncateAddress(holder.owner_address as Address)}</span>
                        </Link>
                    </div>

                    {/* Holding % */}
                    <span className="rounded-sm bg-neutral-700/60 px-1 py-px text-xs font-semibold text-white font-mono inline-block w-fit">
                      {percentOwnership(holder.quantity).toFixed(2)}%
                    </span>

                    {/* Held */}
                    <span className="flex items-center gap-1 text-xs font-medium text-neutral-100 font-mono">
                      <ClockIcon />
                      {heldDuration}
                    </span>

                    {/* PnL */}
                    <span className={cn("text-xs font-medium font-mono text-right",
                      bought === 0 ? "text-neutral-500" : totalPnlUsd >= 0 ? "text-green-neon" : "text-pink-neon"
                    )}>
                      {bought === 0 ? "—" : `${totalPnlUsd >= 0 ? "+" : ""}${pnlPercent.toFixed(1)}%`}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default Holders
