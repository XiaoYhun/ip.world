"use client"

import { usePathname } from "next/navigation"
import NavbarTrendingTokenList from "./NavbarTrendingTokenList"
import { Remix } from "@/types/remix"
import { cn } from "@/lib/utils"

const MARQUEE_ROUTES = ["/", "/coins"]

export default function MarqueeWrapper({ trendingTokens }: { trendingTokens: Remix[] }) {
  const pathname = usePathname()
  const show = MARQUEE_ROUTES.includes(pathname) || pathname.startsWith("/token/")

  if (!show) return null

  const isTokenPage = pathname.startsWith("/token/")

  return (
    <div
      className={cn(
        "w-full min-w-0 overflow-x-hidden py-3 no-scrollbar",
        isTokenPage && "hidden sm:block"
      )}
    >
      <NavbarTrendingTokenList trendingTokens={trendingTokens} />
    </div>
  )
}
