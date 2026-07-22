"use client"
import Link from "next/link"
import { useEffect } from "react"
import { Crown } from "@/components/icons"
import Image from "@/components/image"
import ListPagination from "@/components/list-pagination"
import { TableCell, TableHead, TableRow } from "@/components/ui/table"
import VirtualizedTableNoBorder from "@/components/ui/virtualized/virtualized-table-no-border"
import { formatBigNumber } from "@/lib/bignumber"
import { PAGINATION_LIMIT } from "@/lib/constants"
import { formatNumberWithSuffix } from "@/lib/number"
import { Holding } from "@/types/holding"

export type HoldingTableProps = {
  holdings: Holding[]
}

const HoldingsTable = ({
  setHolderCount,
  holdings,
  total,
  currentPage,
}: {
  setHolderCount: (count: number) => void
  holdings: Holding[]
  total: number
  currentPage: number
}) => {
  useEffect(() => {
    setHolderCount(total)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total])

  const totalPages = Math.ceil(total / PAGINATION_LIMIT)
  if (total === 0)
    return (
      <div className="flex w-full justify-center py-10">
        <p className="text-neutral-300">No holdings data</p>
      </div>
    )

  const renderItem = (holding: Holding) => {
    return (
      <>
        <TableCell className="!px-2 !py-2 md:px-0">
          <Link href={`/token/${holding?.token_address}`} className="flex w-fit cursor-pointer">
            <div className="flex h-16 flex-col items-start justify-start md:flex-row md:items-center md:gap-2">
              <Image
                src={holding?.token_image}
                alt={holding?.token_name}
                className="hidden aspect-square h-8 w-8 rounded-[10px] object-cover md:block"
                width={32}
                height={32}
              />
              <div>{holding?.token_name}</div>
              <div className="text-brand">${holding?.token_ticker}</div>
              <div className="md:hidden">
                {holding?.ip && (
                  <div className="flex items-center justify-start">
                    <div className="text-brand">
                      {holding?.ip?.type === "creator" && <Crown width={14} height={12} />}
                    </div>

                    <div className="text-sm font-normal">{holding?.ip?.title}</div>
                  </div>
                )}
              </div>
              <div className="font-mono text-[11px] text-neutral-400 md:hidden">
                Held{" "}
                {formatNumberWithSuffix(Number(formatBigNumber(String(holding?.amount), holding?.decimals)))}{" "}
                ${holding?.token_ticker}
              </div>
            </div>
          </Link>
        </TableCell>
        <TableCell className="hidden !py-2 md:table-cell">
          {holding?.ip && (
            <div className="flex h-8 items-center justify-start gap-2">
              <div className="text-brand">{holding?.ip?.type === "creator" && <Crown width={14} height={12} />}</div>

              <div className="text-sm font-normal">{holding?.ip?.title}</div>
            </div>
          )}
        </TableCell>
        <TableCell className="!py-2">
          <div className="flex flex-col md:flex-row">
            ${formatNumberWithSuffix(holding?.market_cap)}&nbsp;
            <span className={`${holding?.market_cap_change >= 0 ? "text-green" : "text-red"}`}>
              {holding?.market_cap_change >= 0 ? "+" : ""}
              {formatNumberWithSuffix(Math.round(holding?.market_cap_change))}%
            </span>
          </div>
        </TableCell>
        <TableCell className="!py-2">
          <div className="flex flex-col md:flex-row">
            ${formatNumberWithSuffix(holding?.volume)}&nbsp;
            <span className={`${holding?.volume_change >= 0 ? "text-green" : "text-red"}`}>
              {holding?.volume_change >= 0 ? "+" : ""}
              {formatNumberWithSuffix(Math.round(holding?.volume_change))}%
            </span>
          </div>
        </TableCell>
        <TableCell className="!py-2">
          <div className="flex flex-col md:flex-row">
            ${formatNumberWithSuffix(holding?.liquidity)}&nbsp;
            <span className={`${holding?.liquidity_change >= 0 ? "text-green" : "text-red"}`}>
              {holding?.liquidity_change >= 0 ? "+" : ""}
              {formatNumberWithSuffix(Math.round(holding?.liquidity_change))}%
            </span>
          </div>
        </TableCell>
        <TableCell className="hidden !py-2 md:table-cell">
          {formatNumberWithSuffix(Number(formatBigNumber(String(holding?.amount), holding?.decimals)))} $
          {holding?.token_ticker}
        </TableCell>
        <TableCell className="!py-2">${formatNumberWithSuffix(Number(holding?.value))}</TableCell>
      </>
    )
  }

  return (
    <div className="virtualized w-full">
      <VirtualizedTableNoBorder
        data={holdings}
        renderItem={renderItem}
        header={
          <TableRow className="bg-black!">
            <TableHead className="!px-2 text-left text-[0.8125rem] text-neutral-300 uppercase md:px-4.5">
              <div className="flex">
                Token
                <span className="md:hidden">/Ip</span>
              </div>
            </TableHead>
            <TableHead className="hidden py-6 text-left text-[0.8125rem] text-neutral-300 uppercase md:block">
              Ip
            </TableHead>
            <TableHead className="text-left text-[0.8125rem] text-neutral-300 uppercase">Mcap</TableHead>
            <TableHead className="flex items-center text-left text-[0.8125rem] text-neutral-300 uppercase">
              Vol
              <span className="hidden md:block">(24h)</span>
            </TableHead>
            <TableHead className="text-left text-[0.8125rem] text-neutral-300 uppercase">
              <span className="hidden md:block">Liquidity</span>
              <span className="md:hidden">Liq</span>
            </TableHead>
            <TableHead className="hidden text-left text-[0.8125rem] text-neutral-300 uppercase md:block">Held</TableHead>
            <TableHead className="text-left text-[0.8125rem] text-neutral-300 uppercase">Value</TableHead>
          </TableRow>
        }
      />
      {totalPages > 1 && (
        <ListPagination currentPage={currentPage} totalPages={totalPages} pageParamsName={"holdings_page"} />
      )}
    </div>
  )
}

export default HoldingsTable
