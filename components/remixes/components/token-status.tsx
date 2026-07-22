import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import VisualizedDelta from "@/components/visualized-delta"
import { useTokenMetricsLive } from "@/hooks/use-token-metrics"
import { formatNumberWithSuffix, formatNumberWithSuperscriptZeros } from "@/lib/number"
import { DollarFill, Person, Transaction } from "@/components/icons"

const TokenStatus = ({ tokenAddress }: { tokenAddress: string }) => {
  const metrics = useTokenMetricsLive(tokenAddress)

  const displayMarketCap = metrics?.total_market_cap_usd
    ? formatNumberWithSuffix(parseInt(metrics.total_market_cap_usd, 10))
    : "n/a"

  return (
    <div className="bg-neutral-2000 flex flex-col text-white transition-all duration-500">
      <div className="flex h-11 items-center justify-between gap-2 px-[15px] text-sm">
        <Tooltip>
          <TooltipTrigger>
            <div className="text-brand">
              <VisualizedDelta dollar>{displayMarketCap}</VisualizedDelta>
            </div>
          </TooltipTrigger>
          <TooltipContent>Market Cap</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center gap-1">
              <DollarFill size={12} />
              <VisualizedDelta dollar>{formatNumberWithSuperscriptZeros(metrics?.price_usd || "0")}</VisualizedDelta>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Price</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center gap-1">
              <Person size={14} />
              <VisualizedDelta>{metrics?.holder_count?.toString() ?? "-"}</VisualizedDelta>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Holders</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center gap-1">
              <Transaction size={14} />
              <VisualizedDelta>{metrics?.tx_count?.toString() ?? "-"}</VisualizedDelta>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Transactions</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

export default TokenStatus
