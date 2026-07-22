import { isVerified } from "@/lib/utils"
import { Ip } from "@/types/ip"
import { LicensedBadgeVerified } from "./icons/licensed-badge-verified"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"

const IPBadgeIcon = ({ ip, size = 16, tooltip = true }: { ip: Ip; size?: number; tooltip?: boolean }) => {
  if (!isVerified(ip)) return null

  return (
    <div className="text-brand flex items-center justify-center">
      {tooltip ? (
        <Tooltip>
          <TooltipTrigger>
            <LicensedBadgeVerified size={size} />
          </TooltipTrigger>
          <TooltipContent>Verified</TooltipContent>
        </Tooltip>
      ) : (
        <LicensedBadgeVerified size={size} />
      )}
    </div>
  )
}

export default IPBadgeIcon
