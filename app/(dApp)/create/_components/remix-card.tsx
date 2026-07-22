import BracketAnimation from "@/components/animation/bracket"
import Copy from "@/components/copy"
import { CommunitySmall, Creator } from "@/components/icons"
import Image from "@/components/image"
import SocialsList from "@/components/socials-list"
import { Skeleton } from "@/components/ui/skeleton"
import { formatNumberWithSuffix } from "@/lib/number"
import { cn, isCreator } from "@/lib/utils"
import { Ip } from "@/types/ip"
import { Remix } from "@/types/remix"

interface RemixCardProps {
  remix: Partial<Remix>
  ip: Partial<Ip>
  className?: string
}

// Skeleton Remix Card for Create Flow

const RemixCard = ({ className, remix, ip }: RemixCardProps) => {
  return (
    <div className={cn("flex w-full gap-4", className)}>
      <div className="bg-gradient-card aspect-square h-[140px] w-[140px] overflow-hidden rounded-[10px]">
        {remix.image && (
          <Image
            src={remix.image}
            alt={remix.name || "token"}
            width={140}
            height={140}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col py-3">
        <div className="flex justify-between">
          {remix.name ? (
            <div className="flex">
              <BracketAnimation>
                <p className="text-md line-clamp-1 break-all text-ellipsis text-white">{remix.name}</p>
              </BracketAnimation>
            </div>
          ) : (
            <Skeleton className="h-4 w-24" />
          )}
          {remix.symbol && (
            <Copy
              copy={remix.symbol}
              text={`$${remix.symbol}`}
              className="text-md text-neutral-200"
              textClassName="line-clamp-1 break-all text-ellipsis"
            />
          )}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <p className="text-sm break-keep whitespace-nowrap text-neutral-300">remix of </p>
          <div className="flex items-center gap-1">
            <span className="text-brand">{isCreator(ip) ? <Creator /> : <CommunitySmall />}</span>
            {ip.title ? (
              <span className="line-clamp-1 text-sm break-all text-ellipsis text-neutral-200">{ip.title}</span>
            ) : (
              <Skeleton className="h-4 w-24" />
            )}
          </div>
        </div>
        <div className="mt-3">
          {remix.description ? (
            <p className="line-clamp-2 text-xs break-all text-ellipsis text-neutral-200">{remix.description}</p>
          ) : (
            <Skeleton className="h-6 w-full" />
          )}
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="flex gap-1 text-sm">
            <span className="text-neutral-200">MC</span>
            <span>${formatNumberWithSuffix(1000000)}</span>
          </p>
          <p className="flex gap-1 text-sm">
            <span className="text-neutral-200">VOL</span>
            <span>${formatNumberWithSuffix(1000000000)}</span>
          </p>
          <p className="flex gap-1 text-sm">
            <span className="text-neutral-200">LIQ</span>
            <span>${formatNumberWithSuffix(100000)}</span>
          </p>
        </div>
        <div className="flex-1" />
        {remix.socials && <SocialsList socials={remix.socials} className="mt-2 gap-2" />}
      </div>
    </div>
  )
}

export default RemixCard
