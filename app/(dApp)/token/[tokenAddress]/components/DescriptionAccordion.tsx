"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { ChevronDownIcon, HelpCircleIcon } from "lucide-react"
import { Remix } from "@/types/remix"
import { formatNumberWithSuffix } from "@/lib/number"
import { Creator, Burn, Community } from "@/components/icons"
import { cn, getSocialUrl } from "@/lib/utils"
import Link from "next/link"
import { SOCIAL_TYPE } from "@/components/socials"
import { Address, isAddress } from "viem"
import { truncateAddress } from "@/lib/strings"
import StoryExplorerLink from "@/components/story-explorer-link"

export default function DescriptionAccordion({
  remix,
  remixTotalSupplyAmount,
  ipOwnerRewardAmount,
  communityRewardAmount,
}: {
  remix: Remix
  remixTotalSupplyAmount: number
  ipOwnerRewardAmount: number
  communityRewardAmount: number
}) {
  return (

    <div className={cn("flex flex-col gap-2")}>
      <div className="flex w-full items-center justify-between rounded-[8px] bg-neutral-600 px-1.5 py-1">
        <div className="flex items-center justify-center gap-1 text-xs font-medium text-neutral-200">
          <Creator size={12} />
          <div className="text-xs leading-4! font-medium text-neutral-200">IP Owner Rewards</div>
        </div>
        <div className="ms-auto font-mono text-xs font-medium text-neutral-100">
          ${formatNumberWithSuffix((ipOwnerRewardAmount as number) || 0)}
        </div>
      </div>
      <div className="flex w-full items-center justify-between rounded-[8px] bg-neutral-600 px-1.5 py-1">
        <div className="flex items-center justify-center gap-1 text-xs font-medium text-neutral-200">
          <Burn size={12} />
          <div className="text-xs leading-4! font-medium text-neutral-200">Amount Burned</div>
        </div>
        <div className="ms-auto font-mono text-xs font-medium text-neutral-100">
          ${formatNumberWithSuffix(remixTotalSupplyAmount)}
        </div>
      </div>
      <div className="flex w-full items-center justify-between rounded-[8px] bg-neutral-600 px-1.5 py-1">
        <div className="flex items-center justify-center gap-1 text-xs font-medium text-neutral-200">
          <Community width={12} height={11} />
          <div className="text-xs leading-4! font-medium text-neutral-200">Community Rewards</div>
        </div>
        <div className="ms-auto font-mono text-xs font-medium text-neutral-100">
          ${formatNumberWithSuffix(communityRewardAmount)}
        </div>
      </div>
    </div>
  )
}
