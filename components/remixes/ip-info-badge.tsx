"use client"

import React, { useState } from "react"
import { Heart as LucideHeart } from "lucide-react"
import Image from "@/components/image"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { formatNumberWithSuffix, formatUSD } from "@/lib/number"
import { Remix } from "@/types/remix"
import { Ip } from "@/types/ip"
import { cn } from "@/lib/utils"
import { extractHandle, truncateAddress } from "@/lib/strings"
import { SOCIAL_TYPE } from "@/components/socials"

function getOwnerSocialUrl(accountType: SOCIAL_TYPE | undefined, account: string): string | null {
  const username = extractHandle(account)
  switch (accountType) {
    case SOCIAL_TYPE.TWITTER:
      return `https://x.com/${username}`
    case SOCIAL_TYPE.TIKTOK:
      return `https://tiktok.com/@${username}`
    case SOCIAL_TYPE.INSTAGRAM:
      return `https://instagram.com/${username}`
    default:
      return null
  }
}
import { useTokenMetricsLive } from "@/hooks/use-token-metrics"
import { Community, Crown, Twitter, Tiktok } from "../icons"
import { TreasureChestFilled } from "../icons/treasure-chest-filled"
import { TreasureChestLocked } from "../icons/treasure-chest-locked"
import EndorsementSticker from "./endorsement-sticker"
import Link from "next/link"
import { OwnerWarning } from "../icons/owner-warning"

interface IpInfoBadgeProps {
  remix: Remix
  className?: string
  typeIconClassName?: string
}

function IpInfoBadge({ remix, className, typeIconClassName }: IpInfoBadgeProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!remix.ip) {
    return null
  }

  return (
    <>
      <div
        onClick={() => setIsOpen(true)}
        className={cn(
          "flex cursor-pointer items-center gap-1 rounded-[6px] bg-neutral-700 px-1.5 py-1 hover:bg-neutral-600",
          className
        )}
      >
        <div className={cn("text-neutral-300", typeIconClassName)}>
          {remix.ip.type === "creator" ? (
            <Crown width={12} height={10} />
          ) : (
            <Community width={12} height={10} />
          )}
        </div>
        <div className="size-4 relative">
          <Image
            src={remix.ip.image}
            alt={remix.ip.title}
            fill
            className="rounded-sm object-cover"
          />
        </div>
        <div className="font-sf-pro-rounded text-xs font-extrabold text-neutral-200">{remix.ip.title}</div>
      </div>

      <IpInfoDialog ip={remix.ip} parentRemix={remix} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}

function RemixRow({ remix, parentRemix }: { remix: Remix; parentRemix?: Remix }) {
  const liveMetrics = useTokenMetricsLive(remix.token_address)
  const marketCap = liveMetrics?.total_market_cap_usd ?? remix.market_cap
  const marketCapChange = liveMetrics?.market_cap_change_24h ?? remix.market_cap_change

  const enrichedRemix =
    parentRemix && remix.token_address === parentRemix.token_address && !remix.owner_endorsement
      ? { ...remix, owner_endorsement: parentRemix.owner_endorsement }
      : remix

  return (
    <Link
      href={`/token/${remix.token_address}`}
      key={remix.token_address}
      className="flex items-center justify-between rounded-[12px] transition-colors hover:bg-neutral-800/50"
    >
      <div className="flex items-center gap-3">
        <div className="size-12 relative">
          <Image src={remix.image} alt={remix.name} fill className="rounded-[12px] object-cover" />
        </div>
        <div>
          <div className="flex items-center gap-1 text-sm font-semibold text-white mb-1">
            {enrichedRemix.name}
            <span className="translate-y-px">
              <EndorsementSticker remix={enrichedRemix} size={12} />
            </span>
          </div>
          <div className="text-sm text-neutral-300 font-medium">${remix.symbol}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-semibold text-white font-mono mb-1">{formatUSD(marketCap)}</div>
        <div
          className={cn(
            "text-base font-medium font-mono",
            marketCapChange >= 0 ? "text-green-neon" : "text-pink-neon"
          )}
        >
          {marketCapChange >= 0 ? "+" : ""}
          {marketCapChange.toFixed(1)}%
        </div>
      </div>
    </Link>
  )
}

interface IpInfoDialogProps {
  ip: Ip
  parentRemix?: Remix
  isOpen: boolean
  onClose: () => void
}

function IpInfoDialog({ ip, parentRemix, isOpen, onClose }: IpInfoDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[730px] max-w-[600px] overflow-hidden bg-[#121212]! p-0 text-white rounded-[24px]">
        <div className="flex flex-col">
          {/* Header */}
          <div className="bg-[#121212] p-5">
            <div className="flex items-stretch gap-6">
              {/* Image with purple border + gap */}
              <div className="shrink-0 self-start rounded-[16px] border border-[1.5px]! border-purple-500 p-[4px]">
                <div className="size-[108px] relative">
                  <Image
                    src={ip.image}
                    alt={ip.title}
                    fill
                    className="rounded-[12px] object-cover"
                  />
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <div className="text-neutral-300">
                    {ip.type === "creator" ? <Crown width={21} height={18} /> : <Community width={21} height={18} />}
                  </div>
                  <DialogTitle className="mb-0 text-2xl font-archivo font-semibold text-white">{ip.title}</DialogTitle>
                </div>
                {/* Owner + treasure chest pill — matches token page style */}
                <div className="mb-2 flex items-center gap-1.5">
                  <div className="flex items-center">
                    {(() => {
                      const isCommunity = ip.type === "community"
                      const hasOwnerTag = !isCommunity && !!ip.owner_account
                      const ownerOnboarded = !!ip.owner_address
                      const showChest = !isCommunity || ip.is_verified
                      const chestOpen = isCommunity ? (ip as any).is_graduated === true : ownerOnboarded
                      const handleColor = ownerOnboarded ? "text-[#b3b3b3]" : "text-[#797979]"
                      const hasLeftPill = hasOwnerTag

                      const ownerPillContent = hasOwnerTag ? (
                        <>
                          {!ownerOnboarded && <OwnerWarning size={11} />}
                          {ip.owner_account_type === SOCIAL_TYPE.TWITTER && <span className={handleColor}><Twitter size={10} /></span>}
                          {ip.owner_account_type === SOCIAL_TYPE.TIKTOK && <span className={handleColor}><Tiktok size={10} /></span>}
                          <span className={cn("font-mono text-xs font-medium", handleColor)}>@{extractHandle(ip.owner_account)}</span>
                        </>
                      ) : null

                      const ownerUrl = ip.owner_account ? getOwnerSocialUrl(ip.owner_account_type, ip.owner_account) : null

                      return (
                        <>
                          {hasOwnerTag && (
                            ownerUrl ? (
                              <Link href={ownerUrl} target="_blank" className="flex items-center gap-1 rounded-l-[6px] border-[0.5px] border-[#333333] bg-[rgba(90,90,103,0.4)] px-2 py-1 transition-colors hover:bg-[rgba(90,90,103,0.6)]">
                                {ownerPillContent}
                              </Link>
                            ) : (
                              <div className="flex items-center gap-1 rounded-l-[6px] border-[0.5px] border-[#333333] bg-[rgba(90,90,103,0.4)] px-2 py-1">
                                {ownerPillContent}
                              </div>
                            )
                          )}
                          {showChest && (
                            <div className={cn(
                              "flex items-center gap-1.5 border-[0.5px] border-[#333333] px-1.5 py-1",
                              hasLeftPill ? "rounded-r-[6px] border-l-0" : "rounded-[6px]",
                              chestOpen ? "bg-[rgba(90,90,103,0.2)] text-[#C093FF]" : "bg-[rgba(90,90,103,0.2)] text-[#494949]"
                            )}>
                              {chestOpen ? <TreasureChestFilled /> : <TreasureChestLocked size={12} />}
                              <span className={cn("font-mono text-xs font-semibold", chestOpen ? "text-[#C093FF]" : "text-[#494949]")}>
                                {ip.owner_rewards_usd != null ? `$${formatNumberWithSuffix(ip.owner_rewards_usd)}` : "—"}
                              </span>
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>
                </div>

                {/* Stats - with vertical dividers */}
                <div className="flex items-center bg-neutral-700 rounded-full px-1 py-1.5 w-fit mt-auto mb-0.5 -ml-0.5">
                  {/* Views - eye icon (larger) */}
                  <div className="flex items-center gap-1.5 pl-2 pr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="16" viewBox="0 0 18 16" fill="none">
                      <path fillRule="evenodd" clipRule="evenodd" d="M5.237 4.132C6.103 3.236 7.138 2.667 8.667 2.667c1.529 0 2.564.569 3.43 1.465.597.618 1.134 1.42 1.706 2.272.215.32.435.648.664.976l.2.287-.2.287c-.23.328-.45.656-.665.976-.572.853-1.109 1.654-1.706 2.272-.866.896-1.901 1.465-3.43 1.465-1.529 0-2.564-.569-3.43-1.465-.597-.618-1.134-1.42-1.706-2.272a46.69 46.69 0 0 1-.664-.976l-.2-.287.2-.287c.23-.328.45-.656.664-.976.572-.853 1.11-1.654 1.706-2.272zM6.667 7.667a2 2 0 1 1 4 0 2 2 0 0 1-4 0z" fill="#797979" />
                    </svg>
                    <span className="text-sm text-white">{formatNumberWithSuffix(ip.total_impressions || 0)}</span>
                  </div>
                  <div className="w-px h-4 bg-neutral-500" />
                  {/* Likes - filled heart (slightly smaller) */}
                  <div className="flex items-center gap-1.5 px-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 16 17" fill="none">
                      <path fillRule="evenodd" clipRule="evenodd" d="M4.438 1.833C1.987 1.833 0 3.82 0 6.271c0 1.177.468 2.306 1.3 3.138L8 16.11l6.7-6.7c.832-.833 1.3-1.962 1.3-3.138C16 3.82 14.013 1.833 11.562 1.833c-1.177 0-2.306.468-3.138 1.3L8 3.557l-.424-.424c-.832-.832-1.961-1.3-3.138-1.3z" fill="#797979" />
                    </svg>
                    <span className="text-sm text-white">{formatNumberWithSuffix(ip.total_likes || 0)}</span>
                  </div>
                  <div className="w-px h-4 bg-neutral-500" />
                  {/* Shares - box share arrow (from Figma) */}
                  <div className="flex items-center gap-1.5 pl-3 pr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="12" viewBox="0 0 14 12" fill="none">
                      <path d="M9.333 7.419c0 .435.517.662.838.369l3.427-3.142a.5.5 0 0 0 0-.737L10.17.768c-.32-.294-.838-.066-.838.369v.56c0 .273-.22.494-.492.513a8.001 8.001 0 0 0-6.065 2.755A8.001 8.001 0 0 0 .311 9.257c-.138.526.609.757.957.34a8.003 8.003 0 0 1 1.836-1.643 8.003 8.003 0 0 1 4.636-1.391h1.093c.276 0 .5.224.5.5v.356z" fill="#797979" />
                    </svg>
                    <span className="text-sm text-white">{formatNumberWithSuffix(ip.total_shares || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex min-h-0 flex-1 flex-col gap-4 bg-[#121212] p-5 pt-3">
            {/* Summary */}
            {(ip.ai_summary || ip.description) && (
              <div className="bg-neutral-700 rounded-[16px] p-4">
                <h3 className="mb-3 text-xs font-normal text-neutral-400">Summary</h3>
                <p className="text-sm leading-[150%]! font-medium text-white/90">{ip.ai_summary || ip.description}</p>
              </div>
            )}

            {/* Tokens */}
            {ip.remixes && ip.remixes.length > 0 && (
              <div className="flex min-h-0 flex-1 flex-col bg-neutral-700 rounded-[16px] p-4">
                <h3 className="mb-4 text-xs font-normal text-neutral-400">Tokens</h3>
                <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
                  {ip.remixes.map((remix) => (
                    <RemixRow key={remix.token_address} remix={remix} parentRemix={parentRemix} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { IpInfoDialog }

export default React.memo(IpInfoBadge, (prevProps, nextProps) => {
  return prevProps.remix.ip === nextProps.remix.ip
})