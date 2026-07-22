"use client"
import { TooltipTrigger } from "@radix-ui/react-tooltip"
import { ArrowLeft, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { memo, useEffect, useMemo, useState } from "react"
import { isAddress } from "viem"
import { useAccount } from "@/hooks/use-account"
import Copy from "@/components/copy"
import Image from "@/components/image"
import defaultUserImage from "@/public/images/default-user.png"
import SocialsList from "@/components/socials-list"
import StoryExplorerLink from "@/components/story-explorer-link"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent } from "@/components/ui/tooltip"

import { useNavigation } from "@/context/navigation-context"
import { useProfile } from "@/hooks/use-profile"
import { TIER_CONFIG } from "@/lib/constants"
import { formatNumberWithSuffix } from "@/lib/number"
import { truncateAddress } from "@/lib/strings"
import { cn } from "@/lib/utils"
import { User, UserStats } from "@/types/profile"
import Stats from "./stats"
import { Chain, Pencil, Referral, Share } from "@/components/icons"

const Header = memo(({ user, stats }: { user: User; stats: UserStats }) => {
  const { isConnected } = useAccount()
  const { user: connectedUser } = useProfile()
  const router = useRouter()
  const { previousPage, setPreviousPage, clearPreviousPage } = useNavigation()
  const [isShareCopied, setIsShareCopied] = useState(false)

  // Clear navigation context when component unmounts (navigating away from profile)
  useEffect(() => {
    return () => {
      // Only clear if not going to settings (which handles its own context)
      if (previousPage !== "profile") {
        clearPreviousPage()
      }
    }
  }, [clearPreviousPage, previousPage])

  const ownProfile = useMemo(() => {
    return connectedUser?.wallet_address?.toLowerCase() === user?.wallet_address?.toLowerCase()
  }, [connectedUser, user])

  const getUsername = useMemo(() => {
    if (user?.username && user?.username.toLowerCase() !== user?.wallet_address?.toLowerCase()) {
      return user?.username
    }

    return user?.wallet_address ? user.wallet_address.slice(0, 6) + "..." + user.wallet_address.slice(-4) : ""
  }, [user])

  const handleEditProfileClick = () => {
    setPreviousPage("profile")
    router.push("/settings")
  }

  const handleShareClick = () => {
    navigator.clipboard.writeText(`https://ip.world/profile/${user?.wallet_address}`)
    setIsShareCopied(true)
    setTimeout(() => {
      setIsShareCopied(false)
    }, 2000)
  }

  // Map previous page to user-friendly text and route
  const getBackNavigation = () => {
    switch (previousPage) {
      case "leaderboard":
        return { text: "return to rewards", route: "/leaderboard" }
      case "remixes":
        return { text: "return to tokens", route: "/coins" }
      case "explore":
        return { text: "return to explore", route: "/" }
      case "settings":
        // Special case: if coming from settings, still show "return to explore"
        // since settings navigation is handled separately
        return { text: "return to explore", route: "/" }
      default:
        return { text: "return to explore", route: "/" }
    }
  }

  const backNavigation = getBackNavigation()

  return (
    <div className="relative mt-[-3.75rem] flex flex-col overflow-hidden pt-32 md:flex-row md:pt-25">
      {/* blurred background image */}
      <div
        className="absolute inset-0 scale-110 bg-cover bg-center bg-no-repeat blur-[50px]"
        style={{ backgroundImage: `url(${user?.avatar_url ? user?.avatar_url : defaultUserImage})` }}
      />

      {/* gradient overlay */}
      <div className="absolute inset-0" style={{ background: "var(--gradient-profile)" }} />

      {/* content */}
      <div className="relative z-10 flex w-full flex-col justify-between p-4 pt-0 !pb-9">
        {/* dynamic navigation based on previous page */}
        <div className="absolute -top-8 left-0 hidden w-full items-center justify-between px-5 md:flex">
          <span
            className="flex cursor-pointer items-center gap-2 text-sm font-medium text-white/70 hover:text-white/90"
            onClick={() => router.push(backNavigation.route)}
          >
            <ArrowLeft size={16} /> {backNavigation.text}
          </span>
          {!isAddress(user?.username) && (
            <span
              className="flex cursor-pointer items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-white/90"
              onClick={handleShareClick}
            >
              {isShareCopied ? <Check size={16} /> : <Share size={16} />}
              <span>Share</span>
            </span>
          )}
        </div>

        {/* profile image + stats */}
        <div className="flex w-full flex-col md:flex-row md:justify-between">
          <div className="relative flex gap-4">
            <Image
              src={user?.avatar_url || defaultUserImage}
              alt={user?.wallet_address ?? "avatar"}
              width={128}
              height={128}
              className="aspect-square h-[128px] w-[128px] rounded-full border-[4px] border-black object-cover"
            />
            <div className="bg-gradient-light-purple text-md absolute bottom-0 left-[16px] h-[2.0625rem] rotate-[-10deg] rounded-2xl border border-[#C79FFF] px-5 py-2 font-semibold text-[#D6D1FF]">
              {formatNumberWithSuffix(stats?.total_points)} pts
            </div>

            <div className="hidden flex-col gap-1.5 md:flex">
              <p className="text-sm font-medium">Rank #{stats?.rank}</p>
              <div className="flex gap-3">
                <p className="max-w-sm text-2xl !font-[600] md:max-w-[100px] xl:max-w-sm 2xl:max-w-none">
                  @{getUsername}
                </p>
                {user?.socials && (
                  <div className="flex items-center gap-3 border-l border-l-[#44444D] pl-3">
                    <SocialsList socials={user?.socials} />
                  </div>
                )}

                {ownProfile && (
                  <div
                    onClick={handleEditProfileClick}
                    className="ms-2.5 flex cursor-pointer items-center gap-1 text-xs text-neutral-200 transition-all hover:text-white"
                  >
                    <Pencil size={12} />
                    <div>Edit Profile</div>
                  </div>
                )}
              </div>
              {!user?.username && (
                <p className="text-sm text-neutral-200">
                  {user?.wallet_address?.slice(0, 6)}...{user?.wallet_address?.slice(-4)}
                </p>
              )}

              {/* Story Explorer Link */}
              {user?.wallet_address && isAddress(user.wallet_address) && (
                <StoryExplorerLink address={user.wallet_address as `0x${string}`} type="address">
                  <div className="flex items-center gap-1 rounded-full px-1 py-0.5 text-neutral-200 transition-colors hover:text-white">
                    <Chain />
                    <div className="translate-y-[1px] text-xs font-semibold">
                      {truncateAddress(user.wallet_address as `0x${string}`)}
                    </div>
                  </div>
                </StoryExplorerLink>
              )}

              <p className="max-w-[470px] text-sm text-white">{user?.bio || "no bio yet."}</p>
            </div>

            {/* Mobile */}
            <div className="flex w-full flex-col gap-2.5 md:hidden">
              <p className="text-sm font-medium">Rank #{stats?.rank}</p>
              <div className="flex items-center gap-2">
                <p className={cn("text-2xl !font-[600]", "max-w-[100px] truncate")}>@{user?.username}</p>
                <Separator orientation="vertical" />
                {user?.socials && <SocialsList socials={user.socials} />}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-pointer">
                      {TIER_CONFIG[stats.tier as keyof typeof TIER_CONFIG] && (
                        <div>
                          <Image
                            src={TIER_CONFIG[stats.tier as keyof typeof TIER_CONFIG].icon}
                            alt={TIER_CONFIG[stats.tier as keyof typeof TIER_CONFIG].alt}
                            width={30}
                            height={30}
                            className="aspect-square h-[30px] w-[30px] object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="border-neutral-2000 border bg-neutral-800 text-white [&_.bg-primary]:bg-neutral-800 [&_.fill-primary]:fill-neutral-800">
                    {stats.tier}
                  </TooltipContent>
                </Tooltip>
              </div>
              {!isAddress(user?.username) && (
                <div className="flex items-center gap-1.5">
                  <p className="flex-1 text-sm text-neutral-200">
                    {user?.wallet_address?.slice(0, 5)}...{user?.wallet_address?.slice(-3)}
                  </p>

                  <div className={`relative flex flex-row items-stretch justify-end rounded-sm text-white/70`}>
                    <div className="flex flex-row gap-2 px-2 py-1">
                      <Referral size={14} />
                      <div
                        onClick={() => navigator.clipboard.writeText(`https://ip.world/?ref=${user?.referral_code}`)}
                        className={`flex w-fit max-w-[137px] cursor-pointer flex-nowrap items-center self-stretch text-sm font-medium opacity-100`}
                      >
                        {user?.referral_code}
                        <Copy className="cursor-pointer" size={16} />
                      </div>
                    </div>
                    <div className="bg-rainbow absolute size-full rounded-[6px]"></div>
                  </div>
                </div>
              )}

              {/* Story Explorer Link - Mobile */}
              {user?.wallet_address && isAddress(user.wallet_address) && (
                <StoryExplorerLink address={user.wallet_address as `0x${string}`} type="address">
                  <div className="flex items-center gap-1 rounded-full px-1 py-0.5 text-neutral-200 transition-colors hover:text-white">
                    <Chain />
                    <div className="text-xs font-semibold">{truncateAddress(user.wallet_address as `0x${string}`)}</div>
                  </div>
                </StoryExplorerLink>
              )}
              <div className="flex w-full items-center gap-2 text-neutral-200">
                {ownProfile && (
                  <div
                    className="flex flex-1 items-center justify-center gap-1 rounded-sm border border-neutral-600 py-2"
                    onClick={handleEditProfileClick}
                  >
                    <Pencil size={16} />
                    <div className="text-xs">Edit Profile</div>
                  </div>
                )}
                <div
                  className="bg-neutral-2000 flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-sm border border-neutral-600 py-2 transition-colors active:bg-neutral-600"
                  onClick={handleShareClick}
                >
                  {isShareCopied ? <Check size={16} /> : <Share size={16} />}
                  <div className="text-xs">Share</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 hidden flex-col items-end gap-1.5 md:mr-4 md:flex lg:mt-0 lg:mr-0">
            {!user?.username && !isConnected ? (
              <></>
            ) : (
              <div className="flex items-center justify-center gap-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-pointer">
                      {TIER_CONFIG[stats.tier as keyof typeof TIER_CONFIG] && (
                        <div>
                          <Image
                            src={TIER_CONFIG[stats.tier as keyof typeof TIER_CONFIG].icon}
                            alt={TIER_CONFIG[stats.tier as keyof typeof TIER_CONFIG].alt}
                            width={57}
                            height={57}
                            className="aspect-square h-[57px] min-w-[57px] object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="border-neutral-2000 border bg-neutral-800 text-white [&_.bg-primary]:bg-neutral-800 [&_.fill-primary]:fill-neutral-800">
                    {stats.tier}
                  </TooltipContent>
                </Tooltip>
                {!isAddress(user?.username) && (
                  <div
                    key={`referral-code`}
                    className={
                      "bg-gradient-grey ease-out-quint relative flex h-7.5 w-full flex-nowrap items-center gap-2 rounded-[6px] p-[6px] no-underline transition-colors duration-200 hover:bg-neutral-600 disabled:pointer-events-none disabled:opacity-40"
                    }
                    aria-current="page"
                  >
                    <div className="ms-1 flex items-center justify-center">
                      <Referral size={14} />
                    </div>
                    <div className="order-2 flex flex-auto flex-col items-start justify-center self-stretch overflow-hidden opacity-100 transition-opacity duration-1000">
                      <div className="relative flex w-full flex-col items-start justify-center gap-4 rounded-[12px] p-2">
                        {user?.username && (
                          <div className="flex w-full text-sm font-medium text-white">
                            <span className="max-w-[10rem] text-white/70">{user?.referral_code}</span>
                            <span className="ms-auto text-neutral-300 transition-all hover:text-white">
                              <Copy copy={`https://ip.world/?ref=${user?.referral_code || ""}`} size={14} />
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="bg-rainbow absolute h-full w-full -translate-x-1.5 rounded-[6px]"></div>
                  </div>
                )}
              </div>
            )}

            <Stats stats={stats} />
          </div>

          <div className="flex md:hidden">
            <Stats stats={stats} />
          </div>
        </div>
      </div>
    </div>
  )
})

Header.displayName = "Header"

export default Header
