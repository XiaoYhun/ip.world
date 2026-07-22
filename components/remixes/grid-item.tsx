import { Heart } from "lucide-react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { Address } from "viem"
import Image from "@/components/image"
import { Crown, Community } from "../icons"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Remix } from "@/types/remix"
import BracketAnimation from "../animation/bracket"
import Copy from "../copy"
import Favorite from "../favorite"
import { TokenMarketcapFallback } from "../info/token-marketcap"
import { Clock, Comment, PlusFile } from "../icons"

const Timer = dynamic(() => import("../timer"))
const TokenMarketcap = dynamic(() => import("../info/token-marketcap"), {
  loading: () => <TokenMarketcapFallback />,
})

const RemixGridItem = ({
  data,
  noBorder,
  isIpOwner = false,
}: {
  data: Remix
  noBorder?: boolean
  isIpOwner?: boolean
}) => {
  return (
    <Link href={`/token/${data.token_address}`}>
      <div
        className={cn(
          "group bg-background relative w-full cursor-pointer break-inside-avoid overflow-hidden p-3 transition-all",
          !noBorder && "border-neutral-400 border"
        )}
      >
        <div className="relative z-10 flex gap-6">
          <div className="relative">
            <Image
              src={data.image}
              alt={data.name}
              width={132}
              height={132}
              className="aspect-square h-[132px] w-[132px] bg-black object-cover"
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute top-1.5 left-1.5 z-10 flex items-center justify-center rounded-[6px] bg-black/70 backdrop-blur-sm p-1">
                  {data.ip?.type === "creator" ? <Crown width={14} height={14} /> : <Community width={14} height={14} />}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {data.ip?.type === "creator" ? "Creator" : "Community"}
              </TooltipContent>
            </Tooltip>
          </div>
          {isIpOwner && (
            <div className="absolute bottom-1 left-1 z-20 flex h-6 gap-1 text-black">
              {/* <span className="flex items-center gap-1 bg-white p-1">
          <Burn size={14} />
          <span className={cn("text-xs font-bold", spaceGrotesk.className)}>10%</span>
        </span> */}
              <Favorite remix={data} size={14} defaultValue={data.is_liked ?? false} />
            </div>
          )}

          <div className="flex flex-1 flex-col gap-2.5">
            <div className="flex flex-col gap-1">
              <div className="flex w-full items-center justify-between">
                <span className="flex flex-1 items-center gap-2">
                  <span className="flex items-center">
                    <BracketAnimation>
                      <span className="inline-block max-w-28 truncate overflow-hidden">{data.name}</span>
                    </BracketAnimation>
                  </span>
                  <span className="flex flex-1 items-center gap-2 transition-opacity duration-200 hover:opacity-80">
                    <Copy copy={data.symbol} text={data.symbol} className="text-brand text-sm font-semibold" />
                  </span>
                </span>
                <p className="flex items-center gap-1 text-xs text-neutral-300">
                  <Clock size={12} />
                  <Timer startTime={data.created_at || ""} />
                </p>
              </div>
              <div className="flex flex-row items-center text-sm transition-all">
                <TokenMarketcap tokenAddress={data.token_address as Address} />
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <p className="text-neutral-200 line-clamp-2 text-sm font-normal">{data.description}</p>
              {data.is_liked && (
                <div className="text-brand flex gap-1 text-xs">
                  <Heart size={12} />
                  liked by IP owner
                </div>
              )}
              {data.is_endorsed && (
                <div className="animate-rainbow bg-brand-gradient bg-200% flex gap-1 bg-clip-text text-xs text-transparent">
                  <PlusFile size={12} />
                  created by IP owner
                </div>
              )}
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="flex gap-2">
                {/* {data.socials?.telegram && (
                  <Socials type={SOCIAL_TYPE.TELEGRAM} url={data.socials.telegram} size={14} />
                )}
                {data.socials?.twitter && <Socials type={SOCIAL_TYPE.TWITTER} url={data.socials.twitter} size={14} />}
                {data.socials?.tiktok && <Socials type={SOCIAL_TYPE.TIKTOK} url={data.socials.tiktok} size={14} />}
                {data.socials?.instagram && (
                  <Socials type={SOCIAL_TYPE.INSTAGRAM} url={data.socials.instagram} size={14} />
                )}
                {data.socials?.website && <Socials type={SOCIAL_TYPE.WEBSITE} url={data.socials.website} size={14} />} */}
              </span>
              {!!data.number_of_comments && (
                <span className="flex gap-1 text-xs text-neutral-300">
                  <Comment size={12} />
                  {data.number_of_comments} comments
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default RemixGridItem
