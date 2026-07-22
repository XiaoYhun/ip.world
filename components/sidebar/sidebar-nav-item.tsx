"use client"

import { useDynamicContext, useIsLoggedIn } from "@dynamic-labs/sdk-react-core"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { useAccount } from "@/hooks/use-account"
import Image from "@/components/image"
import defaultUserImage from "@/public/images/default-user.png"
import { useNavigation } from "@/context/navigation-context"
import { useSidebar } from "@/context/sidebar-context"
import { useProfile } from "@/hooks/use-profile"
import { cn } from "@/lib/utils"
import Copy from "../copy"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"

type SidebarItem = {
  label: string
  href: string
  icon: React.ReactNode
  referralCode?: string
  requiredLogin?: boolean
}

const SidebarNavItem = ({
  item,
  iconClassName,
  labelClassName,
  itemClassName,
}: {
  item: SidebarItem
  iconClassName?: string
  labelClassName?: string
  itemClassName?: string
}) => {
  const referralLink = `https://ip.world/?ref=${item.referralCode || ""}`

  const pathname = usePathname()
  const router = useRouter()
  const { address } = useAccount()
  const { user } = useProfile()
  const { setPreviousPage } = useNavigation()

  const { setShowAuthFlow } = useDynamicContext()
  const isLoggedIn = useIsLoggedIn()
  const { isExpanded } = useSidebar()

  // Track if we should redirect after auth
  const [postAuthRedirect, setPostAuthRedirect] = useState<string | null>(null)

  const handleClick = (e: React.MouseEvent) => {
    // Set navigation context when clicking Profile
    if (item.label === "Profile") {
      // Map current pathname to context key
      if (pathname.startsWith("/leaderboard")) {
        setPreviousPage("leaderboard")
      } else if (pathname.startsWith("/coins")) {
        setPreviousPage("remixes")
      } else if (pathname === "/") {
        setPreviousPage("explore")
      }
      // Don't set context for settings since that's handled separately
    }

    if (item.requiredLogin && !isLoggedIn) {
      e.preventDefault()
      setPostAuthRedirect(item.label === "Profile" ? `${item.href}/${address}` : item.href)
      setShowAuthFlow(true)
    }
  }

  // Effect to handle redirect after auth
  useEffect(() => {
    if (isLoggedIn && postAuthRedirect) {
      router.push(postAuthRedirect)
      setPostAuthRedirect(null)
    }
  }, [isLoggedIn, postAuthRedirect, router])

  const getLink = useMemo(() => {
    return item.href
  }, [item.href])

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          key={`sidebar-${item.label}`}
          className={cn(
            "ease-out-quint flex h-9 w-full cursor-pointer flex-nowrap items-center gap-2 rounded-[6px] p-[6px] no-underline transition-colors duration-200 hover:bg-neutral-600 disabled:pointer-events-none disabled:opacity-40",
            (pathname === item.href || (item.label === "Profile" && pathname === "/profile")) ? "bg-neutral-600" : "bg-transparent",
            !user && item.label === "Profile" && "hidden",
            itemClassName
          )}
          href={getLink}
          aria-current="page"
          onClick={handleClick}
        >
          <div className="flex items-center justify-center">
            <div className="flex h-6 w-6 items-center justify-center">
              <span className={cn(iconClassName)}>
                {item.label === "Profile" ? (
                  <Image
                    src={user?.avatar_url || defaultUserImage}
                    alt={user?.username ?? "avatar"}
                    width={20}
                    height={20}
                    className="aspect-square h-5 w-5 rounded-full object-cover"
                  />
                ) : (
                  item.icon
                )}
              </span>
            </div>
          </div>
          <div className="order-2 flex flex-auto flex-col items-start justify-center self-stretch overflow-hidden">
            <div className="flex w-full justify-between">
              <span
                className={cn(
                  "font-inherit text-md leading-normal whitespace-nowrap transition-opacity",
                  isExpanded ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                  labelClassName
                )}
              >
                {item.label}
              </span>
              {item.label === "Referral Link" && (
                <span className="text-xs text-neutral-300">
                  <Copy copy={referralLink} size={16} className="text-neutral-300 duration-200 hover:opacity-75" />
                </span>
              )}
            </div>
          </div>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" align="center" sideOffset={10}>
        {item.label}
      </TooltipContent>
    </Tooltip>
  )
}

export default SidebarNavItem
