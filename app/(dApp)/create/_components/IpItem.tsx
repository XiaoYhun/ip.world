"use client"

import { MOCK_IP } from "@/constants/mockData"
import { cn } from "@/lib/utils"
import { Ip } from "@/types/ip"
import Image from "next/image"
import { useRouter } from "next/navigation"
import CategoryPills from "@/components/category-pills"
import { XIcon } from "lucide-react"

const IpItem = ({
  ip,
  className,
  onClick,
  onClose
}: {
  ip: Ip
  className?: string
  onClick?: (ip: Ip) => void
  onClose?: () => void
}) => {
  const router = useRouter()

  const handleClick = () => {
    if (onClick) {
      onClick(ip)
    } else {
      router.push(`/create/ip/${ip.handle}`)
    }
  }

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClose?.()
  }

  return (
    <div
      className={cn(
        "flex cursor-pointer items-center justify-between gap-2 rounded-[8px] bg-neutral-700 p-2 hover:bg-neutral-500",
        className
      )}
      onClick={handleClick}
    >
      <div className="relative size-8 overflow-hidden rounded-[4px]">
        <Image src={ip.image || MOCK_IP.image} alt={ip.title} fill className="h-5 w-5 object-cover" />
      </div>
      <div className="flex flex-1 flex-col gap-1 text-sm font-medium text-white">
        <div className="w-fit rounded-[8px] bg-neutral-500 px-2 py-1.5">{ip.title}</div>
      </div>
      <CategoryPills ip={ip} className="pointer-events-none border-none! px-3 py-2 uppercase shadow-none!" />
      {onClose && (
        <button
          onClick={handleClose}
          className="pointer-events-auto cursor-pointer ml-2 flex size-6 items-center justify-center rounded-full bg-neutral-600 text-neutral-300 transition-colors hover:bg-neutral-500 hover:text-white"
          aria-label="Remove IP"
        >
          <XIcon size={14} />
        </button>
      )}
    </div>
  )
}

export default IpItem
