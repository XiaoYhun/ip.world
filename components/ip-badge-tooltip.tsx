import { Ip, IP_STATUS } from "@/types/ip"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"

const IpBadgeTooltip = ({ ip, children }: { ip: Ip; children: React.ReactNode }) => {
  const isLicensed = ip.is_licensed

  // in case of licensed ip, here are the statuses:
  // 0: unverified
  // 1: verified
  // 2: claimed
  const isUnverified = ip.status === IP_STATUS.PRE_REGISTERED || ip.status === IP_STATUS.DRAFT
  const isVerified = ip.status === IP_STATUS.REGISTERED
  const isClaimed = ip.status === IP_STATUS.CLAIMED

  return (
    <Tooltip>
      <TooltipTrigger>{children}</TooltipTrigger>
      <TooltipContent>
        <p>
          {isLicensed ? "Licensed IP:" : "Community:"}&nbsp;
          {isLicensed && isUnverified ? "Unverified" : isVerified ? "Verified" : isClaimed ? "Claimed" : ""}
        </p>
      </TooltipContent>
    </Tooltip>
  )
}

export default IpBadgeTooltip
