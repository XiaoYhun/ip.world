"use client"

import { ArrowLeft, ArrowRight } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"
import { archivoBlack } from "@/app/fonts/fonts"
import { Lock, MoneyBag } from "@/components/icons"
import Copy from "@/components/copy"
import { cn } from "@/lib/utils"
import { useProfile } from "@/hooks/use-profile"
import ReferralLinkCopy from "@/components/referral-link-copy"

const CAROUSEL_SLIDES = [
  {
    id: 1,
    title: "Earn On Virality",
    description: "Launch an IP out of your favorite idea or Internet trend.",
    img: "/images/rewards/virality.png",
  },
  {
    id: 2,
    title: "Build Your Community",
    description: "Be part of the future of intellectual property on the blockchain.",
    img: "/images/rewards/community.png",
  },
  {
    id: 3,
    title: "Monetize Your Ideas",
    description: "Turn viral moments into sustainable revenue streams.",
    img: "/images/rewards/monetize.png",
  },
  {
    id: 4,
    title: "Join the Revolution",
    description: "Connect with creators and build a thriving ecosystem around your IP.",
    img: "/images/rewards/revolution.png",
  },
]

export default function CarouselSection({ className }: { className?: string }) {
  const { user: connectedUser } = useProfile()

  return (
    <div className={cn("bg-gradient-card-background relative w-full flex-col items-center justify-center overflow-hidden rounded-[16px] border h-[252px]", className || "hidden sm:flex")}>
      {/* Slides Container */}
      <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden">
        <div
          className="relative flex h-full w-full items-center bg-chessboard [--first-color:#111111] [--second-color:#121212]"
        >
          <div className="absolute right-0 bottom-0 top-0 w-full">
            <div className="relative h-full w-full">
              <Image src={"/images/reward-hero-image.png"} alt="Reward Hero Image" fill className="object-contain object-right" />
            </div>
          </div>

          <div className="relative z-10 flex w-full max-w-lg flex-col gap-6 px-6">
            {/* Referrals Badge */}
            <div className="inline-flex w-fit items-center gap-2 rounded-[8px] bg-purple-700 border border-purple-600 text-purple-200 px-2 py-1.5 backdrop-blur-sm ">
              <MoneyBag size={14} />
              <span className="text-[13px] font-semibold uppercase">REFERRALS</span>
            </div>

            {/* Heading */}
            <div className="flex flex-col gap-2">
              <h2 className={cn("text-2xl font-archivo font-semibold text-white whitespace-nowrap")}>Refer users and earn 5% on trading fees</h2>
              <p className="text-sm text-neutral-200">Invite users to join and earn 5% off all their trading fees</p>
            </div>

            {/* Referral Link */}
            <ReferralLinkCopy referralCode={connectedUser?.referral_code} showLabel={true} />
          </div>
        </div>
      </div>
    </div>
  )
}
