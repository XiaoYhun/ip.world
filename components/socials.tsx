"use client"

import Link from "next/link"
import { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Instagram, Telegram, Tiktok, Twitter, Website, Youtube } from "./icons"
import { composeSafeSocialUrl } from "@/lib/safe-url"

export enum SOCIAL_TYPE {
  TWITTER = "twitter",
  INSTAGRAM = "instagram",
  WEBSITE = "website",
  TIKTOK = "tiktok",
  TELEGRAM = "telegram",
  YOUTUBE = "youtube",
}

type SocialsProps = {
  type: SOCIAL_TYPE
  url?: string
  size?: number
  className?: string
  child?: ReactNode
}

const Socials = ({ type, url, size = 20, className, child }: SocialsProps) => {
  const social_data = {
    [SOCIAL_TYPE.TWITTER]: {
      icon: <Twitter size={size} />,
      url: composeSafeSocialUrl("twitter", url),
    },
    [SOCIAL_TYPE.TELEGRAM]: {
      icon: <Telegram size={size} />,
      url: composeSafeSocialUrl("telegram", url),
    },
    [SOCIAL_TYPE.INSTAGRAM]: {
      icon: <Instagram size={size} />,
      url: composeSafeSocialUrl("instagram", url),
    },
    [SOCIAL_TYPE.TIKTOK]: {
      icon: <Tiktok size={size} />,
      url: composeSafeSocialUrl("tiktok", url),
    },
    [SOCIAL_TYPE.WEBSITE]: {
      icon: <Website size={size} />,
      url: composeSafeSocialUrl("website", url),
    },
    [SOCIAL_TYPE.YOUTUBE]: {
      icon: <Youtube size={size} />,
      url: composeSafeSocialUrl("youtube", url),
    },
  }

  if (!social_data[type]) {
    return <></>
  }

  if (child && social_data[type].url) {
    return (
      <Link
        href={social_data[type].url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "flex cursor-pointer items-center gap-1 text-neutral-300 transition-colors duration-200 hover:text-white s",
          className
        )}
      >
        <span className="">{social_data[type].icon}</span>
        {child}
      </Link>
    )
  }
  if (!url || !social_data[type].url) {
    return <span className={className}>{social_data[type].icon}</span>
  }

  return (
    <Link
      href={social_data[type].url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "text-neutral-200 flex cursor-pointer items-center transition-colors duration-200 size-[58px] justify-center border rounded-[8px] hover:text-white",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {social_data[type].icon}
    </Link>
  )
}

export default Socials
