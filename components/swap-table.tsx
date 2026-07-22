import BigNumber from "bignumber.js"
import { motion } from "framer-motion"
import Link from "next/link"
import React, { useEffect, useMemo, useState } from "react"
import { Address } from "viem"
import { env } from "@/config"
import { formatNumberWithSuffix } from "@/lib/number"
import { formatTimeAgo, truncateAddress, truncateUsername } from "@/lib/strings"
import { Remix } from "@/types/remix"
import type { SwapRow } from "@/hooks/use-token-swaps"
import { useIpPrice, useTokenMetricsByAddressContext } from "@/context/token-metrics-context"
import { useResolveUsers, lookupUser } from "@/hooks/use-resolve-users"
import { ChevronDown, Crown, DevIcon, LinkIcon, LpIcon, SwapCurrency } from "./icons"
import { cn } from "@/lib/utils"
import { UserIcon } from "lucide-react"
import { safeImageSrc } from "@/lib/safe-url"

export type SwapTableProps = {
  swaps?: SwapRow[]
  remix: Remix
  toggleSortOrder: () => void
  sortOrder: "asc" | "desc"
}

function sqrtPriceX96ToPrice(sqrtPriceX96: string) {
  const Q96 = BigInt(2) ** BigInt(96) // scaling factor
  const ratioX192 = BigInt(sqrtPriceX96) * BigInt(sqrtPriceX96) // square it
  const price = Number(Q96 * Q96) / Number(ratioX192)
  return price
}

const MemorizedAgeRenderer = React.memo(function AgeRenderer({ created_at }: { created_at: string }) {
  const [, rerender] = useState(0)
  useEffect(() => {
    const ageMs = Date.now() - new Date(created_at).getTime()
    // Tick every second only if under 1 minute, otherwise every 60s
    const interval = ageMs < 60_000 ? 1000 : 60_000
    const id = setInterval(() => {
      rerender((prev) => prev + 1)
    }, interval)
    return () => clearInterval(id)
  }, [created_at])
  return <span>{formatTimeAgo(created_at)}</span>
})

const ROLE_LABEL: Record<string, string> = {
  creator: "Token Creator",
  pool: "Liquidity Pool",
  owner: "IP Owner",
}

const SwapTable = ({ swaps = [], remix, toggleSortOrder, sortOrder }: SwapTableProps) => {
  const [swapCurrency, setSwapCurrency] = useState<"ip" | "usd">("usd")
  const { metrics } = useTokenMetricsByAddressContext()

  // Roles + fallback user info from top_holders
  const holderMap = useMemo(() => {
    const map: Record<string, { username?: string; avatar_url?: string; role?: string }> = {}
    for (const h of metrics?.top_holders ?? []) {
      map[h.owner_address.toLowerCase()] = { username: h.username, avatar_url: h.avatar_url, role: h.role }
    }
    return map
  }, [metrics?.top_holders])

  // Batch resolve all trader addresses (augments holderMap when backend is deployed)
  const traderAddresses = useMemo(
    () => [...new Set(swaps.map((s) => s.origin).filter(Boolean))],
    [swaps]
  )
  const { userMap } = useResolveUsers(traderAddresses)

  const shouldReverse = remix.token_address < env.NEXT_PUBLIC_WRAPPED_IP_TOKEN_ADDRESS
  const isSell = (swap: SwapRow) => {
    return shouldReverse ? swap.amount_1.startsWith("-") : swap.amount_0.startsWith("-")
  }

  /** Signed remix-token pool delta: positive = tokens into pool (sell), negative = out (buy). */
  function remixTokenSignedRaw(swap: SwapRow): number {
    return BigNumber(shouldReverse ? swap.amount_0 : swap.amount_1).toNumber()
  }

  function remixTokenInOut(swap: SwapRow): { tokenIn: number; tokenOut: number } {
    const n = remixTokenSignedRaw(swap)
    return {
      tokenIn: n > 0 ? n : 0,
      tokenOut: n < 0 ? Math.abs(n) : 0,
    }
  }

  function formatTokenQty(n: number): string {
    if (n <= 0) return "—"
    return formatNumberWithSuffix(n)
  }

  const sortedSwaps = useMemo(() => {
    return [...swaps]
      .sort((a, b) => {
        const timeA = new Date(a.created_at).getTime()
        const timeB = new Date(b.created_at).getTime()
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA
      })
      .map((swap) => {
        const priceInIP = swap.sqrt_price_x96 ? sqrtPriceX96ToPrice(swap.sqrt_price_x96) : 0
        return {
          ...swap,
          priceInIP,
        }
      })
  }, [swaps, sortOrder])
  const maxSwapAmount = useMemo(() => {
    return Math.max(...sortedSwaps.map((swap) => Number(swap.amount_usd)))
  }, [sortedSwaps, shouldReverse])

  const renderItem = (swap: SwapRow & { priceInIP: number }, index: number) => {
    const isBuy = !isSell(swap)
    const { tokenIn, tokenOut } = remixTokenInOut(swap)
    return (
      <>
        <td className="py-2.5 font-mono text-xs font-medium text-neutral-300">
          <MemorizedAgeRenderer created_at={swap.created_at} />
        </td>
        <td className="py-2.5">
          <span className={cn("text-xs font-medium", isBuy ? "text-green-neon" : "text-pink-neon")}>
            {isBuy ? "Buy" : "Sell"}
          </span>
        </td>
        {/* <td >
          <MemorizedMarketCapRenderer priceInIP={swap.priceInIP} decimals={remix.decimals || 18} />
        </td> */}
        <td className="py-2.5">
          <span className={cn("font-mono text-xs font-medium", tokenIn > 0 ? "text-neutral-200" : "text-neutral-600")}>
            {formatTokenQty(tokenIn)}
          </span>
        </td>
        <td className="py-2.5">
          <span className={cn("font-mono text-xs font-medium", tokenOut > 0 ? "text-neutral-200" : "text-neutral-600")}>
            {formatTokenQty(tokenOut)}
          </span>
        </td>
        <td className="py-2.5 relative">
          <div
            className={cn(
              "absolute top-0 bottom-0 left-4 border-r bg-gradient-to-r from-transparent",
              isBuy ? "to-green-neon/15 border-green-neon/40" : "to-pink-neon/15 border-pink-neon/40"
            )}
            style={{ width: `${(Number(swap.amount_usd) / maxSwapAmount) * 100}%` }}
          ></div>
          <span className={cn("font-mono text-xs font-medium", isBuy ? "text-green-neon" : "text-pink-neon")}>
            {swapCurrency === "ip"
              ? formatNumberWithSuffix(Math.abs(BigNumber(shouldReverse ? swap.amount_1 : swap.amount_0).toNumber())) +
              " IP"
              : "$" + formatNumberWithSuffix(Number(swap.amount_usd))}
          </span>
        </td>
        <td className="py-2.5 text-right text-xs font-medium">
          {(() => {
            const resolved = lookupUser(userMap, swap.origin)
            const holder = holderMap[swap.origin?.toLowerCase()]
            const username = resolved?.username || holder?.username
            const avatarUrl = resolved?.avatar_url || holder?.avatar_url
            const role = holder?.role
            const roleIcon = role === "creator" ? <DevIcon /> : role === "pool" ? <LpIcon /> : role === "owner" ? <Crown width={12} height={12} /> : null
            return (
              <div className="flex items-center justify-end gap-2">
                <div className="relative size-5 shrink-0 overflow-hidden rounded-full bg-neutral-700">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={safeImageSrc(avatarUrl)} alt="" className="absolute inset-0 size-full object-cover" />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-neutral-300">
                      <UserIcon size={11} />
                    </span>
                  )}
                </div>
                {roleIcon && <span className="shrink-0">{roleIcon}</span>}
                <Link href={`/@${username || swap.origin}`} className="flex items-center gap-1 text-neutral-200 hover:text-white">
                  <span className="truncate text-xs font-medium text-white font-mono">
                    {username ? truncateUsername(username) : truncateAddress(swap.origin as Address)}
                  </span>
                  <LinkIcon size={11} />
                </Link>
              </div>
            )
          })()}
        </td>
      </>
    )
  }

  const renderMobileRow = (swap: SwapRow & { priceInIP: number }, index: number) => {
    const isBuy = !isSell(swap)
    const { tokenIn, tokenOut } = remixTokenInOut(swap)
    const resolved = lookupUser(userMap, swap.origin)
    const holder = holderMap[swap.origin?.toLowerCase()]
    const username = resolved?.username || holder?.username
    const avatarUrl = resolved?.avatar_url || holder?.avatar_url
    const usdVal = Number(swap.amount_usd)
    return (
      <div
        key={swap.id || index}
        className="grid items-center gap-x-2 py-2.5 border-b border-neutral-800 last:border-0"
        style={{ gridTemplateColumns: "auto 2.2rem 1fr auto" }}
      >
        {/* B/S badge */}
        <div className={cn(
          "flex size-6 items-center justify-center rounded-full text-[10px] font-bold",
          isBuy ? "bg-green-neon/20 text-green-neon" : "bg-pink-neon/20 text-pink-neon"
        )}>
          {isBuy ? "B" : "S"}
        </div>

        {/* Age */}
        <span className="font-mono text-xs text-neutral-400">
          <MemorizedAgeRenderer created_at={swap.created_at} />
        </span>

        {/* USD amount with bar */}
        <div className="relative overflow-hidden rounded-sm px-1.5 py-0.5">
          <div
            className={cn(
              "absolute inset-y-0 left-0 border-r bg-gradient-to-r from-transparent",
              isBuy ? "to-green-neon/15 border-green-neon/40" : "to-pink-neon/15 border-pink-neon/40"
            )}
            style={{ width: `${(usdVal / maxSwapAmount) * 100}%` }}
          />
          <span className={cn("relative font-mono text-xs font-semibold", isBuy ? "text-green-neon" : "text-pink-neon")}>
            ${formatNumberWithSuffix(usdVal)}
          </span>
        </div>

        {/* Maker */}
        <Link href={`/@${username || swap.origin}`} className="flex items-center gap-1.5 justify-end min-w-0">
          <div className="relative size-4 shrink-0 overflow-hidden rounded-full bg-neutral-700">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={safeImageSrc(avatarUrl)} alt="" className="absolute inset-0 size-full object-cover" />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-neutral-300">
                <UserIcon size={9} />
              </span>
            )}
          </div>
          <span className="font-mono text-[11px] text-neutral-300 truncate max-w-[5rem]">
            {username ? truncateUsername(username) : truncateAddress(swap.origin as Address)}
          </span>
        </Link>

        <div className="col-span-4 flex flex-wrap items-center gap-x-3 gap-y-0.5 border-neutral-800/80 border-t pt-1.5 font-mono text-[10px] text-neutral-500">
          <span>
            <span className="text-neutral-600">In </span>
            <span className={tokenIn > 0 ? "text-neutral-300" : "text-neutral-600"}>{formatTokenQty(tokenIn)}</span>
            <span className="text-neutral-600"> ${remix.symbol}</span>
          </span>
          <span>
            <span className="text-neutral-600">Out </span>
            <span className={tokenOut > 0 ? "text-neutral-300" : "text-neutral-600"}>{formatTokenQty(tokenOut)}</span>
            <span className="text-neutral-600"> ${remix.symbol}</span>
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-4">
      {/* ── Mobile table ── */}
      <div className="sm:hidden">
        <div
          className="sticky top-[55px] z-10 bg-background grid items-center gap-x-2 py-2 text-[10px] font-semibold uppercase text-neutral-400"
          style={{ gridTemplateColumns: "auto 2.2rem 1fr auto" }}
        >
          <span className="pl-0.5">TXN</span>
          <div className="flex items-center gap-0.5">
            <span>Age</span>
            <div onClick={toggleSortOrder} className="cursor-pointer">
              <motion.div animate={{ rotate: sortOrder === "desc" ? 0 : 180 }}>
                <ChevronDown size={8} />
              </motion.div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span>{swapCurrency === "ip" ? "IP" : "USD"}</span>
            <div className="cursor-pointer hover:text-white" onClick={() => setSwapCurrency(swapCurrency === "ip" ? "usd" : "ip")}>
              <SwapCurrency />
            </div>
          </div>
          <span className="text-right">Trader</span>
        </div>
        {sortedSwaps.map((swap, index) => renderMobileRow(swap, index))}
      </div>

      {/* ── Desktop table ── */}
      <table className="hidden sm:table w-full text-sm">
        <thead className="sticky top-[140px] z-10 bg-background">
          <tr className="text-[10px] font-semibold">
            <th className="py-2 text-left font-semibold text-neutral-400 uppercase">
              <div className="flex items-center gap-1">
                <span>Age</span>
                <div onClick={toggleSortOrder} className="cursor-pointer">
                  <motion.div animate={{ rotate: sortOrder === "desc" ? 0 : 180 }}>
                    <ChevronDown size={10} />
                  </motion.div>
                </div>
              </div>
            </th>
            <th className="py-2 text-left font-semibold text-neutral-400 uppercase">Type</th>
            <th className="py-2 text-left font-semibold text-neutral-400 uppercase">
              In <span className="normal-case text-neutral-500">${remix.symbol}</span>
            </th>
            <th className="py-2 text-left font-semibold text-neutral-400 uppercase">
              Out <span className="normal-case text-neutral-500">${remix.symbol}</span>
            </th>
            <th className="py-2 text-left font-semibold text-neutral-400 uppercase">
              <div className="flex items-center gap-2">
                <span>{swapCurrency === "ip" ? "IP" : "USD"}</span>
                <div
                  className="cursor-pointer hover:text-white"
                  onClick={() => setSwapCurrency(swapCurrency === "ip" ? "usd" : "ip")}
                >
                  <SwapCurrency />
                </div>
              </div>
            </th>
            <th className="py-2 text-right font-semibold text-neutral-400 uppercase">TRADER</th>
          </tr>
        </thead>
        <tbody>
          {sortedSwaps.map((swap, index) => (
            <tr key={swap.id || index} className="transition-colors hover:bg-neutral-800/40">
              {renderItem(swap, index)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const MemorizedMarketCapRenderer = React.memo(function MarketCapRenderer({
  priceInIP,
  decimals,
}: {
  priceInIP: number
  decimals: number
}) {
  const ipPrice = useIpPrice()
  const marketCap = useMemo(() => {
    return priceInIP * ipPrice * 10 ** 9
  }, [priceInIP, ipPrice])

  return <span>${formatNumberWithSuffix(marketCap)}</span>
})

export default SwapTable
