"use client"
import Image from "@/components/image"
import { formatTimeAgoShort } from "@/lib/strings"
import { Feed } from "@/types/feed"
import TiktokDialog from "./tiktok-dialog"
import { Eye, Heart, Flag, Logo } from "@/components/icons"
import { formatNumberWithSuffix, formatUSD } from "@/lib/number"
import ReportDialog from "@/components/dialog/report-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EllipsisVertical } from "lucide-react"
import { useState } from "react"
import Link from "next/link"

const TiktokEmbedCard = (feed: Feed) => {
  const [reportOpen, setReportOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleCardClick = (e: React.MouseEvent) => {
    const existingDialogOverlay = document.querySelector("[data-radix-dialog-overlay]")
    const existingDialogContent = document.querySelector("[data-radix-dialog-content]")
    if (existingDialogOverlay || existingDialogContent) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
  }

  return (
    <div className="flex w-full max-w-full min-w-0 cursor-pointer flex-col gap-3">
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
            href={`https://www.tiktok.com/@${feed.author_handle}`}
            target="_blank"
            onClick={(e: any) => e.stopPropagation()}
            className="truncate font-sf-pro-rounded text-[14px] font-bold leading-[14.6px] hover:underline"
          >
            @{feed.author_handle}
          </Link>
        </div>
        <div className="flex shrink-0 items-center gap-[18px]">
          <span className="font-sf-pro-rounded text-[14px] font-semibold leading-[14.6px] text-[#797979]">
            {formatTimeAgoShort(feed.created_at)}
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
          <ReportDialog topic="feed" id={feed.id} feedType="tiktok" open={reportOpen} onOpenChange={setReportOpen} />
        </div>
      </div>

      {/* Video thumbnail with overlaid stats */}
      <TiktokDialog
        trigger={
          <div
            className="tiktok-embed-wrapper relative flex w-full max-w-full cursor-pointer flex-col group"
            onClick={handleCardClick}
          >
            <div className="relative aspect-[1/1.54] w-full overflow-hidden rounded-[16px] border border-neutral-700 bg-white">
              <Image
                src={feed.dynamic_cover_url || ""}
                key={feed.dynamic_cover_url + "_" + feed.id}
                alt={feed.dynamic_cover_url + "_" + feed.id}
                fill
                className="z-0 object-cover"
              />
              {/* Play icon removed */}
              {/* Bottom overlay: payout left, stats right */}
              <div className="absolute right-3 bottom-3 left-3 flex items-end justify-between">
                {feed.ugc_payout ? (
                  <div className="rounded-[12px] bg-black/[0.42] px-[9px] py-2 font-sf-pro-rounded text-[14px] font-extrabold leading-[14.6px] text-white backdrop-blur-sm">
                    {formatUSD(feed.ugc_payout.summary.total_payout_usd)}
                  </div>
                ) : (
                  <div />
                )}
                <div className="flex items-center rounded-[12px] bg-black/[0.42] px-[9px] py-2 backdrop-blur-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-[3px]">
                      <span className="shrink-0 text-white" style={{ transform: "translateY(-1px)" }}><Eye size={11} /></span>
                      <span className="font-sf-pro-rounded text-[12px] font-bold leading-[12px] text-white">
                        {formatNumberWithSuffix(feed.play_count || 0)}
                      </span>
                    </div>
                    <div className="flex items-center gap-[3px]">
                      <span className="shrink-0 text-white" style={{ transform: 'translateY(-1px)' }}><Heart size={11} /></span>
                      <span className="font-sf-pro-rounded text-[12px] font-bold leading-[12px] text-white">
                        {formatNumberWithSuffix(feed.digg_count || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
        feed={feed}
      />
    </div>
  )
}

export default TiktokEmbedCard
