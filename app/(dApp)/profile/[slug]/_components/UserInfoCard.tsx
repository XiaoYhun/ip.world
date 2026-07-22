import { Chain, Ip, Pencil, Solana, Tiktok, Twitter, Usdc } from "@/components/icons"
import Copy from "@/components/copy"
import StoryExplorerLink from "@/components/story-explorer-link"
import { useNavigation } from "@/context/navigation-context"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useAccount } from "@/hooks/use-account"
import { useProfile } from "@/hooks/use-profile"
import { truncateAddress } from "@/lib/strings"
import { Ip as IpType } from "@/types/ip"
import { User, UserStats } from "@/types/profile"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { EyeOff } from "lucide-react"
import { useSocialVisibility } from "@/hooks/use-social-visibility"
import { formatUnits, isAddress } from "viem"
import { UserAvatarWithRank } from "./UserAvatarWithRank"
import { UserPnl } from "@/hooks/use-pnl"
import { formatNumber, formatNumberWithSuffix, formatUSD, formatUsdParts } from "@/lib/number"
import { UgcStats } from "@/types/profile"
import { useEmbeddedWallets } from "@/hooks/use-embedded-wallets"
import { TIER_CONFIG } from "@/lib/constants"
import { IpInfoDialog } from "@/components/remixes/ip-info-badge"
import { useUnifiedUsdcBalance } from "@/hooks/use-unified-usdc-balance"
import { useSolanaBalances } from "@/context/solana-balances-context"
import { useBalance } from "wagmi"

function StatsCard({
  pnl,
  ugc,
  total_pnl,
  ipBalanceFormatted,
  ipBalanceExact,
  usdcBalanceFormatted,
  usdcBalanceExact,
  solBalanceFormatted,
  solBalanceExact,
  showBalances,
}: {
  pnl: UserPnl | null
  ugc?: UgcStats
  total_pnl: { dollars: string; cents: string }
  ipBalanceFormatted: string
  ipBalanceExact: string
  usdcBalanceFormatted: string
  usdcBalanceExact: string
  solBalanceFormatted: string
  solBalanceExact: string
  // Native / USDC / SOL balances are viewer-scoped (connected wallet context),
  // so we only render them when the viewer is looking at their own profile.
  showBalances: boolean
}) {
  const hasTradingStats = !!pnl
  const hasUgcStats = !!ugc
  const [statsTab, setStatsTab] = useState<"trading" | "ugc">("trading")

  if (!hasTradingStats && !hasUgcStats) return null

  return (
    <div className="px-3 pb-3">
      <div className="rounded-[12px] border border-neutral-500 bg-neutral-700 w-full mt-12">
        {/* Tab header */}
        <div className="relative z-1 -mb-9 flex items-center gap-1 rounded-[12px] bg-neutral-600 p-1.5 pb-10">
          <button
            onClick={() => setStatsTab("trading")}
            className={cn(
              "rounded-[10px] px-3 py-1.5 text-xs font-medium transition-colors",
              statsTab === "trading" ? "bg-neutral-500 text-white" : "text-neutral-300 hover:text-white"
            )}
          >
            Trading Stats
          </button>
          <button
            onClick={() => setStatsTab("ugc")}
            className={cn(
              "rounded-[10px] px-3 py-1.5 text-xs font-medium transition-colors",
              statsTab === "ugc" ? "bg-neutral-500 text-white" : "text-neutral-300 hover:text-white"
            )}
          >
            UGC Stats
          </button>
        </div>

        {/* Tab content */}
        <div className="overflow-hidden rounded-[12px] border border-neutral-500 bg-[#171717] relative z-2 -m-px min-h-[155px]">
          {statsTab === "trading" && hasTradingStats && (
            <>
              <div className="px-4 py-4">
                <div className="mb-4 text-xs text-neutral-300">Total PNL</div>
                <div className={cn("font-mono text-2xl font-medium flex justify-between w-full items-center", Number(pnl.total_pnl_usd) === 0 ? "text-white" : Number(pnl.total_pnl_usd) > 0 ? "text-green-neon" : "text-pink-neon")}>
                  <span>
                    {total_pnl.dollars}
                    <span className={cn(Number(pnl.total_pnl_usd) === 0 ? "text-white" : Number(pnl.total_pnl_usd) > 0 ? "text-[#578017]!" : "text-[#AA3577]!")}>
                      {total_pnl.cents}
                    </span>
                  </span>
                  <span className="ml-2 text-sm">
                    ({Number(pnl.total_pnl_percentage) >= 0 ? "+" : ""}
                    {formatNumber(Number(pnl.total_pnl_percentage), 2, true)}%)
                  </span>
                </div>
              </div>
              <div className="border-t border-neutral-600 flex justify-between items-center">
                <div
                  className={cn(
                    "flex flex-col justify-between gap-2 px-4 py-4 flex-1",
                    showBalances && "border-r"
                  )}
                >
                  <span className="text-xxs text-neutral-300 uppercase">Value</span>
                  <span className="font-mono text-base font-medium text-white -ml-px">
                    {formatUSD(pnl.total_holding_usd)}
                  </span>
                </div>
                {showBalances && (
                  <div className="flex flex-col justify-between gap-2 pl-3 pr-3 py-4 flex-1 min-w-0 overflow-hidden">
                    <span className="text-xxs text-neutral-300 uppercase">Balances</span>
                    <div className="flex items-center gap-1.5 font-medium -ml-px">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 cursor-default">
                            <Ip size={12} />
                            <span className="text-xs text-white">{ipBalanceFormatted}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top">{ipBalanceExact} IP</TooltipContent>
                      </Tooltip>
                      <div className="h-3.5 w-px shrink-0 bg-neutral-500" />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 cursor-default">
                            <Usdc size={12} />
                            <span className="text-xs text-white">{usdcBalanceFormatted}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top">{usdcBalanceExact} USDC</TooltipContent>
                      </Tooltip>
                      <div className="h-3.5 w-px shrink-0 bg-neutral-500" />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 cursor-default">
                            <Solana size={12} />
                            <span className="text-xs text-white">{solBalanceFormatted}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top">{solBalanceExact} SOL</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {statsTab === "ugc" && hasUgcStats && (() => {
            const { dollars, cents } = formatUsdParts(ugc.total_earning_usd)
            return (
              <>
                <div className="px-4 py-4">
                  <div className="mb-4 text-xs text-neutral-300">Total Earnings</div>
                  <div className="font-mono text-2xl font-medium flex justify-between w-full items-center">
                    <span>
                      {dollars}
                      <span className="text-neutral-300">{cents}</span>
                    </span>
                  </div>
                </div>
                <div className="border-t border-neutral-600 px-4 py-4">
                  <div className="flex flex-col justify-between gap-2">
                    <span className="text-xxs text-neutral-300 uppercase">IMPRESSIONS</span>
                    <span className="font-mono text-base font-medium text-white">
                      {formatNumberWithSuffix(ugc.total_impressions)}
                    </span>
                  </div>
                </div>
              </>
            )
          })()}
        </div>
      </div>
    </div>
  )
}

export const UserInfoCardSkeleton = () => (
  <div
    className="relative max-w-[330px] w-[330px] rounded-[16px] border border-neutral-600 bg-neutral-800 overflow-hidden flex flex-col"
    style={{ boxShadow: "0 2px 12px 0 rgba(0, 0, 0, 0.50)" }}
  >
    {/* Header */}
    <div className="relative bg-chessboard px-2 pt-10 pb-9 border-b border-neutral-600">
      <div className="flex flex-col items-center gap-2">
        <div className="size-16 animate-pulse rounded-full bg-neutral-600" />
        <div className="flex w-full flex-col items-center gap-1.5">
          <div className="h-5 w-28 animate-pulse rounded bg-neutral-600" />
          <div className="h-3 w-20 animate-pulse rounded bg-neutral-700" />
          <div className="w-full px-4 mt-6">
            <div className="h-5 w-20 animate-pulse rounded bg-neutral-600 mb-2" />
            <div className="h-1.5 w-full animate-pulse rounded-full bg-neutral-600 mb-2" />
            <div className="flex justify-between">
              <div className="h-2.5 w-24 animate-pulse rounded bg-neutral-700" />
              <div className="h-2.5 w-20 animate-pulse rounded bg-neutral-700" />
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Stats row */}
    <div className="w-full">
      <div className="flex justify-between gap-2 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-[8px] p-2.5 bg-neutral-700 flex-1">
            <div className="h-2.5 w-14 animate-pulse rounded bg-neutral-500 mb-2" />
            <div className="h-4 w-8 animate-pulse rounded bg-neutral-500" />
          </div>
        ))}
      </div>
    </div>

    {/* StatsCard skeleton */}
    <div className="px-3 pb-3">
      <div className="rounded-[12px] border border-neutral-500 bg-neutral-700 w-full mt-12">
        <div className="relative z-1 -mb-9 rounded-[12px] bg-neutral-600 p-1.5 pb-10">
          <div className="h-6 w-40 animate-pulse rounded-[10px] bg-neutral-500" />
        </div>
        <div className="overflow-hidden rounded-[12px] border border-neutral-500 bg-[#171717] relative z-2 -m-px min-h-[155px]">
          <div className="px-4 py-4">
            <div className="mb-4 h-2.5 w-16 animate-pulse rounded bg-neutral-600" />
            <div className="flex items-center justify-between">
              <div className="h-7 w-32 animate-pulse rounded bg-neutral-600" />
              <div className="h-4 w-14 animate-pulse rounded bg-neutral-700" />
            </div>
          </div>
          <div className="flex border-t border-neutral-600">
            <div className="flex-1 border-r px-4 py-4">
              <div className="h-2.5 w-10 animate-pulse rounded bg-neutral-600 mb-2" />
              <div className="h-4 w-20 animate-pulse rounded bg-neutral-600" />
            </div>
            <div className="flex-1 px-4 py-4">
              <div className="h-2.5 w-14 animate-pulse rounded bg-neutral-600 mb-2" />
              <div className="h-4 w-24 animate-pulse rounded bg-neutral-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)

const LaurelLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="30" height="51" viewBox="0 0 30 51" fill="none">
    <path d="M11.454 0C1.119 3.13014 7.27385 12.8887 7.27385 12.8887C7.27385 12.8887 14.5873 10.336 11.454 0Z" fill="#797979" />
    <path d="M10.4021 25.5256L10.4 25.5214C10.7038 25.3856 17.927 22.063 15.4568 13.9038C15.4568 13.9038 7.99904 14.4366 9.43191 22.4666C8.1794 19.4955 5.48118 15.3071 0.02566 14.4048C-0.599395 30.2638 10.4023 25.5253 10.4023 25.5253L10.4021 25.5256Z" fill="#797979" />
    <path d="M17.0248 37.6803C17.1543 37.5784 23.767 32.352 18.7984 24.3467C18.7984 24.3467 11.4328 26.8901 14.5992 34.5234C12.3615 32.2073 8.62088 29.5782 3.53882 30.2966C7.67097 45.5488 16.8663 37.8159 17.0246 37.6801L17.0248 37.6803Z" fill="#797979" />
    <path d="M25.2087 32.8052C25.2087 32.8052 19.0935 37.8153 24.9177 43.9336C21.7216 42.7928 16.7636 41.9659 12.2351 45.18C23.414 57.3778 28.3082 45.5407 28.3082 45.5407L28.3061 45.5376C29.3143 43.3466 31.1975 37.465 25.2078 32.8054L25.2087 32.8052Z" fill="#797979" />
  </svg>
)

const LaurelRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="30" height="51" viewBox="0 0 30 51" fill="none">
    <path d="M17.9479 0C28.2829 3.13014 22.1281 12.8887 22.1281 12.8887C22.1281 12.8887 14.8147 10.336 17.9479 0Z" fill="#797979" />
    <path d="M18.9998 25.5256L19.0019 25.5214C18.6982 25.3856 11.4749 22.063 13.9451 13.9038C13.9451 13.9038 21.4029 14.4366 19.97 22.4666C21.2225 19.4955 23.9208 15.3071 29.3763 14.4048C30.0013 30.2638 18.9997 25.5253 18.9997 25.5253L18.9998 25.5256Z" fill="#797979" />
    <path d="M12.3769 37.6803C12.2473 37.5784 5.63465 32.352 10.6033 24.3467C10.6033 24.3467 17.9689 26.8901 14.8025 34.5234C17.0402 32.2073 20.7808 29.5782 25.8629 30.2966C21.7307 45.5488 12.5354 37.8159 12.3771 37.6801L12.3769 37.6803Z" fill="#797979" />
    <path d="M4.19304 32.8052C4.19304 32.8052 10.3082 37.8153 4.48397 43.9336C7.6801 42.7928 12.6381 41.9659 17.1666 45.18C5.9877 57.3778 1.09351 45.5407 1.09351 45.5407L1.09558 45.5376C0.0873775 43.3466 -1.79582 37.465 4.19388 32.8054L4.19304 32.8052Z" fill="#797979" />
  </svg>
)

export default function UserInfoCard({
  user,
  stats,
  ip,
  points = 0,
  coinsCreated = 0,
  referrals = 0,
  ugcPosts = 0,
  nextRank = "Legend",
  pointsToGo = 0,
  progressPercent = 100,
  pnl = null,
  ugc,
  isLoading = false,
  displayName,
}: {
  user: User
  stats: UserStats
  ip?: IpType
  points?: number
  coinsCreated?: number
  referrals?: number
  ugcPosts?: number
  nextRank?: string
  pointsToGo?: number
  progressPercent?: number
  pnl?: UserPnl | null
  ugc?: UgcStats
  isLoading?: boolean
  displayName?: string
}) {
  const { address: connectedAddress } = useAccount()
  const { user: connectedUser } = useProfile()
  const { previousPage, setPreviousPage, clearPreviousPage } = useNavigation()

  // Determine tier from API or calculate from points
  const tierName = useMemo(() => {
    if (stats?.tier) return stats.tier === "GOAT" ? "Legend" : stats.tier
    const p = points || stats?.total_points || 0
    if (p >= 15000) return "Legend"
    if (p >= 6000) return "Trencher"
    if (p >= 2000) return "Degen"
    if (p >= 500) return "Casual"
    return "Normie"
  }, [stats?.tier, stats?.total_points, points])
  const tierConfig = TIER_CONFIG[tierName as keyof typeof TIER_CONFIG] || null
  const [showIpDialog, setShowIpDialog] = useState(false)
  const router = useRouter()
  const isOwnProfile = useMemo(() => {
    const addrs = new Set<string>()
    if (connectedAddress) addrs.add(connectedAddress.toLowerCase())
    if (connectedUser?.wallet_address) addrs.add(connectedUser.wallet_address.toLowerCase())
    if (connectedUser?.embedded_wallet_address) addrs.add(connectedUser.embedded_wallet_address.toLowerCase())
    if (addrs.size === 0) return false
    if (user?.wallet_address && addrs.has(user.wallet_address.toLowerCase())) return true
    if (user?.embedded_wallet_address && addrs.has(user.embedded_wallet_address.toLowerCase())) return true
    return false
  }, [connectedAddress, connectedUser, user])
  const { visibility } = useSocialVisibility()

  const getUsername = displayName || (user?.wallet_address ? truncateAddress(user.wallet_address) : "")

  const handleEditProfileClick = () => {
    setPreviousPage("profile")
    router.push("/settings")
  }

  const total_pnl = useMemo(() => formatUsdParts(pnl?.total_pnl_usd ?? 0), [pnl?.total_pnl_usd])

  const { evmAddress } = useEmbeddedWallets()
  const { data: ipBalanceData } = useBalance({
    address: evmAddress,
    // Only query when viewing own profile — the balance refers to the
    // connected wallet, not to the profile being viewed.
    query: { enabled: !!evmAddress && isOwnProfile, staleTime: 10_000, refetchOnWindowFocus: false },
  })
  const unifiedUsdc = useUnifiedUsdcBalance()
  const { solBalance } = useSolanaBalances()

  const formatTokenBalance = (value: number, minThreshold = 0.01, decimals = 2): string => {
    if (value < minThreshold) return "0"
    if (value >= 10000) return `${Math.floor(value / 1000)}k`
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
    return value.toFixed(decimals)
  }

  const ipValue = useMemo(
    () => parseFloat(formatUnits(ipBalanceData?.value ?? BigInt(0), 18)),
    [ipBalanceData?.value]
  )
  const usdcValue = useMemo(() => unifiedUsdc.totalUsdc, [unifiedUsdc.totalUsdc])
  const solValue = useMemo(() => solBalance, [solBalance])

  const ipBalanceFormatted = useMemo(() => formatTokenBalance(ipValue, 0, 0), [ipValue])
  const usdcBalanceFormatted = useMemo(() => formatTokenBalance(usdcValue, 0, 0), [usdcValue])
  const solBalanceFormatted = useMemo(() => formatTokenBalance(solValue, 0, 0), [solValue])

  const ipBalanceExact = useMemo(() => ipValue.toFixed(4), [ipValue])
  const usdcBalanceExact = useMemo(() => usdcValue.toFixed(4), [usdcValue])
  const solBalanceExact = useMemo(() => solValue.toFixed(4), [solValue])

  const displayAddress = useMemo(() => {
    if (user?.embedded_wallet_address && isAddress(user.embedded_wallet_address)) {
      return user.embedded_wallet_address
    }
    return user?.wallet_address
  }, [user])

  if (isLoading) return <UserInfoCardSkeleton />

  return (
    <div
      className="relative max-w-[330px] w-[330px] rounded-[16px] border border-neutral-600 bg-neutral-800 overflow-hidden flex flex-col"
      style={{ boxShadow: "0 2px 12px 0 rgba(0, 0, 0, 0.50)" }}
    >
      {/* Header with chessboard + glow */}
      <div className="relative bg-chessboard px-2 pt-10 pb-9 border-b border-neutral-600 overflow-hidden">
        <div
          className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 w-[280px] h-[280px] rounded-full pointer-events-none blur-[50px] opacity-[0.025]"
          style={{ background: "conic-gradient(from 220deg, #00E040, #50FF00, #CCE000, #FFD700, #FF8C00, #FF4500, #FF0050, #A020D0, #7B2FBE, #6A30C0, #5535C8, #4038D0, #2080FF, #00E040)" }}
        />

        {stats?.rank != null && stats.rank > 0 && stats.rank <= 100 && (
          <div className="absolute top-4 right-4 z-10 flex items-center gap-1 rounded-full bg-[#321f4d] border border-[#8945e7]/60 px-2 py-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <g clipPath="url(#clip0_3980_2240)">
                <path d="M8.5 0.5C8.76522 0.5 9.0195 0.605432 9.20703 0.792969C9.39457 0.980506 9.5 1.23478 9.5 1.5H9.75C10.2141 1.5 10.6591 1.68451 10.9873 2.0127C11.3155 2.34088 11.5 2.78587 11.5 3.25C11.5 3.71413 11.3155 4.15912 10.9873 4.4873C10.6591 4.81549 10.2141 5 9.75 5H9.46387C9.35666 5.74322 9.01267 6.43731 8.47559 6.97461C8.18962 7.26057 7.8586 7.49209 7.5 7.66211V8.1377L7.50488 8.20117C7.5137 8.26427 7.53449 8.32527 7.56641 8.38086C7.59848 8.43659 7.64112 8.48595 7.69141 8.52539L7.74414 8.56152L7.78516 8.58887C8.16 8.86652 8.46498 9.2284 8.67578 9.64453C8.81262 9.9147 8.90684 10.2032 8.95703 10.5H10C10.2761 10.5 10.5 10.7239 10.5 11C10.5 11.2761 10.2761 11.5 10 11.5H2C1.72386 11.5 1.5 11.2761 1.5 11C1.5 10.7239 1.72386 10.5 2 10.5H3.04297C3.09316 10.2032 3.18738 9.9147 3.32422 9.64453C3.53502 9.2284 3.84 8.86652 4.21484 8.58887L4.25586 8.56152C4.32944 8.51767 4.39087 8.45511 4.43359 8.38086C4.47612 8.30679 4.49902 8.2231 4.5 8.1377V7.66211C4.1414 7.49209 3.81136 7.26057 3.52539 6.97461C2.98803 6.43725 2.64337 5.74344 2.53613 5H2.25C1.78587 5 1.34088 4.81549 1.0127 4.4873C0.684507 4.15912 0.5 3.71413 0.5 3.25C0.5 2.78587 0.684507 2.34088 1.0127 2.0127C1.34088 1.68451 1.78587 1.5 2.25 1.5H2.5C2.5 1.23478 2.60543 0.980505 2.79297 0.792969C2.9805 0.605432 3.23478 0.5 3.5 0.5H8.5ZM6.5 7.96387C6.33534 7.98762 6.16831 8 6 8C5.83169 8 5.66466 7.98762 5.5 7.96387V8.14844C5.49715 8.40518 5.42876 8.6573 5.30078 8.87988C5.17969 9.09028 5.00828 9.26754 4.80371 9.39746C4.55666 9.58189 4.35522 9.82065 4.21582 10.0957C4.15048 10.2247 4.10137 10.3609 4.06543 10.5H7.93457C7.89863 10.3609 7.84952 10.2247 7.78418 10.0957C7.64471 9.82052 7.44253 9.58192 7.19531 9.39746C6.99103 9.26758 6.82018 9.09006 6.69922 8.87988C6.57124 8.6573 6.50285 8.40518 6.5 8.14844V7.96387ZM3.5 4.5L3.50293 4.62402C3.53359 5.24191 3.79289 5.82805 4.23242 6.26758C4.70126 6.73642 5.33696 7 6 7C6.66304 7 7.29874 6.73642 7.76758 6.26758C8.23642 5.79874 8.5 5.16304 8.5 4.5V1.5H3.5V4.5ZM2.25 2.5C2.05109 2.5 1.86038 2.57907 1.71973 2.71973C1.57907 2.86038 1.5 3.05109 1.5 3.25C1.5 3.44891 1.57907 3.63962 1.71973 3.78027C1.86038 3.92093 2.05109 4 2.25 4H2.5V2.5H2.25ZM9.5 4H9.75C9.94891 4 10.1396 3.92093 10.2803 3.78027C10.4209 3.63962 10.5 3.44891 10.5 3.25C10.5 3.05109 10.4209 2.86038 10.2803 2.71973C10.1572 2.59668 9.99587 2.52098 9.82422 2.50391L9.75 2.5H9.5V4Z" fill="#C093FF" />
              </g>
              <defs>
                <clipPath id="clip0_3980_2240">
                  <rect width="12" height="12" fill="white" />
                </clipPath>
              </defs>
            </svg>
            <span className="text-xs font-medium text-[#c093ff] leading-none">#{stats.rank}</span>
          </div>
        )}

        <div className="relative z-[1] flex flex-col items-center gap-2">
          <UserAvatarWithRank user={user} tier={stats?.tier} size={64} />
          <div className="flex w-full flex-col items-center gap-1.5">
            <div className="flex items-center gap-1.5">
              <p className="max-w-sm text-lg font-semibold">@{getUsername}</p>
              {isOwnProfile && (
                <div
                  onClick={handleEditProfileClick}
                  className="flex cursor-pointer items-center -translate-y-px text-white transition-all hover:text-neutral-300"
                >
                  <Pencil size={12} />
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-neutral-300 [&_svg]:size-[10px] [&_svg]:-translate-y-px">
              {displayAddress && isAddress(displayAddress) && (
                <>
                  {truncateAddress(displayAddress as `0x${string}`, 5, 3)}
                  <Copy copy={displayAddress} className="inline-block" />
                </>
              )}
            </div>
            {(() => {
              // Use connectedUser socials for own profile (unsanitized), public user socials otherwise
              const socials = isOwnProfile ? (connectedUser?.socials ?? user?.socials) : user?.socials
              const twitterHandle = socials?.twitter
              const tiktokHandle = socials?.tiktok && !socials.tiktok.startsWith("0x") ? socials.tiktok : null
              if (!twitterHandle && !tiktokHandle) return null
              return (
                <div className="flex items-center gap-2">
                  {twitterHandle && (
                    <Link
                      href={twitterHandle.startsWith("https://") ? twitterHandle : `https://twitter.com/${twitterHandle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "flex items-center gap-1 rounded-full bg-neutral-700 px-2 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:text-white",
                        isOwnProfile && !visibility.twitter && "opacity-50"
                      )}
                    >
                      <Twitter size={10} />
                      @{twitterHandle.replace(/^https?:\/\/(www\.)?twitter\.com\/|^@/, "")}
                      {isOwnProfile && !visibility.twitter && <EyeOff size={10} className="ml-0.5 text-neutral-400" />}
                    </Link>
                  )}
                  {tiktokHandle && (
                    <Link
                      href={tiktokHandle.startsWith("https://") ? tiktokHandle : `https://tiktok.com/@${tiktokHandle.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "flex items-center gap-1 rounded-full bg-neutral-700 px-2 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:text-white",
                        isOwnProfile && !visibility.tiktok && "opacity-50"
                      )}
                    >
                      <Tiktok size={10} />
                      @{tiktokHandle.replace(/^https?:\/\/(www\.)?tiktok\.com\/@?|^@/, "")}
                      {isOwnProfile && !visibility.tiktok && <EyeOff size={10} className="ml-0.5 text-neutral-400" />}
                    </Link>
                  )}
                </div>
              )
            })()}
            {/* Bio */}
            {user?.bio && (
              <div className="px-5 py-2 text-center text-xs text-neutral-200">
                {user.bio}
              </div>
            )}

            <div className="w-full px-4">
              <div className="font-clash text-[16px] leading-[38px]!">{formatNumberWithSuffix(Math.round(points))} <span className="text-neutral-300">pts</span></div>
              <div className="relative w-full bg-neutral-600 rounded-full h-1.5 mb-2">
                <div className="absolute top-0 left-0 bottom-0 bg-[#FF4988] rounded-full" style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="flex justify-between gap-2">
                <div className="text-xxs text-neutral-400">Next Rank: {nextRank}</div>
                <div className="text-xxs font-medium">{formatNumberWithSuffix(pointsToGo)} pts to go</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="w-full">
        <div className="flex justify-between gap-2 p-4">
          <div className="rounded-[8px] p-2.5 bg-neutral-700 flex-1">
            <div className="text-xxs font-normal text-neutral-300 mb-2">Token Created</div>
            <div className="text-base font-medium font-mono text-white">{coinsCreated}</div>
          </div>
          <div className="rounded-[8px] p-2.5 bg-neutral-700 flex-1">
            <div className="text-xxs font-normal text-neutral-300 mb-2">Referrals</div>
            <div className="text-base font-medium font-mono text-white">{referrals}</div>
          </div>
          <div className="rounded-[8px] p-2.5 bg-neutral-700 flex-1">
            <div className="text-xxs font-normal text-neutral-300 mb-2">UGC Posts</div>
            <div className="text-base font-medium font-mono text-white">{ugcPosts}</div>
          </div>
        </div>
      </div>

      {/* IP Owner section - only show for verified IPs */}
      {ip && ip.is_verified && (
        <div className="w-full pt-4 border-neutral-600">
          <div className="flex flex-col items-center">
            <div
              className="flex items-end justify-center gap-1.5 cursor-pointer transition-opacity hover:opacity-80"
              onClick={() => setShowIpDialog(true)}
            >
              <LaurelLeft />
              <div className="flex flex-col items-center">
                <div className="relative size-[58px] overflow-hidden rounded-[17px]">
                  <Image src={ip?.image ?? "/images/landing/cat.png"} alt="IP Image" fill className="object-cover" />
                </div>
                <p className="mt-1 text-xs font-bold uppercase text-white mb-1 font-sf-pro-rounded">{ip.title}</p>
                <p className="text-[9px] font-bold uppercase text-neutral-300 font-sf-pro-rounded">IP Owner</p>
              </div>
              <LaurelRight />
            </div>
          </div>
        </div>
      )}

      {ip && showIpDialog && (
        <IpInfoDialog ip={ip} isOpen={showIpDialog} onClose={() => setShowIpDialog(false)} />
      )}

      <StatsCard pnl={pnl} ugc={ugc} total_pnl={total_pnl} ipBalanceFormatted={ipBalanceFormatted} ipBalanceExact={ipBalanceExact} usdcBalanceFormatted={usdcBalanceFormatted} usdcBalanceExact={usdcBalanceExact} solBalanceFormatted={solBalanceFormatted} solBalanceExact={solBalanceExact} showBalances={isOwnProfile} />
    </div>
  )
}
