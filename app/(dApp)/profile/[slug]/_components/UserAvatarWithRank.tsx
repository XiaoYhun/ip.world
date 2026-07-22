"use client"

import Image from "next/image"
import defaultUserImage from "@/public/images/default-user.png"
import rankLegendBadgeBg from "@/public/images/rank-legend-badge-bg.jpeg"

type TierConfig = {
  borderColor: string
  badge: React.ReactNode
  ringOverlay?: React.ReactNode
}

// Inline SVG imports via img tags — kept as static paths (saved from Figma design)
const TIER_BADGE_CONFIGS: Record<string, TierConfig> = {
  Normie: {
    borderColor: "#bbbbbb",
    badge: (
      <div
        className="absolute bottom-0 flex items-center gap-1 rounded-full px-2 py-[3px] font-mono text-xxs font-bold whitespace-nowrap"
        style={{ left: "50%", transform: "translateX(-50%)", backgroundColor: "#bbbbbb", color: "#313131" }}
      >
        {/* Shit-Reaction--Streamline-Plump */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/rank-normie-icon.svg" alt="normie" className="size-3 shrink-0" />
        <span>NORMIE</span>
      </div>
    ),
  },
  Casual: {
    borderColor: "#e2ff7b",
    badge: (
      <div
        className="absolute bottom-0 flex items-center gap-1 rounded-full px-2 py-[3px] font-mono text-xxs font-bold whitespace-nowrap"
        style={{ left: "50%", transform: "translateX(-50%)", backgroundColor: "#e2ff7b", color: "#5d6833" }}
      >
        {/* Smiley-Sick--Streamline-Plump */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/rank-casual-icon.svg" alt="casual" className="size-3 shrink-0" />
        <span>CASUAL</span>
      </div>
    ),
  },
  Degen: {
    borderColor: "#ff4988",
    badge: (
      <div
        className="absolute bottom-0 flex items-center gap-1 rounded-full px-2 py-[3px] font-mono text-xxs font-bold whitespace-nowrap"
        style={{ left: "50%", transform: "translateX(-50%)", backgroundColor: "#ff4988", color: "#451626" }}
      >
        {/* Emoji-Smiley-Face-Horns-Demon--Streamline-Ultimate */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/rank-degen-icon.svg" alt="degen" className="size-3 shrink-0" />
        <span className="-translate-x-[1px]">DEGEN</span>
      </div>
    ),
  },
  Trencher: {
    borderColor: "#8892ff",
    badge: (
      <div
        className="absolute bottom-0 flex items-center gap-1 rounded-full px-2 py-[3px] font-mono text-xxs font-bold whitespace-nowrap"
        style={{ left: "50%", transform: "translateX(-50%)", backgroundColor: "#8892ff", color: "#333868" }}
      >
        {/* Lightning vector */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/rank-trencher-icon.svg" alt="trencher" className="size-3.5 shrink-0" />
        <span>TRENCHER</span>
      </div>
    ),
  },
  Legend: {
    borderColor: "conic-gradient(from 200deg, #00EEC6, #FFC525, #FF0CFB, #06ABE7, #00EEC6)",
    badge: (
      <div
        className="absolute bottom-0 flex items-center gap-1 overflow-hidden rounded-full px-2 py-[3px] font-mono text-xxs font-bold whitespace-nowrap"
        style={{ left: "50%", transform: "translateX(-50%)" }}
      >
        {/* Gradient background layer */}
        <Image
          src={rankLegendBadgeBg}
          alt=""
          fill
          className="pointer-events-none absolute inset-0 size-full rounded-full object-fit"
          aria-hidden
        />
        <div className="absolute inset-0 rounded-full " />
        {/* Alien--Streamline-Plump */}
        <div className="relative shrink-0 translate-y-[0.5px]" style={{ width: 12, height: 12 }} aria-hidden>
          {/* Gradient fill through SVG mask */}
          <div
            className="absolute inset-0"
            style={{
              WebkitMaskImage: "url(/images/rank-legend-icon.svg)",
              WebkitMaskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskImage: "url(/images/rank-legend-icon.svg)",
              maskSize: "contain",
              maskRepeat: "no-repeat",
              maskPosition: "center",
              backgroundImage: `url(${rankLegendBadgeBg.src})`,
              backgroundSize: "cover",
            }}
          />
          {/* Black SVG overlay at 68% opacity */}
          <div
            className="absolute inset-0 opacity-[0.68]"
            style={{
              WebkitMaskImage: "url(/images/rank-legend-icon.svg)",
              WebkitMaskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskImage: "url(/images/rank-legend-icon.svg)",
              maskSize: "contain",
              maskRepeat: "no-repeat",
              maskPosition: "center",
              backgroundColor: "black",
            }}
          />
        </div>
        <span className="relative text-black opacity-[68%] -translate-x-[1.5px]">LEGEND</span>
      </div>
    ),
  },
}

interface UserAvatarWithRankProps {
  user: { avatar_url?: string | null; wallet_address?: string | null } | null | undefined
  tier?: string | null
  size?: number
}

export function UserAvatarWithRank({ user, tier, size = 64 }: UserAvatarWithRankProps) {
  const mappedTier = tier?.toLowerCase() === "goat" ? "Legend" : tier
  const normalizedTier = mappedTier
    ? Object.keys(TIER_BADGE_CONFIGS).find((k) => k.toLowerCase() === mappedTier.toLowerCase())
    : undefined
  const config = normalizedTier ? TIER_BADGE_CONFIGS[normalizedTier] : undefined

  return (
    <div className="relative flex flex-col items-center" style={{ paddingBottom: config ? 12 : 0 }}>
      {/* Avatar with rank-colored ring */}
      <div
        className="relative overflow-hidden rounded-full p-[3px]"
        style={{ background: config?.borderColor ?? "transparent" }}
      >
        {config?.ringOverlay}
        <Image
          src={user?.avatar_url || defaultUserImage}
          alt={user?.wallet_address ?? "avatar"}
          width={size}
          height={size}
          className="relative block rounded-full object-cover"
          style={{ width: size, height: size }}
        />
      </div>

      {/* Rank pill badge */}
      {config?.badge}
    </div>
  )
}
