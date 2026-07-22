"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import ConnectWalletButton from "../connect-wallet-button"
import SearchDialog from "../dialog/search-dialog"
import { Search } from "../icons/search"

import { useProfile } from "@/hooks/use-profile"
import { Deposit } from "../icons"
import DepositModal from "../modals/deposit-modal"
import { useEffect, useRef, useState } from "react"
import useDock from "@/hooks/use-dock"
import { Separator } from "../ui/separator"
import { usePathname } from "next/navigation"
import { Plus } from "lucide-react"
import { NavBalanceButton } from "./nav-balance-button"
import { usePaymentCurrency } from "@/context/payment-currency-context"
import { useAccount } from "@/hooks/use-account"

const Navbar = () => {
  const [depositOpen, setDepositOpen] = useState(false)
  const { paymentCurrency } = usePaymentCurrency()
  // const isMobile = useIsMobileView()
  const { user } = useProfile()
  const pathname = usePathname()
  const isHomePage = pathname === "/"
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const platform =
    (navigator as Navigator & { userAgentData?: { platform: string } }).userAgentData?.platform ||
    navigator.platform ||
    "unknown"
  const isMac = /Mac/i.test(platform)
  const kbdShortcut = isMac ? "⌘ K" : "Ctrl+K"
  const { isDocked } = useDock({ threshold: 20, offset: 0 })

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const target = e.currentTarget as HTMLElement
      target.scrollLeft += e.deltaY / 5
    }
    if (scrollContainerRef.current) {
      scrollContainerRef.current.addEventListener("wheel", handleWheel)
    }
    return () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.removeEventListener("wheel", handleWheel)
      }
    }
  }, [])

  return (
    <div
      className={cn(
        "sticky top-0 z-50 hidden flex-col border-b border-neutral-500 bg-[#111111]/90 backdrop-blur-md transition-all duration-500 sm:flex",
      )}
    >
      <nav
        className={cn(
          "sticky top-0 flex h-[56px] flex-col items-center justify-end gap-2 px-2 py-2 transition-all md:h-[56px] md:flex-row"
        )}
      >
        <SearchDialog
          trigger={
            <div
              className={cn(
                "flex w-[439px] origin-left cursor-pointer items-center justify-center gap-2 rounded-full border-0 border-transparent bg-neutral-600/50 px-3 py-1.5 text-sm font-medium text-neutral-300 transition-all duration-500 hover:bg-neutral-500/50",
                isDocked && "scale-95"
              )}
            >
              <Search size={14} />
              <div className="flex-1">Search coins</div>
              <div className="text-xxs rounded-full! border bg-neutral-800 px-1.5 py-1 text-neutral-300">
                {kbdShortcut}
              </div>
            </div>
          }
        />
        <div className="relative z-0 h-full flex-1">

        </div>
        <div className={cn("flex origin-right items-center gap-2 transition-all duration-500", isDocked && "scale-95")}>
          {user && (
            <>
              <div
                onClick={() => setDepositOpen(true)}
                className="flex h-[36px] cursor-pointer items-center gap-2 rounded-full border border-neutral-600 px-4 text-sm font-medium text-white transition-all hover:border-neutral-500 hover:bg-white/5"
              >
                <Deposit size={16} />
                <span>Deposit</span>
              </div>
              <DepositModal open={depositOpen} onOpenChange={setDepositOpen} defaultFromToken={paymentCurrency} />
              <NavBalanceButton />
            </>
          )}
          <Link
            href="/create"
            className={cn(
              "focus-visible:ring-ring hover-elevate active-elevate-2 hover:text-foreground hidden h-8 min-h-9 items-center justify-center gap-2 rounded-full border border-neutral-600 bg-transparent px-3 py-2 text-sm font-medium whitespace-nowrap shadow-xs transition-all hover:border-neutral-400 hover:bg-white/5 focus-visible:ring-1 focus-visible:outline-none active:shadow-none disabled:pointer-events-none disabled:opacity-50 md:flex [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
            )}
          >
            <Plus size={10} />
            Create
          </Link>
          <Separator orientation="vertical" className="h-5!" />
          <ConnectWalletButton />
        </div>
      </nav>
    </div>
  )
}

export default Navbar
