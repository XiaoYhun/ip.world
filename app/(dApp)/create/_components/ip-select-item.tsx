import { XIcon } from "lucide-react"
import Image from "@/components/image"
import IpBadgeIcon from "@/components/ip-badge-icon"
import { cn } from "@/lib/utils"
import { Ip } from "@/types/ip"

type IpItemProps = {
  ip: Ip
  onClick: () => void
  selected?: boolean
  isExisting?: boolean
}

const IpSelectItem = ({ ip, onClick, selected, isExisting = false }: IpItemProps) => {
  return (
    <div
      className={cn("hover:bg-neutral-2000 cursor-pointer p-6 transition-all", selected && "bg-brand-secondary!")}
      onClick={onClick}
    >
      <div className="flex h-16 gap-4">
        <Image src={ip.image} alt={ip.title} width={64} height={64} className="h-16 w-16 object-cover" />
        <div className="flex flex-1 flex-col justify-between">
          <span className="flex items-center gap-2">
            <p className="font-medium">{ip.title}</p>
            <IpBadgeIcon ip={ip} />
          </span>
          <p className="font-normal">{ip.owner_account}</p>
          <p className="font-normal">{ip.tags?.map((tag) => tag.name).join(", ")}</p>
        </div>
        {isExisting && (
          <span className="flex items-center gap-1">
            <XIcon size={20} />
            <p className="font-normal">this IP already exists</p>
          </span>
        )}
      </div>
    </div>
  )
}

export default IpSelectItem
