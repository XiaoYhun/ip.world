"use client"

import { cn } from "@/lib/utils"
import { useProfile } from "@/hooks/use-profile"
import { useAccount } from "@/hooks/use-account"
import Copy from "@/components/copy"
import Image from "next/image"
import defaultUserImage from "@/public/images/default-user.png"

export type SettingsTab = "profile" | "security" | "network"

interface SettingsNavProps {
  activeTab: SettingsTab
  onTabChange: (tab: SettingsTab) => void
}

const SettingsNav = ({ activeTab, onTabChange }: SettingsNavProps) => {
  const { user } = useProfile()
  const { address } = useAccount()

  const truncatedAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : ""

  // Show @username if it's set and not just the wallet address, otherwise truncate
  const displayName = user?.username && !user.username.startsWith("0x")
    ? `@${user.username}`
    : address
      ? `@${address.slice(0, 6)}...${address.slice(-4)}`
      : "@username"

  return (
    <div className="flex w-full min-w-0 flex-col gap-[18px] overflow-hidden">
      {/* User info */}
      <div className="flex items-center gap-[9px]">
        <div className="relative size-9 shrink-0 overflow-hidden rounded-full bg-neutral-800">
          <Image
            src={user?.avatar_url || defaultUserImage}
            alt="Profile"
            fill
            className="object-cover"
          />
        </div>
        <div className="flex min-w-0 flex-col gap-[5px]">
          <span className="truncate text-sm font-medium text-white">
            {displayName}
          </span>
          <Copy
            text={truncatedAddress}
            copy={address}
            size={12}
            className="text-xs text-neutral-500"
          />
        </div>
      </div>

      {/* Nav items */}
      <div className="flex max-w-[320px] flex-col">
        <button
          onClick={() => onTabChange("profile")}
          className={cn(
            "truncate rounded-[10px] px-3 py-3 text-left text-sm font-medium text-white transition-colors",
            activeTab === "profile"
              ? "bg-white/5"
              : "hover:bg-white/[0.03]"
          )}
        >
          Profile Settings
        </button>
        <button
          onClick={() => onTabChange("security")}
          className={cn(
            "truncate rounded-[10px] px-3 py-3 text-left text-sm font-medium text-white transition-colors",
            activeTab === "security"
              ? "bg-white/5"
              : "hover:bg-white/[0.03]"
          )}
        >
          Security Settings
        </button>
        <button
          onClick={() => onTabChange("network")}
          className={cn(
            "truncate rounded-[10px] px-3 py-3 text-left text-sm font-medium text-white transition-colors",
            activeTab === "network"
              ? "bg-white/5"
              : "hover:bg-white/[0.03]"
          )}
        >
          Network
        </button>
      </div>
    </div>
  )
}

export default SettingsNav
