"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { X, Globe } from "lucide-react"
import { Remix } from "@/types/remix"
import { formatNumberWithSuffix } from "@/lib/number"
import Image from "@/components/image"
import Copy from "@/components/copy"
import Link from "next/link"
import { useTokenMetricsByAddressContext } from "@/context/token-metrics-context"

function truncateAddress(addr: string) {
  if (!addr) return ""
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function timeAgo(dateStr: string) {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (days < 1) return "Today"
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks} week${weeks > 1 ? "s" : ""} ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`
  const years = Math.floor(days / 365)
  return `${years} year${years > 1 ? "s" : ""} ago`
}

function SocialIcon({ type, size = 10 }: { type?: string; size?: number }) {
  if (type === "tiktok") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.52a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.71a8.21 8.21 0 0 0 4.76 1.52V6.78a4.84 4.84 0 0 1-1-.09z" />
      </svg>
    )
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function getSocialUrl(type?: string, handle?: string) {
  if (!handle) return null
  if (type === "tiktok") return `https://tiktok.com/@${handle}`
  return `https://x.com/${handle}`
}

export default function ProjectInfoModal({
  open,
  onOpenChange,
  remix,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  remix: Remix
}) {
  const { metrics } = useTokenMetricsByAddressContext()
  const isCreatorType = remix.ip?.type === "creator"
  const creatorHandle = remix.ip?.handle || remix.ip?.owner_account || ""
  const creatorAccountType = remix.ip?.owner_account_type
  const isVerified = remix.ip?.is_verified ?? false
  const description = remix.description || remix.ip?.description || ""
  const website = remix.socials?.website || remix.ip?.socials?.website || ""
  const twitter = remix.socials?.twitter || remix.ip?.socials?.twitter || ""
  const creatorSocialUrl = getSocialUrl(creatorAccountType, creatorHandle)

  // Top 10 holders ownership %
  const top10Pct = (() => {
    if (!metrics?.top_holders || metrics.top_holders.length === 0) return null
    const totalSupplyWei = 1_000_000_000 * 1e18
    const top10 = metrics.top_holders.slice(0, 10)
    const top10Sum = top10.reduce((sum, h) => {
      return sum + parseFloat(h.quantity || "0")
    }, 0)
    const pct = Math.min((top10Sum / totalSupplyWei) * 100, 100)
    return pct > 0 ? pct.toFixed(1) + "%" : null
  })()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hasCloseButton={false}
        className="w-[367px] max-w-[90vw] border-none bg-transparent p-0 shadow-none"
      >
        <div className="flex flex-col rounded-[20px] border border-[#303030] bg-[#121212] text-white">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-0">
            <span className="text-base font-extrabold text-white">Project Info</span>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex size-7 items-center justify-center rounded-full bg-[#303030] text-neutral-400 transition-colors hover:bg-neutral-600 hover:text-white"
              aria-label="Close"
            >
              <X size={12} strokeWidth={2.5} />
            </button>
          </div>

          {/* Divider */}
          <div className="mx-6 mt-6 h-px bg-[#303030]" />

          {/* Description + Socials */}
          {(description || website || twitter) && (
            <>
              <div className="flex flex-col gap-4 px-6 py-6">
                {description && (
                  <div className="flex flex-col gap-3">
                    <span className="text-[11px] font-medium text-[#797979]">Description</span>
                    <p className="text-[13px] font-semibold leading-[1.6] text-[#d9d9d9]">{description}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  {website && (
                    <a
                      href={website.startsWith("http") ? website : `https://${website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex size-8 items-center justify-center rounded-full bg-[#242424] text-[#797979] transition-colors hover:text-white"
                    >
                      <Globe size={12} />
                    </a>
                  )}
                  {twitter && (
                    <a
                      href={`https://x.com/${twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex size-8 items-center justify-center rounded-full bg-[#242424] text-[#797979] transition-colors hover:text-white"
                    >
                      <SocialIcon type="twitter" size={12} />
                    </a>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="mx-6 h-px bg-[#303030]" />
            </>
          )}

          {/* Token Deployer + Creator */}
          <div className="flex flex-col gap-[19px] px-6 py-6">
            {/* Token Deployer row */}
            <div className="flex items-center justify-between">
              <Link href={`/@${remix.creator_username || remix.creator}`} className="flex items-center gap-2 transition-opacity hover:opacity-80">
                <div className="size-8 overflow-hidden rounded-full bg-neutral-700">
                  {remix.image && (
                    <Image src={remix.image} alt="Token" width={32} height={32} className="size-full object-cover" />
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-medium text-[#797979]">Token Deployer</span>
                  <span className="text-[15px] font-bold text-white">@{remix.creator_username || truncateAddress(remix.creator)}</span>
                </div>
              </Link>
              <div className="flex flex-col gap-1.5 text-right">
                <span className="text-[10px] font-medium text-[#797979]">Created</span>
                <span className="text-xs font-semibold text-[#b3b3b3]">
                  {timeAgo(remix.token_created_at || remix.created_at)}
                </span>
              </div>
            </div>

            {/* Creator row - only for creator type tokens */}
            {isCreatorType && creatorHandle && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-8 overflow-hidden rounded-full bg-neutral-700">
                    {remix.ip?.image && (
                      <Image src={remix.ip.image} alt="Creator" width={32} height={32} className="size-full object-cover" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-medium text-[#797979]">Creator</span>
                    {creatorSocialUrl ? (
                      <a
                        href={creatorSocialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[15px] font-bold text-white transition-opacity hover:opacity-80 mt-px"
                      >
                        <span className="text-[#797979] shrink-0">
                          <SocialIcon type={creatorAccountType} size={12} />
                        </span>
                        <span>@{creatorHandle}</span>
                      </a>
                    ) : (
                      <span className="text-[15px] font-bold text-white">@{creatorHandle}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 text-right">
                  {isVerified ? (
                    <>
                      <span className="text-[10px] font-medium text-[#797979]">Verified</span>
                      <span className="text-xs font-semibold text-[#b3b3b3]">
                        {timeAgo(remix.ip?.moderator_verification_timestamp || "")}
                      </span>
                    </>
                  ) : (
                    <span className="text-[10px] font-medium text-[#797979]">Unverified</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="mx-6 h-px bg-[#303030]" />

          {/* Contract Details */}
          <div className="flex flex-col gap-2 px-6 py-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#797979]">Contract Address</span>
              <Copy
                text={truncateAddress(remix.token_address)}
                copy={remix.token_address}
                size={12}
                className="text-xs font-semibold text-white"
                toastLabel={remix.symbol}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#797979]">Supply</span>
              <span className="text-xs font-semibold text-white">1B</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#797979]">Holders</span>
              <span className="text-xs font-semibold text-white">
                {remix.number_of_holders ? formatNumberWithSuffix(remix.number_of_holders) : "--"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#797979]">Top 10 Holders</span>
              <span className="text-xs font-semibold text-white">{top10Pct || "--"}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
