import Link from "next/link"
import { useMemo } from "react"
import { Address } from "viem"
import { spaceGrotesk } from "@/app/fonts/fonts"
import Image from "@/components/image"
import { Skeleton } from "@/components/ui/skeleton"
import { TableCell, TableRow } from "@/components/ui/table"
import { formatNumber, formatNumberWithSuffix } from "@/lib/number"
import { TokenMetrics } from "@/lib/schema/token-metrics-schema"
import { cn } from "@/lib/utils"
import { Remix } from "@/types/remix"
import ClaimBtn from "./claim-btn"
import HarvestBtn from "./harvest-btn"

const ManagementTableItem = ({
  remix,
  tokenMetric,
  rewards,
  reload,
  isLoading,
}: {
  remix: Remix
  tokenMetric: TokenMetrics
  rewards: {
    harvested: boolean
    vested: number
    total: number
    balance: number
    claimable: number
  }
  reload: () => void
  isLoading: boolean
}) => {
  const tokenPrice = useMemo(() => Number(tokenMetric?.price_usd ?? "0"), [tokenMetric])

  const vested = useMemo(() => rewards?.vested ?? 0, [rewards])
  const total = useMemo(() => rewards?.total ?? 0, [rewards])
  const vestedPercentage = useMemo(() => (total > 0 ? (vested / total) * 100 : 0), [vested, total])
  const balance = useMemo(() => rewards?.balance ?? 0, [rewards])
  const claimable = useMemo(() => rewards?.claimable ?? 0, [rewards])

  const earned = useMemo(() => parseInt(tokenMetric?.net_in_to_owner_vault || "0"), [tokenMetric])
  const claimed = useMemo(() => parseInt(tokenMetric?.net_out_from_owner_vault || "0"), [tokenMetric])

  return (
    <TableRow>
      <TableCell>
        <Link href={`/token/${remix.token_address}`}>
          <div className="flex items-center gap-1">
            <Image
              src={remix.image}
              alt={remix.name}
              width={48}
              height={48}
              className="aspect-square h-12 w-12 object-cover"
            />
            <div className="flex flex-col gap-1">
              <p className="text-brand">
                ${remix.symbol}
                <span className="ml-1 text-neutral-300">[{remix.name}]</span>
              </p>
              <p>{formatNumberWithSuffix(Number(tokenMetric?.total_market_cap_ip ?? "0"))} mcap</p>
            </div>
          </div>
        </Link>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <p className="font-semibold text-white">${formatNumber(earned * tokenPrice, 4, true)}</p>
          <p className="text-neutral-300">
            {formatNumberWithSuffix(earned)} ${remix.symbol}
          </p>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <p className="font-semibold text-white">${formatNumber(claimed * tokenPrice, 4, true)}</p>
          <p className="text-neutral-300">
            {formatNumberWithSuffix(claimed)} ${remix.symbol}
          </p>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <p className={cn("text-brand font-bold", spaceGrotesk.className)}>{formatNumber(vestedPercentage, 4)}%</p>
          <p>
            <span className="font-semibold">${formatNumber(vested * tokenPrice, 4, true)}</span>
            <span className="text-neutral-300">/${formatNumber(total * tokenPrice, 4, true)}</span>
          </p>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <p className="font-semibold text-white">
            {formatNumberWithSuffix(balance)} ${remix.symbol}
          </p>
          <p className="text-neutral-300">${formatNumber(balance * tokenPrice, 4, true)}</p>
        </div>
      </TableCell>
      <TableCell align="right">
        <div className="flex justify-end gap-2">
          <HarvestBtn tokenAddress={remix.token_address as Address} refetch={reload} />
          <div className="flex flex-col items-center gap-1">
            <ClaimBtn
              harvested={rewards?.harvested ?? false}
              tokenAddress={remix.token_address as Address}
              refetch={reload}
              claimableAmount={claimable}
              tokenSymbol={remix.symbol}
            />
            {isLoading ? (
              <Skeleton className="h-3 w-full" />
            ) : (
              <p className="text-brand h-3 text-xs">
                {rewards?.harvested ? formatNumberWithSuffix(claimable) : 0} available to claim
              </p>
            )}
          </div>
        </div>
      </TableCell>
    </TableRow>
  )
}

export default ManagementTableItem
