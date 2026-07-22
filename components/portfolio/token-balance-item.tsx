"use client"

import { getAuthToken } from "@dynamic-labs/sdk-react-core"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { favoriteRemixes, getIsRemixesFavorited, unFavoriteRemixes } from "@/actions/remix/favorite"
import Image from "@/components/image"
import { bigNumberToFloat } from "@/lib/bignumber"
import { formatNumber, formatNumberWithSuffix } from "@/lib/number"
import { Holding } from "@/types/holding"
import BracketAnimation from "../animation/bracket"
import { Skeleton } from "../ui/skeleton"
import { ArrowUpFill, Heart, HeartPlus } from "../icons"

const TokenBalanceItem = ({ holding }: { holding: Holding }) => {
  const router = useRouter()
  const [remixFavoriteStatus, setRemixFavoriteStatus] = useState(false)

  const value = useMemo(() => {
    // Convert amount from wei string to float using bigNumberToFloat
    const amountFloat = bigNumberToFloat(holding.amount, holding.decimals)
    return formatNumberWithSuffix(amountFloat)
  }, [holding.amount, holding.decimals])

  const usdValue = useMemo(() => {
    // Use holding.value directly as it's already the USD value
    return formatNumber(holding.value || 0, 2, true)
  }, [holding.value])

  async function isRemixesFavorited() {
    const { result } = await getIsRemixesFavorited(holding.token_address, getAuthToken())
    setRemixFavoriteStatus(result)
  }

  useEffect(() => {
    if (holding) {
      setRemixFavoriteStatus(holding?.favorited_remix)
    }
  }, [holding])

  const favorite = useCallback(async () => {
    await favoriteRemixes(holding.token_address, getAuthToken())
    await isRemixesFavorited()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holding])

  const unFavorite = useCallback(async () => {
    await unFavoriteRemixes(holding.token_address, getAuthToken())
    await isRemixesFavorited()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holding])

  return (
    <div
      className="group flex cursor-pointer items-center rounded-[10px] px-2 py-1 transition-colors hover:bg-neutral-800"
      onClick={() => {
        router.push(`/token/${holding.token_address}`)
      }}
    >
      {holding?.token_image ? (
        <Image
          src={holding.token_image}
          alt={holding.token_name}
          width={40}
          height={40}
          className="aspect-square w-10 rounded-[0.125rem] object-cover"
        />
      ) : (
        <Skeleton className="aspect-square h-10 w-10 rounded" />
      )}
      <div className="flex w-full justify-between py-1.5 pl-2">
        <div className="flex flex-col justify-center gap-1">
          <span>
            <BracketAnimation>{holding.token_name}</BracketAnimation>
            <span className="ms-1 text-neutral-300">
              <button
                onClick={() => (!remixFavoriteStatus ? favorite() : unFavorite())}
                className={`${!remixFavoriteStatus ? "opacity-0 group-hover:opacity-100" : "opacity-100"} cursor-pointer bg-transparent transition-opacity hover:text-neutral-200`}
              >
                {!remixFavoriteStatus ? <HeartPlus size={11} /> : <Heart size={11} />}
              </button>
            </span>
          </span>
          <p className="text-xs text-neutral-300">
            {value} ${holding.token_ticker}
          </p>
        </div>
        <div className="flex flex-col items-end justify-center gap-1">
          <div className="flex flex-col gap-1.5 items-end">
            <p className="text-end text-sm font-medium">${usdValue}</p>
            {holding?.market_cap_change ? (
              <>
                {holding?.market_cap_change > 0 ? (
                  <div className="text-green-neon flex items-center justify-center gap-1 text-sm font-normal">
                    <div>
                      {"+"}
                      {formatNumberWithSuffix(holding?.market_cap_change)}%
                    </div>
                  </div>
                ) : (
                  <div className="text-pink-neon flex items-center justify-center gap-1 text-sm font-normal">
                    <div>
                      {formatNumberWithSuffix(holding?.market_cap_change)}%
                    </div>
                  </div>
                )}
              </>
            ) : <div className="text-neutral-400">--</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TokenBalanceItem
