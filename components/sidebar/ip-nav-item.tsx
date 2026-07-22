"use client"

import Link from "next/link"
import ViralityScore from "@/components/virality-score"
import { useIsMobileView } from "@/context/mobile-ui-context"
import { useSidebar } from "@/context/sidebar-context"
import { cn, isCreator } from "@/lib/utils"
import { Ip } from "@/types/ip"
import Image from "../image"
import { CommunitySmall, Creator } from "../icons"

type IpNavItemProps = {
  ip: Ip
  itemClassName?: string
}

const IpNavItem = ({ ip, itemClassName }: IpNavItemProps) => {
  const { isExpanded } = useSidebar()
  const isMobile = useIsMobileView() ?? false // Default to false when null

  return (
    <Link
      key={`sidebar-ip-${ip.id}`}
      className={cn(
        "ease-out-quint hover:bg-neutral-600 flex h-9 w-full cursor-pointer flex-nowrap items-center gap-2 rounded-l-[2px] rounded-r-md ps-[2px] no-underline transition-colors duration-200 group-hover:pe-2 disabled:pointer-events-none disabled:opacity-40"
      )}
      href={`/ip/${ip.id}`}
      aria-current="page"
    >
      <Image
        src={ip.image}
        alt={ip.title}
        width={32}
        height={32}
        className="aspect-square size-8 rounded-[2px] object-cover"
      />
      <div className="order-2 flex flex-auto flex-col items-start justify-center self-stretch overflow-hidden">
        <div
          className={cn(
            "text-neutral-200 font-inherit flex w-full items-center justify-between gap-1 text-sm leading-normal whitespace-nowrap transition-opacity",
            // Always show on mobile or when expanded
            isMobile || isExpanded ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            itemClassName
          )}
        >
          <div className="flex flex-row items-start justify-center gap-2 sm:gap-1">
            {isCreator(ip) ? <Creator size={12} /> : <CommunitySmall size={16} />}
            <span className="block w-[80px] overflow-hidden text-sm text-ellipsis whitespace-nowrap text-white">
              {ip.title}
            </span>
          </div>

          <ViralityScore ip={ip} noBg />
        </div>
      </div>
    </Link>
  )
}

export default IpNavItem
