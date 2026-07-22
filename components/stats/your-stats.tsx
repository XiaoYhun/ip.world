import Image from "@/components/image"
import defaultUserImage from "@/public/images/default-user.png"
// UserAvatarWithRank removed — using plain avatar now
import { useProfile, useUserProfileData } from "@/hooks/use-profile"
import { formatNumberWithSuffix, formatUSD } from "@/lib/number"
import { truncateAddress } from "@/lib/strings"
import { UserStatsResponse } from "@/types/leaderboard"
import Copy from "../copy"
import { TIER_CONFIG } from "@/lib/constants"
import MoneyBag from "../icons/money-bag"

import UserMultiple from "../icons/user-multiple"
// TikTok verification removed from profile card
import { useDynamicContext } from "@dynamic-labs/sdk-react-core"
// ReferralLinkCopy removed — referrals section simplified
import { useMemo } from "react"
import { getRankProgress } from "@/lib/rank"

export default function YourStats({
  statsResponse,
  disableSecondRow = false,
}: {
  statsResponse?: UserStatsResponse
  disableSecondRow?: boolean
}) {
  const { user: connectedUser } = useProfile()
  const { data: profileData } = useUserProfileData(connectedUser?.wallet_address)

  const { setShowAuthFlow } = useDynamicContext()
  const totalPoints = profileData?.stats?.total_points ?? statsResponse?.total_points ?? 0
  const rankProgress = useMemo(() => getRankProgress(totalPoints), [totalPoints])
  const tradingVolume = profileData?.user?.trading_volume ?? statsResponse?.trading_volume ?? 0
  const referralCount = statsResponse?.referral_count ?? 0
  const currentRank = profileData?.stats?.rank ?? statsResponse?.current_rank ?? null

  if (!connectedUser)
    return (
      <div className="overflow-hidden rounded-[14px] border">
        <div className="bg-chessboard flex flex-col items-center justify-center border-b px-4 py-6">
          <div
            className="mb-8 flex size-[86px] items-center justify-center rounded-full bg-purple-700 text-purple-200"
            style={{ boxShadow: "0 2px 17.9px 0 rgba(0, 0, 0, 0.32)" }}
          >
            <MoneyBag size={44} />
          </div>
          <div className="mb-3 text-center font-semibold">Register to start earning points</div>
          <div className="text-center text-xs text-neutral-200">
            To start earning points, you need to register for an account. Creating an account is quick and easy,
            allowing you to unlock exciting rewards!
          </div>
        </div>
        <div className="p-4">
          <button
            onClick={() => setShowAuthFlow(true)}
            className="w-full rounded-[8px] bg-purple-100 px-6 py-2 text-sm font-semibold text-[#321F4D] transition-colors hover:bg-purple-300"
          >
            Create Account
          </button>
        </div>
      </div>
    )

    // Determine tier from API or calculate from points
  const rawTier = statsResponse?.tier
  const tierName = (rawTier === "GOAT" ? "Legend" : rawTier) || (() => {
    if (totalPoints >= 15000) return "Legend"
    if (totalPoints >= 6000) return "Trencher"
    if (totalPoints >= 2000) return "Degen"
    if (totalPoints >= 500) return "Casual"
    return "Normie"
  })()
  const tierConfig = TIER_CONFIG[tierName as keyof typeof TIER_CONFIG] || null

  return (
    <div className="flex h-full w-full flex-col items-center">
      {/* Rank label + Tier sticker row */}
      <div className="flex w-full items-start justify-between mb-4 px-1">
        {currentRank ? (
          <div className="flex items-center gap-1.5 rounded-full bg-purple-700/60 px-2.5 py-1 text-purple-200">
            <svg className="size-3" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <g clipPath="url(#clip0_rank)">
                <path d="M8.5 0.5C8.76522 0.5 9.0195 0.605432 9.20703 0.792969C9.39457 0.980506 9.5 1.23478 9.5 1.5H9.75C10.2141 1.5 10.6591 1.68451 10.9873 2.0127C11.3155 2.34088 11.5 2.78587 11.5 3.25C11.5 3.71413 11.3155 4.15912 10.9873 4.4873C10.6591 4.81549 10.2141 5 9.75 5H9.46387C9.35666 5.74322 9.01267 6.43731 8.47559 6.97461C8.18962 7.26057 7.8586 7.49209 7.5 7.66211V8.1377L7.50488 8.20117C7.5137 8.26427 7.53449 8.32527 7.56641 8.38086C7.59848 8.43659 7.64112 8.48595 7.69141 8.52539L7.74414 8.56152L7.78516 8.58887C8.16 8.86652 8.46498 9.2284 8.67578 9.64453C8.81262 9.9147 8.90684 10.2032 8.95703 10.5H10C10.2761 10.5 10.5 10.7239 10.5 11C10.5 11.2761 10.2761 11.5 10 11.5H2C1.72386 11.5 1.5 11.2761 1.5 11C1.5 10.7239 1.72386 10.5 2 10.5H3.04297C3.09316 10.2032 3.18738 9.9147 3.32422 9.64453C3.53502 9.2284 3.84 8.86652 4.21484 8.58887L4.25586 8.56152C4.32944 8.51767 4.39087 8.45511 4.43359 8.38086C4.47612 8.30679 4.49902 8.2231 4.5 8.1377V7.66211C4.1414 7.49209 3.81136 7.26057 3.52539 6.97461C2.98803 6.43725 2.64337 5.74344 2.53613 5H2.25C1.78587 5 1.34088 4.81549 1.0127 4.4873C0.684507 4.15912 0.5 3.71413 0.5 3.25C0.5 2.78587 0.684507 2.34088 1.0127 2.0127C1.34088 1.68451 1.78587 1.5 2.25 1.5H2.5C2.5 1.23478 2.60543 0.980505 2.79297 0.792969C2.9805 0.605432 3.23478 0.5 3.5 0.5H8.5Z" fill="#C093FF"/>
              </g>
              <defs><clipPath id="clip0_rank"><rect width="12" height="12" fill="white"/></clipPath></defs>
            </svg>
            <span className="text-xs font-semibold">#{currentRank}</span>
          </div>
        ) : <div />}
        {tierConfig && (
          <Image
            src={tierConfig.badge}
            alt={tierConfig.alt}
            width={58}
            height={58}
            className="size-[58px] object-contain"
          />
        )}
      </div>

      {/* Profile image */}
      <div className="mb-2 -mt-10">
        <Image
          src={connectedUser?.avatar_url || defaultUserImage}
          alt="profile"
          width={54}
          height={54}
          className="size-[54px] rounded-full object-cover"
        />
      </div>

      {/* Username + referral count */}
      <div className="mb-1.5 flex items-baseline gap-0.5">
        <div className="max-w-[10rem] truncate text-sm font-semibold">@{connectedUser?.username}</div>
        <span className="-translate-y-[1px]"><UserMultiple size={12} /></span>
        <span className="text-xs font-bold text-white">{referralCount}</span>
      </div>

      {/* Address + copy */}
      <div className="mb-8 flex items-center gap-1 text-xs font-medium text-neutral-300 [&_svg]:size-[10px] [&_svg]:-translate-y-px">
        {truncateAddress(connectedUser?.wallet_address || "", 5, 3)}
        {connectedUser?.wallet_address && (
          <Copy copy={connectedUser?.wallet_address || ""} className="inline-block" />
        )}
      </div>

      {/* Points section */}
      <div className="w-full overflow-hidden rounded-[16px] border">
        <div className="bg-chessboard px-4 py-4 border-b">
          <div className="font-clash flex items-center gap-2 text-[34px] mb-3">
            {formatNumberWithSuffix(totalPoints)} <span className="text-neutral-300">pts</span>
          </div>
          <div className="relative h-1.5 w-full rounded-full bg-neutral-600 mb-1.5">
            <div className="absolute top-0 bottom-0 left-0 rounded-full bg-[#FF4988]" style={{ width: `${rankProgress.progressPercent}%` }}></div>
          </div>
          <div className="justify-between flex">
            {rankProgress.progressPercent >= 100 ? (
              <div className="text-xs sm:text-xxs text-neutral-400">Current Rank: Legend</div>
            ) : (
              <>
                <div className="text-xs sm:text-xxs text-neutral-400">Next Rank: {rankProgress.nextRank}</div>
                <div className="text-xxs font-medium hidden sm:block">{rankProgress.pointsToGo < 1000 ? Math.round(rankProgress.pointsToGo) : formatNumberWithSuffix(rankProgress.pointsToGo)} pts to go</div>
              </>
            )}
          </div>
        </div>

        {/* Volume Traded + UGC Earnings */}
        <div className="flex gap-2 p-4">
          <div className="rounded-[8px] p-2.5 bg-neutral-700 flex-1 text-center">
            <div className="text-xxs font-normal text-neutral-300 mb-2">Volume Traded</div>
            <div className="text-base font-medium font-mono text-white">{formatUSD(tradingVolume)}</div>
          </div>
          <div className="rounded-[8px] p-2.5 bg-neutral-700 flex-1 text-center">
            <div className="text-xxs font-normal text-neutral-300 mb-2">UGC Earnings</div>
            <div className="text-base font-medium font-mono text-white">$0</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// RenderTier removed — tier sticker shown directly in profile card
