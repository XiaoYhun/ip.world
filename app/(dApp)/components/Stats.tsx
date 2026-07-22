"use client"

import { useMemo } from "react"
import { Ip } from "@/types/ip"
import { Remixes, MCap, Holders, Virality, Eye } from "@/components/icons"
import { cn } from "@/lib/utils"
import { geistMono, spaceGrotesk } from "@/app/fonts/fonts"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import VisualizedDelta from "@/components/visualized-delta"
import { formatNumberWithSuffix } from "@/lib/number"
import BigNumber from "bignumber.js"

const Stats = ({
  ip,
  isDocked = false,
  isMobile = false,
  onClick,
}: {
  ip: Ip
  isDocked?: boolean
  isMobile?: boolean
  onClick?: (label: string) => void
}) => {
  const remixes = useMemo(() => {
    return {
      icon: <Remixes size={isDocked && !isMobile ? 16 : 12} />,
      label: "Tokens",
      value: ip.remixes_count,
      percentageChange: 28.1,
      duration: 7,
    }
  }, [ip.remixes_count, isDocked, isMobile])

  const mcap = useMemo(() => {
    return {
      icon: <MCap size={isDocked && !isMobile ? 16 : 12} />,
      label: "MCAP",
      value: ip.market_cap,
      percentageChange: 28.1,
      duration: 7,
      dollar: true,
    }
  }, [ip.market_cap, isDocked, isMobile])

  const holders = useMemo(() => {
    return {
      icon: <Holders size={isDocked && !isMobile ? 16 : 12} />,
      label: "Holders",
      value: ip.total_holder_count,
      percentageChange: 28.1,
      duration: 7,
    }
  }, [ip.total_holder_count, isDocked, isMobile])

  const virality = useMemo(() => {
    return {
      icon: <Virality width={isDocked ? 26 : 82} height={isDocked ? 17 : 49} />,
      label: "Virality",
      value: Math.round(ip.viral_score || 0),
      percentageChange: 28.1,
      duration: 7,
    }
  }, [ip.viral_score, isDocked])

  const impression = useMemo(() => {
    return {
      icon: <Eye size={isDocked && !isMobile ? 16 : 12} />,
      label: "Impressions",
      value: Math.round(ip.total_impressions || 0),
      percentageChange: 28.1,
      duration: 7,
    }
  }, [ip.total_impressions, isDocked, isMobile])

  return (
    <div className="text-neutral-200 bg-neutral-2000 z-1 mx-4 flex h-[48px] justify-between gap-2 rounded-[12px] px-2 py-2 md:mx-0 md:gap-8 md:px-0 md:py-0 lg:h-auto lg:rounded-none lg:bg-transparent">
      <div className={cn("flex flex-row items-center gap-4 lg:gap-8", isDocked && "flex-row")}>
        <StatsItem data={mcap} isDocked={isDocked} numberClassName={cn(geistMono.className)} />
        <StatsItem data={impression} isDocked={isDocked} numberClassName={cn(geistMono.className)} />
        <StatsItem data={holders} isDocked={isDocked} numberClassName={cn(geistMono.className)} />

        {isMobile && <StatsItem data={remixes} isDocked={isDocked} numberClassName={cn(geistMono.className)} />}
      </div>
      <div className={cn("flex flex-row items-center gap-4 lg:gap-8", isDocked && "flex-row")}>
        {!isMobile && <StatsItem data={remixes} isDocked={isDocked} numberClassName={cn(geistMono.className)} />}
      </div>
    </div>
  )
}

export type StatsItem = {
  icon?: React.ReactNode
  label: string
  value: number
  percentageChange: number
  duration: number
  dollar?: boolean
  overlap?: boolean
}

const StatsItem = ({
  data,
  isDocked = false,
  onClick,
  numberClassName,
}: {
  data: StatsItem
  isDocked?: boolean
  onClick?: (label: string) => void
  numberClassName?: string
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-1.5",
        isDocked && "flex-row items-center",
        onClick && "cursor-pointer"
      )}
      onClick={() => onClick?.(data.label)}
    >
      <div className="hidden items-center gap-1 lg:flex">
        <span className={cn("text-neutral-200 transition-all duration-100", isDocked && "text-white")}>{data.icon}</span>
        <p
          className={cn(
            spaceGrotesk.className,
            "text-neutral-200 mt-0.5 text-xs transition-all duration-100",
            isDocked && "hidden"
          )}
        >
          {data.label}
        </p>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex cursor-pointer items-baseline gap-2 text-white md:items-center lg:gap-1">
            <span className={cn("text-md transition-all duration-100 lg:hidden")}>{data.icon}</span>
            <p
              className={cn(
                "transition-font text-sm font-medium duration-300 ease-in-out md:text-base",
                isDocked && "!text-md",
                numberClassName
              )}
            >
              <VisualizedDelta scramble dollar={data.dollar}>
                {formatNumberWithSuffix(data.value)}
              </VisualizedDelta>
            </p>
          </span>
        </TooltipTrigger>
        <TooltipContent className="border border-neutral-2000 bg-neutral-800 text-white [&_.bg-primary]:bg-neutral-800 [&_.fill-primary]:fill-neutral-800">
          <VisualizedDelta scramble dollar={data.dollar}>
            {new BigNumber(data.value).toFormat()}
          </VisualizedDelta>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

export default Stats
