"use client"

import { getAuthToken, useIsLoggedIn } from "@dynamic-labs/sdk-react-core"
import { useCallback, useEffect, useState } from "react"
import { favoriteIp, getIsIpFavorited, unFavoriteIp } from "@/actions/ip/favorite"
import ViralityScore from "@/components/virality-score"
import Image from "@/components/image"
import { useSidebar } from "@/context/sidebar-context"
import { formatNumberWithSuffix } from "@/lib/number"
import { cn } from "@/lib/utils"
import { Ip } from "@/types/ip"
import { Coin, Community, Crown, Eye, Holders, PersonLiked, PersonPlus, Shuffle, ShuffleAlt } from "./icons"
import { truncateAddress } from "@/lib/strings"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"

const IpListItem = ({ ip, onClick }: { ip: Ip; onClick?: () => void }) => {
  const [ipFavoriteStatus, setIpFavoriteStatus] = useState(false)
  const { onFavoriteChange } = useSidebar()

  const isLoggedIn = useIsLoggedIn()

  async function isIpFavorited() {
    const { result } = await getIsIpFavorited(ip.id, getAuthToken())

    setIpFavoriteStatus(result)
  }

  useEffect(() => {
    if (ip && isLoggedIn) {
      isIpFavorited()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ip, isLoggedIn])

  const favorite = useCallback(async () => {
    await favoriteIp(ip.id, getAuthToken())
    await isIpFavorited()
    onFavoriteChange("ip", true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ip.id])

  const unFavorite = useCallback(async () => {
    await unFavoriteIp(ip.id, getAuthToken())
    await isIpFavorited()
    onFavoriteChange("ip", false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ip.id])

  return (
    <div
      className={cn(
        "flex cursor-pointer items-center gap-4 rounded-[12px] border-y border-transparent px-1.5 py-1 transition-all duration-200 hover:bg-neutral-600"
        // isLoggedIn && "pr-4 pl-9"
      )}
      onClick={() => onClick?.()}
    >
      {/* {isLoggedIn && (
        <span
          className={`hover:text-white ${ipFavoriteStatus ? "text-white" : "text-neutral-300"}`}
          onClick={(e) => {
            e.stopPropagation()
            if (!ipFavoriteStatus) {
              favorite()
            } else {
              unFavorite()
            }
          }}
        >
          {ipFavoriteStatus ? <PersonLiked /> : <PersonPlus />}
        </span>
      )} */}

      <div className="flex flex-1 items-center gap-1.5">
        {!!ip.image && (
          <Image
            src={ip.image}
            alt={ip.title}
            width={40}
            height={40}
            className="aspect-square h-10 w-10 rounded-[8px] object-cover"
          />
        )}

        <div className="flex w-full justify-between">
          <div className="flex w-[40%] flex-col justify-center gap-1">
            <div className="flex flex-col gap-1">
              <span className="flex items-center gap-1 text-sm font-medium">
                <span className="max-w-[50%] truncate">{ip.title}</span>
                {ip.type === "creator" ? (
                  <>
                    <Crown width={12} height={12} />
                  </>
                ) : (
                  <>
                    <Community width={12} height={12} />
                  </>
                )}
              </span>
              <span className="text-xs font-medium text-neutral-100">
                @{ip.owner_account || (ip.creator ? truncateAddress(ip.creator) : "")}
              </span>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center gap-4 font-mono">
            <Tooltip>
              <TooltipTrigger>
                <div className="flex cursor-pointer items-center gap-1 text-white">
                  <span className="text-neutral-300">
                    <Eye size={12} />
                  </span>
                  <div className="text-[0.875em] font-medium">{formatNumberWithSuffix(ip.total_impressions)}</div>
                </div>
              </TooltipTrigger>
              <TooltipContent
                collisionPadding={64}
                arrow={false}
                className="border border-neutral-500 bg-neutral-800 text-white [&_.bg-primary]:bg-neutral-800 [&_.fill-primary]:fill-neutral-800"
              >
                <p className="text-[0.875em] font-medium">
                  {formatNumberWithSuffix(ip.total_impressions)} Total Impressions
                </p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger>
                <div className="flex cursor-pointer items-center gap-1 text-white">
                  <span className="text-neutral-300">
                    <Coin size={12} />
                  </span>
                  <div className="text-[0.875em] font-medium">${formatNumberWithSuffix(ip.market_cap)}</div>
                </div>
              </TooltipTrigger>
              <TooltipContent
                collisionPadding={64}
                arrow={false}
                className="border-neutral-2000 border bg-neutral-800 text-white [&_.bg-primary]:bg-neutral-800 [&_.fill-primary]:fill-neutral-800"
              >
                <p className="text-[0.875em] font-medium">
                  {formatNumberWithSuffix(ip.market_cap)} Combined Market Cap
                </p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger>
                <div className="flex cursor-pointer items-center gap-1 text-white">
                  <span className="text-neutral-300">
                    <Holders size={11} />
                  </span>
                  <div className="text-[0.875em] font-medium">{formatNumberWithSuffix(ip.total_holder_count)}</div>
                </div>
              </TooltipTrigger>
              <TooltipContent
                collisionPadding={64}
                arrow={false}
                className="border-neutral-2000 border bg-neutral-800 text-white [&_.bg-primary]:bg-neutral-800 [&_.fill-primary]:fill-neutral-800"
              >
                <p className="text-[0.875em] font-medium">
                  {formatNumberWithSuffix(ip.total_holder_count)} Total Holders
                </p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger>
                <div className="flex cursor-pointer items-center gap-1 text-white">
                  <span className="text-neutral-300">
                    <ShuffleAlt size={12} />
                  </span>
                  <div className="text-[0.875em] font-medium">{formatNumberWithSuffix(ip.remixes_count)}</div>
                </div>
              </TooltipTrigger>
              <TooltipContent
                collisionPadding={64}
                arrow={false}
                className="border-neutral-2000 border bg-neutral-800 text-white [&_.bg-primary]:bg-neutral-800 [&_.fill-primary]:fill-neutral-800"
              >
                <p className="text-[0.875em] font-medium">
                  {formatNumberWithSuffix(ip.remixes_count)} Total Token Remixes
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="group relative flex w-[100px]! items-center justify-end self-end pr-1 *:shrink-0">
            {ip.remixes?.slice(0, 4).map((remix, index) => {
              const count = ip.remixes?.slice(0, 4)?.length ?? 0

              return (
                <div
                  key={remix.id}
                  className="border-background! relative size-8 origin-center translate-x-[calc(var(--offset)*20)] cursor-pointer overflow-hidden rounded-full border-2 transition-transform duration-200 ease-out group-hover:translate-x-[calc(var(--offset)*15)] hover:z-10! hover:-translate-y-0.5"
                  style={
                    {
                      zIndex: 5 - index,
                      // base overlap
                      "--offset": `${count - 1 - index}px`,
                    } as React.CSSProperties
                  }
                >
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="relative size-8 cursor-pointer overflow-hidden rounded-full">
                        <Image src={remix.image} alt={remix.name} fill className="rounded-full" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent
                      arrow={false}
                      side="top"
                      align="center"
                      alignOffset={20}
                      sideOffset={10}
                      className="flex flex-col items-center gap-1 border border-neutral-600 bg-neutral-800 text-white [&_.bg-primary]:bg-neutral-800 [&_.fill-primary]:fill-neutral-800"
                    >
                      <p className="text-sm font-semibold text-neutral-200">${remix.symbol}</p>
                      <span
                        className={cn(
                          "text-xs font-medium",
                          remix.market_cap_change >= 0 ? "text-green-neon" : "text-pink-neon"
                        )}
                      >
                        {remix.market_cap_change > 0 ? "+" : ""}
                        {formatNumberWithSuffix(remix.market_cap_change, 2)}%
                      </span>
                    </TooltipContent>
                  </Tooltip>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default IpListItem
