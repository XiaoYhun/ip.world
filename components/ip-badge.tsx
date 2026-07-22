"use client"

import { useRouter } from "next/navigation"
import Image from "@/components/image"
import { cn } from "@/lib/utils"
import { Ip } from "@/types/ip"
import IpBadgeIcon from "./ip-badge-icon"
import IpBadgeTooltip from "./ip-badge-tooltip"

const IpBadge = ({ ip, className, theme = "light" }: { ip: Ip; className?: string; theme?: "light" | "dark" }) => {
  const router = useRouter()

  return (
    <IpBadgeTooltip ip={ip}>
      <div
        className={cn("shadow-badge flex cursor-pointer", className)}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          router.push(`/ip/${ip.id}`)
        }}
      >
        <Image src={ip.image} alt={ip.title} width={23} height={23} className="h-6 w-6 bg-black object-cover" />
        <div
          className={cn(
            "flex items-center gap-1 p-1",
            theme === "light" ? "bg-white text-black" : "bg-black text-white"
          )}
        >
          <IpBadgeIcon ip={ip} tooltip={false} />
          <p className="text-sm">{ip.title}</p>
        </div>
      </div>
    </IpBadgeTooltip>
  )
}

const IpBadgeSmall = ({ ip, className }: { ip: Ip; className?: string }) => {
  const router = useRouter()

  return (
    <IpBadgeTooltip ip={ip}>
      <div
        className={cn("shadow-badge relative flex cursor-pointer", className)}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          router.push(`/ip/${ip.id}`)
        }}
      >
        <Image src={ip.image} alt={ip.title} width={28} height={28} className="h-7 w-7 bg-black object-cover" />
        <div className="absolute -right-2 -bottom-2">
          <IpBadgeIcon ip={ip} tooltip={false} size={20} />
        </div>
      </div>
    </IpBadgeTooltip>
  )
}

export { IpBadgeSmall }

export default IpBadge
