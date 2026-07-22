"use client"

import { useDynamicContext, useIsLoggedIn } from "@dynamic-labs/sdk-react-core"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { useMobileDrawer } from "@/context/mobile-ui-context"
import { cn } from "@/lib/utils"
import { useProfile } from "@/hooks/use-profile"
import { useAccount, useBalance } from "wagmi"
import { SimpleConnectWalletButton } from "../connect-wallet-button"
import { Sheet, SheetContent } from "../ui/sheet"
import { Home, MultipleStar, Settings, Token, Signout, Deposit, Ip } from "../icons"
import { Referral } from "../icons/referral"
import { X, User, ChevronRight, MessageSquare } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import defaultUserImage from "@/public/images/default-user.png"
import { formatNumber } from "@/lib/number"
import { bigNumberToFloat } from "@/lib/bignumber"
import Copy from "../copy"
import DepositModal from "../modals/deposit-modal"
import FeedbackModal from "../modals/feedback-modal"
import { useBetaFeedback } from "@/hooks/use-beta-feedback"

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: <Home size={22} /> },
  { label: "Coins", href: "/coins", icon: <Token size={22} /> },
  { label: "Rewards", href: "/leaderboard", icon: <MultipleStar size={22} />, requiresLogin: true },
  { label: "Profile", href: "/profile", icon: <User size={22} />, requiresLogin: true },
  { label: "Settings", href: "/settings", icon: <Settings size={22} />, requiresLogin: true },
]

export default function MobileDrawer() {
  const { isOpen, closeDrawer } = useMobileDrawer()
  const isLoggedIn = useIsLoggedIn()
  const pathname = usePathname()
  const prevPathname = useRef(pathname)
  const { handleLogOut } = useDynamicContext()
  const { user } = useProfile()
  const { address } = useAccount()
  const { data: balance } = useBalance({ address })
  const [depositOpen, setDepositOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const { submitFeedback, submitBugReport } = useBetaFeedback()

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      closeDrawer()
      prevPathname.current = pathname
    }
  }, [pathname, closeDrawer])

  const logout = async () => {
    try {
      await handleLogOut()
      closeDrawer()
    } catch (error) {
      toast.error("Failed to sign out")
      console.error(error)
    }
  }

  const getProfileLink = () => {
    return "/profile"
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={closeDrawer}>
        <SheetContent
          side="right"
          className="flex h-full w-full max-w-full flex-col border-0 bg-black p-0"
        >
          {/* Header: Close button */}
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <div className="text-lg font-semibold text-white">Menu</div>
            <button
              onClick={closeDrawer}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-800 text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* User info + balance */}
          {isLoggedIn && user ? (
            <div className="mx-5 mt-2 rounded-2xl bg-neutral-800 border border-neutral-600 p-4">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full">
                  <Image
                    src={user.avatar_url || defaultUserImage}
                    alt="profile"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col">
                  <div className="text-xl font-bold text-white">@{user.username}</div>
                </div>
              </div>

              {/* Balance */}
              <div className="mt-5 flex items-center gap-2 px-1">
                <Ip size={18} />
                <span className="font-mono text-2xl font-bold text-white">
                  {formatNumber(bigNumberToFloat(balance?.value ?? "0", balance?.decimals ?? 0), 2, true)}
                </span>
                <span className="text-sm text-neutral-400">IP</span>
              </div>

              {/* Deposit / Withdraw */}
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => { setDepositOpen(true); closeDrawer() }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-[12px] bg-white py-3 text-sm font-semibold text-black transition-colors hover:bg-neutral-200"
                >
                  <Deposit size={16} />
                  Deposit
                </button>
                <button
                  disabled
                  className="flex flex-1 items-center justify-center gap-2 rounded-[12px] border border-neutral-600 bg-neutral-800 py-3 text-sm font-semibold text-neutral-400 cursor-not-allowed opacity-50"
                >
                  Withdraw
                </button>
              </div>
            </div>
          ) : (
            <div className="mx-5 mt-2">
              <SimpleConnectWalletButton />
            </div>
          )}

          {/* Navigation */}
          <div className="mt-6 flex flex-1 flex-col px-5">
            <div className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                if (item.requiresLogin && !isLoggedIn) return null
                const href = item.label === "Profile" ? getProfileLink() : item.href
                const isActive = pathname === href || (item.href !== "/" && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.label}
                    href={href}
                    onClick={closeDrawer}
                    className={cn(
                      "flex items-center gap-4 rounded-[12px] px-4 py-3.5 text-base font-medium transition-colors",
                      isActive
                        ? "bg-neutral-800 text-white"
                        : "text-neutral-300 hover:bg-neutral-800/50 hover:text-white"
                    )}
                  >
                    <span className={cn(isActive ? "text-white" : "text-neutral-400")}>{item.icon}</span>
                    {item.label}
                    <ChevronRight size={16} className="ml-auto text-neutral-500" />
                  </Link>
                )
              })}
            </div>

            {/* Bottom section */}
            <div className="mt-auto pb-8">
              {/* Feedback */}
              {isLoggedIn && (
                <button
                  onClick={() => { setFeedbackOpen(true); closeDrawer() }}
                  className="mb-3 flex w-full items-center gap-4 rounded-[12px] px-4 py-3.5 text-base font-medium text-neutral-300 transition-colors hover:bg-neutral-800/50 hover:text-white"
                >
                  <span className="text-neutral-400"><MessageSquare size={22} /></span>
                  Feedback
                  <ChevronRight size={16} className="ml-auto text-neutral-500" />
                </button>
              )}

              {/* Referral link */}
              {isLoggedIn && user?.referral_code && (
                <div className="mb-6 rounded-[12px] bg-neutral-900 border border-neutral-700 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Referral size={16} />
                      <span className="text-base text-neutral-300">Reflink</span>
                    </div>
                    <Copy
                      copy={`https://ip.world/?ref=${user.referral_code}`}
                      text={user.referral_code}
                      className="text-base font-mono font-medium text-white"
                      size={16}
                    />
                  </div>
                </div>
              )}

              {/* Sign out */}
              {isLoggedIn && (
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-3 rounded-[12px] px-4 py-3.5 text-base font-medium text-red-400 transition-colors hover:bg-neutral-800/50"
                >
                  <Signout size={20} />
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <DepositModal open={depositOpen} onOpenChange={setDepositOpen} />
      <FeedbackModal
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        onSubmitFeedback={submitFeedback}
        onSubmitBugReport={submitBugReport}
      />
    </>
  )
}
