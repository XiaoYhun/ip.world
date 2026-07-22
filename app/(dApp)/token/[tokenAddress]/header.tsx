"use client"
import dynamic from "next/dynamic"
import Link from "next/link"
import { Address } from "viem"
import AmountInfo from "@/components/amount-info"
import Copy from "@/components/copy"
import ReportDialog from "@/components/dialog/report-dialog"
import {
  Chain,
  Clock,
  Crown,
  Flag,
  Instagram,
  Logo,
  Story,
  TelegramAlt,
  Tiktok,
  Twitter,
  TwitterBadge,
  Website,
  Youtube,
} from "@/components/icons"
import { TreasureChestLocked } from "@/components/icons/treasure-chest-locked"
import { OwnerWarning } from "@/components/icons/owner-warning"
import Image from "@/components/image"
import EndorsementIndicator from "@/components/remixes/endorsement-indicator"
import { SOCIAL_TYPE } from "@/components/socials"
import StoryExplorerLink from "@/components/story-explorer-link"
import VisualizedDelta from "@/components/visualized-delta"
import { useIsMobileView } from "@/context/mobile-ui-context"
import { useTokenMetricsByAddressContext } from "@/context/token-metrics-context"
import { extractHandle, truncateAddress } from "@/lib/strings"
import { formatNumberWithSuffix } from "@/lib/number"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Remix } from "@/types/remix"
import RemixIpCard from "../remix-ip-card"
import { BadgeCheck, Info } from "lucide-react"
import { useState } from "react"
import ProjectInfoModal from "./components/project-info-modal"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import IpInfoBadge from "@/components/remixes/ip-info-badge"
import { useRef } from "react"
import { TreasureChestFilled } from "@/components/icons/treasure-chest-filled"
import VerificationFormModal from "@/components/verification-form-modal"
import EndorsementSticker from "@/components/remixes/endorsement-sticker"
import { TokenImageViewerDialog } from "./components/token-image-viewer-dialog"

const Timer = dynamic(() => import("@/components/timer"))

const Header = ({ remix }: { remix: Remix }) => {
  const { metrics, isLoading: isMetricsLoading } = useTokenMetricsByAddressContext()
  const isMobile = useIsMobileView()
  const currentEndorsement = remix.owner_endorsement || "none"

  // Single source of truth: Electric market_cap_change_24h
  // Guard: if backend MC is 0 (unseeded), the -100% change is meaningless
  const mcapChange24h = metrics?.total_market_cap_usd_int ? (metrics?.market_cap_change_24h ?? 0) : 0
  const pricePercentage = mcapChange24h.toFixed(2)
  const isPriceUp = mcapChange24h >= 0
  const [tokenImageViewerOpen, setTokenImageViewerOpen] = useState(false)

  if (isMobile) {
    return (
      <>
      <div className="font-sf-pro-rounded relative flex h-auto flex-col border-b border-neutral-600 py-0">
        <div
          className="absolute inset-0 z-[-3] bg-cover bg-center"
          style={{ backgroundImage: `url(${remix.image})` }}
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0 z-[-2] h-full"
          style={{
            backgroundImage: "linear-gradient(to top, rgba(0,0,0,1) 30%, rgba(0,0,0,0.5) 100%)",
          }}
        />
        {/* Glass blur layer */}
        <div className="absolute inset-0 z-[-2] bg-black/10 backdrop-blur-xl" />

        <div className="relative z-10 flex flex-col gap-2 px-3 pt-0 pb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTokenImageViewerOpen(true)}
              className="cursor-pointer border-0 bg-transparent p-0"
              aria-label={`View ${remix.name} image`}
              title="View image"
            >
              <Image
                src={remix.image}
                alt="main-image"
                className="aspect-square h-20 w-20 rounded-[10px] object-cover"
                width={88}
                height={88}
              />
            </button>

            <div className="flex flex-1 flex-col">
              <div className="flex items-start justify-between">
                <div className="flex flex-1 flex-col">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-medium">{remix.name}</span>
                    <EndorsementIndicator
                      className="mt-1"
                      remix={{ ...remix, owner_endorsement: currentEndorsement }}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Copy
                      text={"$" + remix.symbol}
                      copy={remix.token_address}
                      size={16}
                      className="flex items-center text-lg font-medium text-neutral-300"
                    />
                  </div>
                </div>

                <div className="mt-2 ml-2 flex items-center gap-2">
                  {remix.socials?.twitter && (
                    <Link href={remix.socials.twitter} target="_blank" className="hover:text-white/70">
                      <div className="rounded-sm bg-neutral-600 p-1">
                        <TwitterBadge size={24} />
                      </div>
                    </Link>
                  )}
                  {remix.socials?.tiktok && (
                    <Link href={remix.socials.tiktok} target="_blank" className="hover:text-white/70">
                      <div className="rounded-sm bg-neutral-600 p-2">
                        <Tiktok size={18} />
                      </div>
                    </Link>
                  )}
                  {remix.socials?.instagram && (
                    <Link href={remix.socials.instagram} target="_blank" className="hover:text-white/70">
                      <div className="rounded-sm bg-neutral-600 p-2">
                        <Instagram size={18} />
                      </div>
                    </Link>
                  )}
                  {remix.socials?.telegram && (
                    <Link href={remix.socials.telegram} target="_blank" className="hover:text-white/70">
                      <div className="rounded-sm bg-neutral-600 p-1">
                        <TelegramAlt size={24} />
                      </div>
                    </Link>
                  )}
                  {remix.socials?.youtube && (
                    <Link href={remix.socials.youtube} target="_blank" className="hover:text-white/70">
                      <div className="rounded-sm bg-neutral-600 p-2">
                        <Youtube size={20} />
                      </div>
                    </Link>
                  )}
                  {remix.socials?.website && (
                    <Link href={remix.socials.website} target="_blank" className="hover:text-white/70">
                      <div className="rounded-sm bg-neutral-600 p-2">
                        <Website size={20} />
                      </div>
                    </Link>
                  )}
                </div>
              </div>

              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-neutral-300">remix of</span>
                <div className="flex items-center gap-1">
                  <span className="text-brand">
                    <Crown width={13} height={11} />
                  </span>
                  <RemixIpCard remix={remix} />
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-neutral-300">Price</span>
                {isMetricsLoading ? (
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                ) : (
                  <span className="text-md flex items-center gap-1">
                    <VisualizedDelta>{`$${metrics?.price_usd || "0"}`}</VisualizedDelta>
                    <span className={cn("text-xs", isPriceUp ? "text-green" : "text-red")}>{pricePercentage}%</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-2 flex w-full">
            <div className="flex flex-1 items-center justify-center border-r border-neutral-400">
              <AmountInfo
                label="Mcap"
                value={metrics?.total_market_cap_usd || "n/a"}
                position="start"
                isLoading={isMetricsLoading}
              />
            </div>
            <div className="flex flex-1 items-center justify-center border-r border-neutral-400">
              <AmountInfo
                label="FDV"
                value={metrics?.total_market_cap_usd || "n/a"}
                position="start"
                isLoading={isMetricsLoading}
              />
            </div>
            <div className="flex flex-1 items-center justify-center border-r border-neutral-400">
              <AmountInfo
                label="24h Vol"
                value={
                  metrics?.volume_24h_usd_int
                    ? formatNumberWithSuffix(metrics.volume_24h_usd_int)
                    : metrics?.volume_usd || "n/a"
                }
                position="start"
                isLoading={isMetricsLoading}
              />
            </div>
            <div className="flex flex-1 items-center justify-center">
              <AmountInfo
                label="Liq"
                value={metrics?.total_value_locked_usd || "n/a"}
                position="start"
                isLoading={isMetricsLoading}
              />
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between px-2 text-sm text-neutral-200">
            <div className="flex items-center">
              <Clock size={13} />
              <Timer className="ml-1 whitespace-nowrap" startTime={remix.created_at} />
            </div>
            <Link href={`/@${remix.creator_username || remix.creator}`} className="flex items-center justify-center">
                <div className="flex items-center gap-1 font-semibold hover:text-white">
                  <Chain width={8} height={8} />
                  <span>{remix.creator_username ? `@${remix.creator_username}` : truncateAddress(remix.creator as Address)}</span>
                </div>
            </Link>
            <div className="flex items-end justify-end gap-2">
              <ReportDialog
                topic="token"
                id={remix.id}
                currentIpId={remix.ip_id}
                trigger={
                  <button className="flex w-20 items-center justify-center gap-2 rounded-sm bg-neutral-600 p-2 text-neutral-200">
                    <span className="text-xs">Report</span>
                    <Flag size={18} />
                  </button>
                }
              />
            </div>
          </div>
        </div>
      </div>
      <TokenImageViewerDialog open={tokenImageViewerOpen} onOpenChange={setTokenImageViewerOpen} remix={remix} />
      </>
    )
  }

  return (
    <>
    <div className="font-sf-pro-rounded px-6 pt-0 pr-3 pb-3">
      <div className="flex w-full items-center justify-between border-b border-neutral-600 pb-3">
        {/* Left: image + info */}
        <div className="flex items-start gap-3">
          {/* 96×96 image with inside 2px gradient stroke + drop shadow */}
          <button
            type="button"
            onClick={() => setTokenImageViewerOpen(true)}
            className="relative shrink-0 cursor-pointer overflow-hidden rounded-[16px] border-0 bg-transparent p-0 shadow-[0px_3px_11.625px_0px_rgba(0,0,0,1)]"
            aria-label={`View ${remix.name} image`}
            title="View image"
          >
            <Image
              src={remix.image}
              alt="main-image"
              className="size-24 rounded-[16px] object-cover"
              width={96}
              height={96}
              sizes="96px"
            />
            <div
              className="pointer-events-none absolute inset-0 rounded-[16px]"
              style={{
                border: "1px solid transparent",
                background: "linear-gradient(to bottom right, rgba(255,255,255,0.4), rgba(255,255,255,0.1)) border-box",
                WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
              }}
            />
          </button>

          {/* Info column */}
          <div className="mt-1 flex flex-col justify-center gap-1.5">
            {/* Row 1: IP World logo + token name */}
            <div className="flex items-center gap-1.5">
              <EndorsementSticker remix={remix} size={28} />
              <span className="font-sf-pro-rounded text-[28px] leading-none font-extrabold tracking-tight text-white md:text-[32px]">
                {remix.name}
              </span>
            </div>

            {/* Row 2: ticker+copy | creator | divider | IP badge + owner pills */}
            <div className="flex items-center gap-[10px]">
              <Copy
                text={"$" + remix.symbol}
                copy={remix.token_address}
                size={12}
                className="text-sm font-bold text-[#494949]"
              />
              {/* {remix.creator && (
                <>
                  <div className="h-4 w-px bg-[#242424]" />
                  <Link href={`/@${remix.creator_username || remix.creator}`} className="text-xs font-medium text-neutral-400 hover:text-white transition-colors">
                    by @{remix.creator_username || truncateAddress(remix.creator as Address)}
                  </Link>
                </>
              )} */}
              <div className="h-4 w-px bg-[#242424]" />
              <div className="flex items-center gap-2">
                <IpInfoBadge remix={remix} />
                <OwnerTreasurePills remix={remix} />
              </div>
            </div>
          </div>
        </div>

        {/* Right: social icon buttons (57×57 each) */}
        <div className="flex items-center gap-2">
          {remix.socials?.website && (
            <Link
              href={remix.socials.website}
              target="_blank"
              className="flex size-[46px] shrink-0 items-center justify-center rounded-[8px] border border-[#313131] text-[#797979] transition-colors hover:border-neutral-500 hover:text-white"
            >
              <Website size={16} />
            </Link>
          )}
          {remix.socials?.twitter && (
            <Link
              href={remix.socials.twitter}
              target="_blank"
              className="flex size-[46px] shrink-0 items-center justify-center rounded-[8px] border border-[#313131] text-[#797979] transition-colors hover:border-neutral-500 hover:text-white"
            >
              <Twitter size={14} />
            </Link>
          )}
          {remix.socials?.tiktok && (
            <Link
              href={remix.socials.tiktok}
              target="_blank"
              className="flex size-[46px] shrink-0 items-center justify-center rounded-[8px] border border-[#313131] text-[#797979] transition-colors hover:border-neutral-500 hover:text-white"
            >
              <Tiktok size={14} />
            </Link>
          )}
          {remix.socials?.instagram && (
            <Link
              href={remix.socials.instagram}
              target="_blank"
              className="flex size-[46px] shrink-0 items-center justify-center rounded-[8px] border border-[#313131] text-[#797979] transition-colors hover:border-neutral-500 hover:text-white"
            >
              <Instagram size={14} />
            </Link>
          )}
          {remix.socials?.youtube && (
            <Link
              href={remix.socials.youtube}
              target="_blank"
              className="flex size-[46px] shrink-0 items-center justify-center rounded-[8px] border border-[#313131] text-[#797979] transition-colors hover:border-neutral-500 hover:text-white"
            >
              <Youtube size={16} />
            </Link>
          )}
          {remix.socials?.telegram && (
            <Link
              href={remix.socials.telegram}
              target="_blank"
              className="flex size-[46px] shrink-0 items-center justify-center rounded-[8px] border border-[#313131] text-[#797979] transition-colors hover:border-neutral-500 hover:text-white"
            >
              <TelegramAlt size={14} />
            </Link>
          )}
          <ProjectInfoButton remix={remix} />
          <TripleDotMenu remix={remix} />
        </div>
      </div>
    </div>
    <TokenImageViewerDialog open={tokenImageViewerOpen} onOpenChange={setTokenImageViewerOpen} remix={remix} />
    </>
  )
}

function isChestOpen(remix: Remix): boolean {
  const ip = remix.ip
  if (!ip) return false
  if (ip.type === "community") return remix.is_graduated === true
  return !!ip.owner_address
}

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

function OwnerTreasurePills({ remix }: { remix: Remix }) {
  const { metrics, isLoading: isMetricsLoading } = useTokenMetricsByAddressContext()
  const ip = remix.ip
  const chestOpen = isChestOpen(remix)
  const isCommunity = ip?.type === "community"
  const showChest = true
  const hasOwnerTag = !isCommunity && !!ip?.owner_account
  const ownerOnboarded = !!ip?.owner_address
  const hasLeftPill = hasOwnerTag
  const ownerUrl = ip?.owner_account ? getOwnerSocialUrl(ip.owner_account_type, ip.owner_account) : null
  const rewardChestUsd = metrics?.reward_chest_usd != null ? `$${formatNumberWithSuffix(metrics.reward_chest_usd)}` : `${formatNumberWithSuffix(remix?.reward_chest_usd || 0)}`

  const ownerPillClasses = cn(
    "flex items-center gap-1 rounded-l-[6px] border-[0.5px] border-[#484848] px-2 py-1",
    ownerOnboarded ? "bg-[rgba(90,90,103,0.4)]" : "bg-[rgba(90,90,103,0.4)]"
  )

  const handleColor = ownerOnboarded ? "text-[#b3b3b3]" : "text-[#797979]"

  const ownerPillContent = (
    <>
      {!ownerOnboarded && <OwnerWarning size={11} />}
      {ip?.owner_account_type === SOCIAL_TYPE.TWITTER && (
        <span className={handleColor}>
          <Twitter size={10} />
        </span>
      )}
      {ip?.owner_account_type === SOCIAL_TYPE.TIKTOK && (
        <span className={handleColor}>
          <Tiktok size={10} />
        </span>
      )}
      <span className={cn("text-xs font-bold", handleColor)}>{`@${extractHandle(ip?.owner_account ?? "")}`}</span>
    </>
  )

  return (
    <div className="font-sf-pro-rounded flex items-center gap-1.5">
      <div className="flex items-center">
        {hasOwnerTag ? (
          ownerUrl ? (
            <Link
              href={ownerUrl}
              target="_blank"
              className={cn(ownerPillClasses, "transition-colors hover:bg-[rgba(90,90,103,0.6)]")}
            >
              {ownerPillContent}
            </Link>
          ) : (
            <div className={ownerPillClasses}>{ownerPillContent}</div>
          )
        ) : null}

        {showChest && (
          <div
            className={cn(
              "flex items-center gap-1.5 border-[0.5px] border-[#484848] px-1.5 py-1",
              hasLeftPill ? "rounded-r-[6px] border-l-0" : "rounded-[6px]",
              chestOpen ? "bg-[rgba(90,90,103,0.2)] text-[#C093FF]" : "bg-[rgba(90,90,103,0.2)] text-[#494949]"
            )}
          >
            {chestOpen ? <TreasureChestFilled /> : <TreasureChestLocked size={12} />}
            <span className={cn("text-xs font-bold", chestOpen ? "text-[#C093FF]" : "text-[#494949]")}>
              {isMetricsLoading ? (
                <Skeleton className="h-3 w-8" />
              ) : rewardChestUsd}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

const ProjectInfoButton = ({ remix }: { remix: Remix }) => {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex size-[46px] shrink-0 cursor-pointer items-center justify-center rounded-[8px] border border-[#313131] text-[#797979] transition-colors hover:border-neutral-500 hover:text-white"
        aria-label="Project Info"
      >
        <Info size={16} />
      </button>
      <ProjectInfoModal open={open} onOpenChange={setOpen} remix={remix} />
    </>
  )
}

const TripleDotMenu = ({ remix }: { remix: Remix }) => {
  const reportTriggerRef = useRef<HTMLButtonElement>(null)

  const handleReportClick = () => {
    reportTriggerRef.current?.click()
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex size-[46px] rotate-90 cursor-pointer items-center justify-center text-[#797979] transition-colors hover:border-neutral-500 hover:text-white">
            <svg
              className="size-4"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="4"
              viewBox="0 0 16 4"
              fill="none"
            >
              <path d="M16 4L11.6364 4L11.6364 -3.81481e-07L16 0L16 4Z" fill="currentColor" />
              <path d="M10.1818 4L5.81818 4L5.81818 -8.90123e-07L10.1818 -5.08642e-07L10.1818 4Z" fill="currentColor" />
              <path d="M4.36364 4L0 4L5.24537e-07 -1.39876e-06L4.36364 -1.01728e-06L4.36364 4Z" fill="currentColor" />
            </svg>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="bottom"
          align="start"
          sideOffset={6}
          alignOffset={2}
          className="min-w-[200px] rounded-[12px]"
        >
          {remix.ip && !remix.ip?.is_verified && (
            <VerificationFormModal
              ip={remix.ip}
              trigger={
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault()
                  }}
                  className="cursor-pointer rounded-[8px]"
                >
                  <div className="flex items-center gap-2 text-white">
                    <BadgeCheck size={16} className="text-neutral-300" />
                    <span>Verify Ownership</span>
                  </div>
                </DropdownMenuItem>
              }
            />
          )}
          <DropdownMenuItem className="cursor-pointer rounded-[8px]">
            <StoryExplorerLink type="address" address={remix.token_address as Address}>
              <div className="flex w-full items-center gap-2">
                <Story size={16} />
                <span>Contract Details</span>
              </div>
            </StoryExplorerLink>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer rounded-[8px]" onClick={handleReportClick}>
            <div className="flex w-full items-center gap-2 text-red-500">
              <Flag size={16} />
              <span>Report</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ReportDialog
        topic="token"
        id={remix.id}
        currentIpId={remix.ip_id}
        trigger={<button ref={reportTriggerRef} className="hidden" />}
      />
    </>
  )
}

export default Header
