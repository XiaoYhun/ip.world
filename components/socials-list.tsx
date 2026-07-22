"use client"

import { cn } from "@/lib/utils"
import Socials, { SOCIAL_TYPE } from "./socials"

const SocialsList = ({
  socials,
  className,
  size = 14,
}: {
  socials: Record<SOCIAL_TYPE, string> | null
  className?: string
  size?: number
}) => {
  if (Object.values(socials || {}).every((value) => !value)) return null
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {socials?.twitter && <Socials type={SOCIAL_TYPE.TWITTER} url={socials.twitter} size={size} />}
      {socials?.tiktok && <Socials type={SOCIAL_TYPE.TIKTOK} url={socials.tiktok} size={size} />}
      {socials?.instagram && <Socials type={SOCIAL_TYPE.INSTAGRAM} url={socials.instagram} size={size} />}
      {socials?.youtube && <Socials type={SOCIAL_TYPE.YOUTUBE} url={socials.youtube} size={size} />}
      {socials?.telegram && <Socials type={SOCIAL_TYPE.TELEGRAM} url={socials.telegram} size={size} />}
      {socials?.website && <Socials type={SOCIAL_TYPE.WEBSITE} url={socials.website} size={size} />}
    </div>
  )
}

export default SocialsList
