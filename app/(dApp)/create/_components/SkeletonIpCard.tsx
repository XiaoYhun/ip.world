import { cn, getSocialUrl } from "@/lib/utils"
import { Ip } from "@/types/ip"
import CategoryPills from "@/components/category-pills"
import { ViralityLabel } from "@/components/ui/virality-label"
import { Creator, Community } from "@/components/icons"
import Link from "next/link"
import { SOCIAL_TYPE } from "@/components/socials"
import VisualizedDelta from "@/components/visualized-delta"
import { formatNumberWithSuffix } from "@/lib/number"
import { Skeleton } from "@/components/ui/skeleton"

export default function SkeletonIpCard({ ip, className }: { ip: Partial<Ip>; className?: string }) {
  return (
    <div
      className={cn(
        "relative flex h-[216px] w-[320px] flex-col gap-2 overflow-hidden rounded-[12px] border p-3",
        className
      )}
    >
      {/* Background Image */}
      {ip.image ? (
        <>
          <div
            className="absolute inset-0 -z-1"
            style={{ background: `url(${ip.image}) no-repeat center center`, backgroundSize: "cover" }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-800/100 to-transparent" />
        </>
      ) : (
        <div className="absolute inset-0 -z-1 animate-pulse bg-neutral-700" />
      )}

      {/* Top left category */}
      <div className="absolute top-2 left-2">
        {ip.category ? (
          <CategoryPills ip={ip as Ip} className="border-black/30 bg-black/40 text-neutral-100 !shadow-none" />
        ) : (
          <Skeleton className="h-6 w-20 rounded-full" />
        )}
      </div>

      {/* Top right virality score */}
      <div className="absolute top-2 right-2">
        {ip.viral_score ? (
          <ViralityLabel viralScore={ip.viral_score} />
        ) : (
          <Skeleton className="h-6 w-16 rounded-full" />
        )}
      </div>

      {/* Bottom left title */}
      <div className="absolute bottom-2 left-2">
        {ip.title ? <div className="text-lg font-medium">{ip.title}</div> : <Skeleton className="mb-1 h-6 w-48" />}
        <div className="flex items-center gap-1">
          {ip.type === "creator" && (
            <div className="text-sm font-medium text-neutral-200">
              <Creator size={12} />
            </div>
          )}
          {ip.type === "community" && (
            <div className="text-sm font-medium text-neutral-200">
              <Community width={14} height={12} />
            </div>
          )}
          {ip.owner_account ? (
            <Link
              href={getSocialUrl(ip.owner_account_type as SOCIAL_TYPE, ip.owner_account) ?? "#"}
              target="_blank"
              className="flex cursor-pointer items-center justify-start gap-1 text-sm text-neutral-200 duration-200 hover:text-white"
              onClick={(e) => {
                e.stopPropagation()
              }}
            >
              @{ip.owner_account}
            </Link>
          ) : (
            <Skeleton className="h-4 w-32" />
          )}
        </div>
      </div>

      {/* Bottom right stats */}
      <div className="absolute right-2 bottom-2">
        {ip.market_cap ? (
          <div className="flex items-center gap-2 font-mono font-bold">
            <VisualizedDelta dollar>{formatNumberWithSuffix(ip.market_cap)}</VisualizedDelta>
          </div>
        ) : (
          <Skeleton className="h-6 w-24" />
        )}
      </div>
    </div>
  )
}
