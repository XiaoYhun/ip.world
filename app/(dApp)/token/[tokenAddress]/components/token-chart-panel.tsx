"use client"

import dynamic from "next/dynamic"
import { formatNumberWithSuffix, formatNumberWithSuperscriptZeros } from "@/lib/number"
import AnimatedNumber from "@/components/animated-number"
import BondingCurve from "@/components/bonding-curve/bonding-curve"
import { useMemo } from "react"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

const TradingView = dynamic(() => import("@/components/trading-view"), { ssr: false })
const CoinGeckoTradingView = dynamic(() => import("@/components/coingecko-tradingview"), { ssr: false })

interface TokenChartPanelProps {
  variant: "owner" | "viewer"
  displayMarketCap: number
  displayMarketCapChange: number
  displayLiquidity: number
  displayGraduationProgress: number
  priceUsd: number
  useCoinGeckoChart: boolean
  tokenAddress: string
  tokenSymbol: string
  holderCount?: number
  communityRewardAmount?: number
  creator?: string
  tokenCreatorDisplay?: string | null
  tokenAge?: string
  description?: string | null
}

export function TokenChartPanel({
  variant,
  displayMarketCap,
  displayMarketCapChange,
  displayLiquidity,
  displayGraduationProgress,
  priceUsd,
  useCoinGeckoChart,
  tokenAddress,
  tokenSymbol,
  holderCount,
}: TokenChartPanelProps) {
  const marketCapDisplay = useMemo(() => formatNumberWithSuffix(displayMarketCap), [displayMarketCap])
  const marketCapChangeDisplay = useMemo(
    () => `${displayMarketCapChange >= 0 ? "+" : ""}${formatNumberWithSuffix(displayMarketCapChange)}%`,
    [displayMarketCapChange]
  )
  const liquidityDisplay = useMemo(() => formatNumberWithSuffix(displayLiquidity), [displayLiquidity])
  const priceDisplay = useMemo(
    () => (priceUsd > 0 ? formatNumberWithSuperscriptZeros(priceUsd) : "—"),
    [priceUsd]
  )
  const holdersDisplay = useMemo(() => formatNumberWithSuffix(holderCount ?? 0), [holderCount])

  const content = (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-start gap-4 pt-0 pb-0 pl-2">
        <div className="flex flex-col">
          <div className="text-[12px] font-medium leading-[13px] text-neutral-300">Market Cap</div>
          <AnimatedNumber
            value={marketCapDisplay}
            prefix="$"
            className="font-sf-pro-rounded mt-0.5 text-2xl leading-[28px] font-black text-white"
            animateDuration={1400}
          />
          <div className="mt-px flex items-center gap-1 font-mono text-[12px] font-medium leading-[13px]">
            <AnimatedNumber
              value={marketCapChangeDisplay}
              className={displayMarketCapChange >= 0 ? "text-green-neon" : "text-pink-neon"}
              delay={1000}
              animateDuration={1600}
            />
            <span className="text-neutral-300">24hr</span>
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-start gap-x-12 gap-y-4">
          <div className="flex gap-12">
            <div className="flex flex-col">
              <div className="text-[12px] font-medium leading-[13px] text-neutral-300">Liquidity</div>
              <AnimatedNumber
                value={liquidityDisplay}
                prefix="$"
                className="font-sf-pro-rounded mt-2 text-[18px] font-bold leading-[22px] text-white"
                delay={1200}
              />
            </div>
            <div className="flex flex-col">
              <div className="text-[12px] font-medium leading-[13px] text-neutral-300">Price</div>
              <AnimatedNumber
                value={priceDisplay}
                className="font-sf-pro-rounded mt-2 text-[18px] font-bold leading-[22px] text-white"
                delay={1400}
              />
            </div>
            <div className="flex flex-col">
              <div className="text-[12px] font-medium leading-[13px] text-neutral-300">Holders</div>
              <AnimatedNumber
                value={holdersDisplay}
                className="font-sf-pro-rounded mt-2 text-[18px] font-bold leading-[22px] text-white"
                delay={1600}
              />
            </div>
          </div>
          <div className="flex w-[200px] flex-col">
            <div className="text-[12px] font-medium leading-[13px] text-neutral-300">Graduation</div>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="mt-3.5 cursor-help">
                  <BondingCurve
                    value={displayGraduationProgress}
                    barHeight={10}
                    className="gap-0.5 text-xs"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={2}>
                {displayGraduationProgress >= 100
                  ? "Coin successfully graduated"
                  : `${Math.round(100 - displayGraduationProgress)}% away from graduation`}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {useCoinGeckoChart ? (
          <CoinGeckoTradingView tokenAddress={tokenAddress} />
        ) : (
          <TradingView tokenAddress={tokenAddress} tokenSymbol={tokenSymbol} />
        )}
      </div>
    </div>
  )

  if (variant === "owner") {
    return (
      <div className="h-[660px] w-full overflow-auto pl-6 pr-3">
        {content}
      </div>
    )
  }

  return (
    <div className="h-[660px] w-full overflow-auto pl-6 pr-3">
      {content}
    </div>
  )
}
