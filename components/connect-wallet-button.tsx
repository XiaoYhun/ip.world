"use client"

import {
  DynamicConnectButton,
  DynamicUserProfile,
  useDynamicContext,
} from "@dynamic-labs/sdk-react-core"
import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { JSX, useState } from "react"
import { useAccount } from "@/hooks/use-account"

import Image from "@/components/image"
import defaultUserImage from "@/public/images/default-user.png"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useProfile } from "@/hooks/use-profile"
import useGetTokenBalances from "@/hooks/use-get-token-balances"
import { truncateAddress } from "@/lib/strings"
import { cn } from "@/lib/utils"
import Copy from "./copy"
import { ExternalLink, Question, Settings, Signout } from "./icons"
import { env } from "@/config"
import DepositModal from "./modals/deposit-modal"
import WithdrawModal from "./modals/withdraw-modal"
import { usePortfolio } from "@/context/portfolio-context"

const ConnectWalletButton = () => {
  const { isConnected, address } = useAccount()
  const { handleLogOut } = useDynamicContext()
  const { user } = useProfile()

  const { openPortfolio } = usePortfolio()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isDepositOpen, setIsDepositOpen] = useState(false)
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false)

  const handleOpenPortfolio = () => {
    setDropdownOpen(false)
    openPortfolio()
  }

  useGetTokenBalances(address)

  return (
    <>
      {isConnected && address && user?.username ? (
        <>
          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <div className="group -my-1 flex cursor-pointer items-center gap-2 rounded-[12px] px-2 py-1 transition-all hover:bg-neutral-700">
                <Image
                  src={user?.avatar_url || defaultUserImage}
                  alt={user?.username ?? "avatar"}
                  width={32}
                  height={32}
                  className="aspect-square h-8 w-8 rounded-full object-cover"
                />
                <div className="flex flex-col gap-1">
                  <span className="max-w-[180px] truncate text-sm font-medium text-ellipsis text-white">
                    @{/^0x[a-fA-F0-9]{10,}$/.test(user?.username ?? '') ? truncateAddress(user.username) : user?.username}
                  </span>
                  <span className="font-mono text-[11px] text-neutral-300">{truncateAddress(address)}</span>
                </div>
                <div className="text-neutral-300 transition-all group-hover:text-neutral-100">
                  <ChevronRight size={12} />
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="z-100 w-[320px] rounded-[16px] border border-neutral-500 bg-neutral-700/90 p-5"
              portal={true}
              style={{ backdropFilter: "blur(32px)", boxShadow: "0 12px 40px 0 rgba(0, 0, 0, 0.50)" }}
            >
              {/* User card — non-interactive areas open portfolio */}
              <div
                className="mb-3 flex cursor-pointer flex-col gap-5 rounded-[12px] border-[0.5px] border-neutral-500 p-4 bg-dots [--dot-color:#1E1E1E] transition-colors hover:bg-white/1"
                onClick={handleOpenPortfolio}
              >
                <div className="flex items-center justify-between">
                  <DropdownMenuItem asChild className="cursor-pointer p-0 max-w-[175px]">
                    <Link
                      href="/profile"
                      onClick={(e) => e.stopPropagation()}
                      className="flex flex-1 items-center gap-2 rounded-[10px] transition-colors hover:bg-white/10 p-1 !cursor-pointer"
                    >
                      <div className="relative size-9 shrink-0">
                        <Image
                          src={user?.avatar_url || defaultUserImage}
                          alt={user?.username ?? "avatar"}
                          fill
                          className="rounded-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="max-w-[130px] truncate text-sm font-medium text-white">
                          @{/^0x[a-fA-F0-9]{10,}$/.test(user?.username ?? "") ? truncateAddress(user.username) : user?.username}
                        </span>
                        <span className="flex items-center gap-1 font-mono text-xs text-neutral-200">
                          {truncateAddress(address)}
                          <span
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              window.open(`${env.NEXT_PUBLIC_EXPLORER_URL}/address/${address}`, "_blank", "noopener,noreferrer")
                            }}
                            className="cursor-pointer !text-neutral-300 transition-colors hover:!text-white mb-[1px]"
                          >
                            <ExternalLink size={9} className="text-inherit" />
                          </span>
                        </span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <div
                    className="rounded-[8px] border bg-neutral-500/50 px-2 py-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Copy
                      copy={address}
                      text="Copy"
                      hideIcon={false}
                      variant="overlap"
                      iconPosition="left"
                      className="text-xs font-medium text-neutral-200 hover:text-white"
                    />
                  </div>
                </div>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem asChild>
                    <button
                      onClick={() => setIsDepositOpen(true)}
                      className="flex h-9 flex-1 cursor-pointer items-center justify-center border-[0.5px] border-neutral-500 bg-neutral-600 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-500!"
                      style={{ borderRadius: 31, boxShadow: "0px 16px 16px 0px rgba(12,12,13,0.1), 0px 4px 4px 0px rgba(12,12,13,0.05)" }}
                    >
                      Deposit
                    </button>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <button
                      onClick={() => setIsWithdrawOpen(true)}
                      className="flex h-9 flex-1 cursor-pointer items-center justify-center border-[0.5px] border-neutral-500 bg-neutral-600 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-500!"
                      style={{ borderRadius: 31, boxShadow: "0px 16px 16px 0px rgba(12,12,13,0.1), 0px 4px 4px 0px rgba(12,12,13,0.05)" }}
                    >
                      Withdraw
                    </button>
                  </DropdownMenuItem>
                </div>
              </div>

              {/* Menu items */}
              <div className="mb-3 flex flex-col gap-0.5">
                <DropdownMenuItem asChild>
                  <Link
                    href="/settings"
                    className="flex cursor-pointer items-center gap-2.5 rounded-[8px] bg-transparent! px-3 py-2.5 text-sm font-medium text-neutral-200 transition-colors hover:bg-white/5! hover:text-white"
                  >
                    <Settings size={14} />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="https://discord.gg/ipworld"
                    target="_blank"
                    className="flex cursor-pointer items-center gap-2.5 rounded-[8px] bg-transparent! px-3 py-2.5 text-sm font-medium text-neutral-200 transition-colors hover:bg-white/5! hover:text-white"
                  >
                    <Question size={14} />
                    Support
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <button
                    onClick={handleLogOut}
                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-[8px] bg-transparent! px-3 py-2.5 text-sm font-medium text-red transition-colors hover:bg-red/10!"
                  >
                    <Signout size={14} />
                    Sign Out
                  </button>
                </DropdownMenuItem>
              </div>

              {/* Divider */}
              <div className="mb-3 h-px w-full bg-white/10" />

              {/* Referral link section */}
              <div className="rounded-[12px] border border-neutral-500 bg-neutral-600/50 p-3">
                <div className="mb-2 text-xs font-semibold text-neutral-300">Referral Link</div>
                <div className="flex items-center gap-2 rounded-[8px] border border-neutral-500 bg-neutral-600 px-3 py-2.5">
                  <span className="flex-1 truncate font-mono text-sm text-white">
                    ip.world/<span className="text-neutral-300">?ref={user?.referral_code ?? "—"}</span>
                  </span>
                  {user?.referral_code && (
                    <Copy
                      copy={`https://ip.world/?ref=${user.referral_code}`}
                      hideIcon={false}
                      variant="overlap"
                      className="shrink-0 text-neutral-200 hover:text-white"
                    />
                  )}
                </div>
              </div>
            </DropdownMenuContent>
            <DynamicUserProfile />
          </DropdownMenu>
        </>
      ) : (
        <SimpleConnectWalletButton />
      )}

      <DepositModal open={isDepositOpen} onOpenChange={setIsDepositOpen} />
      <WithdrawModal open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen} />
    </>
  )
}

export const SimpleConnectWalletButton = ({
  className,
  suffixIcon,
}: {
  className?: string
  suffixIcon?: JSX.Element
}) => {
  return (
    <DynamicConnectButton
      buttonContainerClassName="!rounded-0"
      buttonClassName={cn(
        "cursor-pointer items-center justify-center whitespace-nowrap focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover-elevate active-elevate-2 border shadow-xs active:shadow-none min-h-9 py-2 hidden md:flex gap-2 text-sm border-white/10 bg-transparent hover:bg-white/5! hover:text-foreground font-medium rounded-full transition-all h-8 px-3",
        className
      )}
    >
      <div className="flex items-center gap-1.5">Login {!!suffixIcon && suffixIcon}</div>
    </DynamicConnectButton>
  )
}

export default ConnectWalletButton
