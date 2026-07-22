import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import Image from "@/components/image"
import IpBadge from "@/components/ip-badge"
import { Crown, Community } from "../icons"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Remix } from "@/types/remix"
import TokenStatus from "./components/token-status"
import BracketAnimation from "../animation/bracket"
import Copy from "../copy"
import { SOCIAL_TYPE } from "../socials"
import Socials from "../socials"
import { Clock, Comment } from "../icons"

const Timer = dynamic(() => import("../timer"))

const RemixCompactGridItem = ({ remix }: { remix: Remix }) => {
  const router = useRouter()

  return (
    <div
      className="border-neutral-400 relative w-full cursor-pointer break-inside-avoid overflow-hidden border transition-all"
      onClick={() => {
        router.push(`/token/${remix.token_address}`)
      }}
    >
      <div className="flex gap-2 p-2">
        <div className="relative">
          <Image
            src={remix.image}
            alt={remix.name}
            width={92}
            height={92}
            className="aspect-square h-[92px] w-[92px] object-cover"
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="absolute top-1 left-1 z-10 flex items-center justify-center rounded-[6px] bg-black/70 backdrop-blur-sm p-1">
                {remix.ip?.type === "creator" ? <Crown width={12} height={12} /> : <Community width={12} height={12} />}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {remix.ip?.type === "creator" ? "Creator" : "Community"}
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex w-full items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="flex items-center">
                <BracketAnimation>
                  <span className="inline-block max-w-16 truncate overflow-hidden">{remix.name}</span>
                </BracketAnimation>
              </span>
              <Copy copy={remix.token_address} text={remix.symbol} className="text-brand text-sm font-semibold" />
            </span>
            <p className="flex items-center gap-1 text-xs text-neutral-300">
              <Clock size={12} />
              <Timer startTime={remix.created_at || ""} />
            </p>
          </div>
          <div className="flex-1">
            <p className="line-clamp-3 text-sm font-normal">{remix.description}</p>
          </div>
          <div className="flex w-full items-center justify-between">
            <span className="flex flex-1 gap-2">
              {remix.socials?.twitter && <Socials type={SOCIAL_TYPE.TWITTER} url={remix.socials.twitter} size={14} />}
              {remix.socials?.tiktok && <Socials type={SOCIAL_TYPE.TIKTOK} url={remix.socials.tiktok} size={14} />}
              {remix.socials?.instagram && (
                <Socials type={SOCIAL_TYPE.INSTAGRAM} url={remix.socials.instagram} size={14} />
              )}
              {remix.socials?.website && <Socials type={SOCIAL_TYPE.WEBSITE} url={remix.socials.website} size={14} />}
            </span>
            <span className="flex gap-1 text-xs text-neutral-300">
              <Comment size={12} />
              {remix.number_of_comments} comments
            </span>
          </div>
        </div>
      </div>
      <div className="h-6">
        {remix.ip && remix.ip.image && <IpBadge className="flex-1 shadow-none" ip={remix.ip} theme="dark" />}
      </div>

      <TokenStatus tokenAddress={remix.token_address} />
    </div>
  )
}

export default RemixCompactGridItem
