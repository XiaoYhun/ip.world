"use client"

import dynamic from "next/dynamic"
import { useEffect, useMemo, useRef, useState } from "react"
import { Swap as SwapIcon } from "@/components/icons"
import { cn } from "@/lib/utils"
import { Remix } from "@/types/remix"
import type { SwapRow } from "@/hooks/use-token-swaps"
import Transactions from "./transactions/transactions"
import { Community, Crown, User, TimerZero, Comment } from "@/components/icons"
import { Info } from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import Feeds from "./components/feeds"
import type { TokenFeedFiltersState } from "./components/feed-filters-panel"
import Holders from "./holders"
import { Ip } from "@/types/ip"
import Comments from "./comments/comments"
import { HowItWorksModal } from "./components/how-it-works-modal"

const Proposals = dynamic(() => import("./proposals/proposals"), {
  loading: () => (
    <div className="flex items-center justify-center py-12">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#494949] border-t-white" />
    </div>
  ),
})

interface ViewOption {
  key: string
  label: string
  icon: React.ReactNode
  disabled?: boolean
}

const TokenData = ({
  remix,
  swaps,
  feedFilters,
}: {
  remix: Remix
  swaps: SwapRow[]
  feedFilters?: TokenFeedFiltersState
}) => {
  const tabsRef = useRef<(HTMLElement | null)[]>([])
  const [activeTabIndex, setActiveTabIndex] = useState<string>("feed")
  const [howItWorksModalOpen, setHowItWorksModalOpen] = useState(false)

  useEffect(() => {
    const handler = () => setHowItWorksModalOpen(true)
    window.addEventListener("open-how-it-works-modal", handler)
    return () => window.removeEventListener("open-how-it-works-modal", handler)
  }, [])

  const ip = remix.ip as Ip | undefined
  const isIpVerified = ip?.is_verified === true

  const viewOptions: ViewOption[] = useMemo(
    () => [
      { key: "feed", label: "Feed", icon: <TimerZero /> },
      { key: "holders", label: "Holders", icon: <Crown /> },
      {
        key: "transactions",
        label: "Transactions",
        icon: <SwapIcon />,
      },
      {
        key: "comments",
        label: "Comments",
        icon: <Comment />,
      },
      { key: "proposals", label: "Treasury", icon: <Community />, disabled: !isIpVerified },
    ],
    [isIpVerified]
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-background sticky top-14 z-20 -m-3 w-full pl-9 py-3 pr-0">
        <div className="flex w-full items-center gap-1 overflow-hidden rounded-[16px] border border-neutral-600! bg-neutral-800/90! px-4 py-3">
          {viewOptions.map((option, index) => {
            const isActive = activeTabIndex === option.key
            return (
              <div
                key={`view-option-${option.key}`}
                onClick={() => {
                  if (!option.disabled) setActiveTabIndex(option.key)
                }}
                ref={(el) => {
                  tabsRef.current[index] = el
                }}
                title={option.disabled ? "IP must be verified to view proposals" : undefined}
                className={cn(
                  "flex min-w-0 cursor-pointer items-center gap-1 rounded-[12px] p-3 text-base capitalize",
                  isActive ? "bg-neutral-500/50! text-white" : "bg-transparent text-neutral-300",
                  option.disabled && "cursor-not-allowed opacity-40"
                )}
              >
                {option.icon}
                <span className="hidden truncate lg:inline">{option.label}</span>
                {option.key === "proposals" && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="hidden lg:inline-flex opacity-40 hover:opacity-100 transition-opacity cursor-help -mt-px">
                        <Info size={13} className="text-current" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" sideOffset={6}>
                      Holders can propose and vote on how treasury funds are used for community activities
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            )
          })}
          <button
            onClick={() => setHowItWorksModalOpen(true)}
            className="ml-auto flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-[10px] bg-[#dfcdf9] px-3 py-2 transition-colors hover:bg-[#d4bff5]"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M1.16667 7C1.16667 3.77834 3.77834 1.16667 7 1.16667C10.2216 1.16667 12.8333 3.77834 12.8333 7C12.8333 10.2216 10.2216 12.8333 7 12.8333C3.77834 12.8333 1.16667 10.2216 1.16667 7ZM7 0C3.134 0 0 3.134 0 7C0 10.866 3.134 14 7 14C10.866 14 14 10.866 14 7C14 3.134 10.866 0 7 0ZM7.58333 2.91667V4.08333H6.41667V2.91667H7.58333ZM6.41667 6.41667H5.25V5.25H7.58333V9.33333H8.75V10.5H5.25V9.33333H6.41667V6.41667Z" fill="#321F4D" />
            </svg>
            <span className="text-sm font-medium text-[#321f4d]">How it works</span>
          </button>
        </div>
      </div>
      <div className="hidden md:block">
        {activeTabIndex === "feed" ? (
          <Feeds ip={remix.ip as Ip} remix={remix} feedFilters={feedFilters} hideInlineFilters={Boolean(feedFilters)} />
        ) : activeTabIndex === "holders" ? (
          <Holders />
        ) : activeTabIndex === "transactions" ? (
          <Transactions
            remix={remix}
            swaps={swaps}
          />
        ) : activeTabIndex === "comments" ? (
          <Comments remix={remix} />
        ) : activeTabIndex === "proposals" && ip ? (
          <Proposals remix={remix} ip={ip} />
        ) : null}
      </div>
      <HowItWorksModal
        open={howItWorksModalOpen}
        onClose={() => setHowItWorksModalOpen(false)}
        remix={remix}
        ip={ip}
      />
    </div>
  )
}

export default TokenData
