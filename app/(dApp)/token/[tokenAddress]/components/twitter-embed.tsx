"use client"
import Image from "@/components/image"
import { Feed } from "@/types/feed"
import { Eye, Heart, Flag, Logo } from "@/components/icons"
import { formatNumberWithSuffix, formatUSD } from "@/lib/number"
import ReportDialog from "@/components/dialog/report-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EllipsisVertical } from "lucide-react"
import { useState } from "react"
import { Remix } from "@/types/remix"
import TimeAgoShort from "@/components/time-ago-short"
import { cn } from "@/lib/utils"
import Link from "next/link"

const TwitterEmbedCard = ({ remix, ...feed }: Feed & { remix?: Remix }) => {
  const [reportOpen, setReportOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const hasMedia = (feed.media?.images?.length ?? 0) > 0 || (feed.media?.videos?.length ?? 0) > 0

  return (
    <div
      className="group flex w-full max-w-full min-w-0 cursor-pointer flex-col gap-3"
      onClick={() =>
        window.open(`https://x.com/${feed.author_handle}/status/${feed.uid}`, "_blank", "noopener,noreferrer")
      }
    >
      {/* Header — no background, blends into page */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative shrink-0" style={{ width: 32, height: 32 }}>
            <div className="relative overflow-hidden rounded-full border border-white/40 bg-white" style={{ width: 32, height: 32 }}>
              <Image src={feed.author_avatar || ""} alt={feed.author_handle} fill className="object-cover" />
            </div>
            {feed.ugc_payout && (
              <div className="absolute -right-0.5 -bottom-0.5 flex items-center justify-center rounded-[4.6px] border border-black/10 bg-white p-[3px] shadow-[0px_4px_4px_-1px_rgba(12,12,13,0.05),0px_4px_4px_-1px_rgba(12,12,13,0.1)]">
                <span className="text-[#321F4D]">
                  <Logo size={8} />
                </span>
              </div>
            )}
          </div>
          <Link
            href={`https://x.com/${feed.author_handle}`}
            target="_blank"
            className="truncate font-sf-pro-rounded text-[14px] font-bold leading-[14.6px] hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            @{feed.author_handle}
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-[18px]">
          <span className="font-sf-pro-rounded text-[14px] font-semibold leading-[14.6px] text-[#797979]">
            <TimeAgoShort dateString={feed.created_at} />
          </span>
          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center justify-center text-[#797979] hover:text-white"
                onClick={(e) => e.stopPropagation()}
              >
                <EllipsisVertical size={14} className="rotate-90" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-[12px]">
              <DropdownMenuItem
                className="cursor-pointer rounded-[8px]"
                onClick={() => {
                  setDropdownOpen(false)
                  setReportOpen(true)
                }}
              >
                <div className="flex w-full items-center gap-2 text-red-500">
                  <Flag size={16} />
                  <span>Report</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ReportDialog topic="feed" id={feed.id} feedType="x" open={reportOpen} onOpenChange={setReportOpen} />
        </div>
      </div>

      {/* Content block — has background and border */}
      <div className="flex flex-col gap-6 rounded-[16px] border border-neutral-700 bg-[#121212] px-3 py-3">
        {/* Body text */}
        {feed.body_text && (
          <p className="font-sf-pro-rounded text-[13px] font-medium leading-[1.45] text-white/90 wrap-break-word">{feed.body_text}</p>
        )}

        {/* Media */}
        {hasMedia && (
          <div
            className={cn(
              "-my-1.5 grid grid-cols-1 gap-2 overflow-hidden rounded-[12px]",
              (feed.media?.images?.length ?? 0) + (feed.media?.videos?.length ?? 0) >= 4 && "grid-cols-2"
            )}
          >
            {feed.media?.images?.map((image, key) => (
              <Image
                key={image + "_" + key}
                src={image}
                alt={image}
                width={328}
                height={185}
                className="aspect-328/185! w-full object-cover"
              />
            ))}
            {feed.media?.videos?.map((video, key) => (
              <video
                key={video + "_" + key}
                className="aspect-328/185! object-cover"
                muted
                controls
                playsInline
                preload="auto"
                onClick={(e) => e.stopPropagation()}
              >
                <source src={video} type="video/mp4" />
              </video>
            ))}
          </div>
        )}

        {/* Footer: payout + stats */}
        <div className="flex items-center justify-between">
          {feed.ugc_payout ? (
            <div className="rounded-[12px] bg-[#242424] px-[9px] py-2 font-sf-pro-rounded text-[12px] font-extrabold leading-[13px]">
              {formatUSD(feed.ugc_payout.summary.total_payout_usd)}
            </div>
          ) : (
            <div />
          )}
          <div className="flex items-center rounded-[12px] bg-[#242424] px-[9px] py-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-[3px]">
                <span className="shrink-0 text-white" style={{ transform: "translateY(-1px)" }}><Eye size={11} /></span>
                <span className="font-sf-pro-rounded text-[12px] font-bold leading-[12px] text-white">
                  {formatNumberWithSuffix(feed.views_count || 0)}
                </span>
              </div>
              <div className="flex items-center gap-[3px]">
                <span className="shrink-0 text-white" style={{ transform: 'translateY(-1px)' }}><Heart size={11} /></span>
                <span className="font-sf-pro-rounded text-[12px] font-bold leading-[12px] text-white">
                  {formatNumberWithSuffix(feed.likes_count || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TwitterEmbedCard
