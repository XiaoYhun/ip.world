"use client"

import { Activity, lazy, Suspense, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAccount } from "@/hooks/use-account"
import { useProfile } from "@/hooks/use-profile"
import { Holding } from "@/types/holding"
import { UserStatsResponse } from "@/types/leaderboard"
import { UserProfile } from "@/types/profile"
import { Referral } from "@/types/referral"
import { Remix } from "@/types/remix"
import { ListResponse } from "@/types/response"
import UserInfoCard from "./UserInfoCard"
import Image from "next/image"
import { UserAvatarWithRank } from "./UserAvatarWithRank"
import { truncateAddress } from "@/lib/strings"
import { Ip } from "@/types/ip"
import { Take } from "@/types/take"
import { cn } from "@/lib/utils"
import { Crown, TimerZero } from "@/components/icons"
import CarouselSection from "@/app/(dApp)/leaderboard/components/carousel-section"
import { useUserPnl } from "@/hooks/use-pnl"
import { formatNumberWithSuffix, formatUSD, formatUsdParts } from "@/lib/number"
import { getRankProgress } from "@/lib/rank"
import { env } from "@/config"
import { CreatedRemixTableSkeleton } from "./CreatedRemixTable"
import { HoldingsTableSkeleton } from "./HoldingsTable"
import { ReferralsSkeleton } from "../../components/referrals"

const PROFILE_INITIAL_LIMIT = 100
const REFETCH_INTERVAL = 30_000

const apiUrl = env.NEXT_PUBLIC_API_BASE_URL

async function clientFetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}`)
  return (await res.json()) as T
}

// Lazy load components
const CreatedRemixTable = lazy(() => import("./CreatedRemixTable"))
const HoldingsTable = lazy(() => import("./HoldingsTable"))
const Referrals = lazy(() => import("../../components/referrals"))


const EMPTY_LIST = <T,>(): ListResponse<T> => ({ results: [], total: 0, limit: 0, offset: 0 })
const EMPTY_STATS: UserStatsResponse = {
  current_rank: 0, total_points: 0, tier: "", referral_count: 0, trading_volume: 0,
  points_change_1d: 0, points_change_7d: 0, points_change_30d: 0, points_change_90d: 0, points_change_all: 0,
  referral_change_1d: 0, referral_change_7d: 0, referral_change_30d: 0, referral_change_90d: 0, referral_change_all: 0,
  volume_change_1d: 0, volume_change_7d: 0, volume_change_30d: 0, volume_change_90d: 0, volume_change_all: 0,
  onboarding_quests: { link_x: false, link_tiktok: false, add_username: false, first_trade: false, first_ip: false, first_remix: false },
  referred_users: null, remixes_created: 0, ips_created: 0, favorites_count: 0, total_points_earned_from_referrals: 0,
}

const ProfileContent = ({
  profile: initialProfile = {} as UserProfile,
  holdingsResponse: initialHoldingsResponse = EMPTY_LIST<Holding>(),
  remixesResponse: initialRemixesResponse = EMPTY_LIST<Remix>(),
  ipsResponse: initialIpsResponse = EMPTY_LIST<Ip>(),
  takesResponse: initialTakesResponse = EMPTY_LIST<Take>(),
  referralsResponse: initialReferralsResponse = EMPTY_LIST<Referral>(),
  referralsCurrentPage = 1,
  statsResponse: initialStatsResponse = EMPTY_STATS,
  addressFromUrl,
}: {
  profile?: UserProfile
  holdingsResponse?: ListResponse<Holding>
  remixesResponse?: ListResponse<Remix>
  ipsResponse?: ListResponse<Ip>
  takesResponse?: ListResponse<Take>
  referralsResponse?: ListResponse<Referral>
  referralsCurrentPage?: number
  statsResponse?: UserStatsResponse
  addressFromUrl?: string
}) => {
  const { address: connectedAddress } = useAccount()
  const { user: connectedUser } = useProfile()
  const addr = initialProfile?.user?.wallet_address || addressFromUrl || connectedAddress

  // Only treat initial props as real data when they actually came from the server
  // (non-empty). If they're the empty defaults from the own-profile page,
  // leave initialData undefined so TanStack Query fetches immediately on mount.
  const hasServerProfile = !!initialProfile?.user?.wallet_address
  const hasServerList = (r: ListResponse<unknown>) => (r?.results?.length ?? 0) > 0

  const queryOptions = {
    refetchInterval: REFETCH_INTERVAL,
    staleTime: REFETCH_INTERVAL,
    enabled: !!addr,
  }

  const { data: profileData, isLoading: isProfileLoading } = useQuery({
    queryKey: ["profile", addr],
    queryFn: () => clientFetchJson<{ data: UserProfile }>(`${apiUrl}/users/${addr}/profile`).then((r) => r.data),
    initialData: hasServerProfile ? initialProfile : undefined,
    ...queryOptions,
  })
  const { data: holdingsResponse, isLoading: isHoldingsLoading } = useQuery({
    queryKey: ["profile-holdings", addr],
    queryFn: () => clientFetchJson<ListResponse<Holding>>(`${apiUrl}/users/${addr}/holdings?limit=${PROFILE_INITIAL_LIMIT}&offset=0`),
    initialData: hasServerList(initialHoldingsResponse) ? initialHoldingsResponse : undefined,
    ...queryOptions,
  })
  const { data: remixesResponse, isLoading: isRemixesLoading } = useQuery({
    queryKey: ["profile-remixes", addr],
    queryFn: () => clientFetchJson<ListResponse<Remix>>(`${apiUrl}/users/${addr}/remixes?limit=${PROFILE_INITIAL_LIMIT}&offset=0`),
    initialData: hasServerList(initialRemixesResponse) ? initialRemixesResponse : undefined,
    ...queryOptions,
  })
  const { data: ipsResponse } = useQuery({
    queryKey: ["profile-ips", addr],
    queryFn: () => clientFetchJson<ListResponse<Ip>>(`${apiUrl}/users/${addr}/ips?limit=${PROFILE_INITIAL_LIMIT}&offset=0`),
    initialData: hasServerList(initialIpsResponse) ? initialIpsResponse : undefined,
    ...queryOptions,
  })
  const { data: takesResponse } = useQuery({
    queryKey: ["profile-takes", addr],
    queryFn: () => clientFetchJson<ListResponse<Take>>(`${apiUrl}/users/${addr}/takes?limit=${PROFILE_INITIAL_LIMIT}&offset=0`),
    initialData: hasServerList(initialTakesResponse) ? initialTakesResponse : undefined,
    ...queryOptions,
  })
  const { data: referralsResponse, isLoading: isReferralsLoading } = useQuery({
    queryKey: ["profile-referrals", addr],
    queryFn: () => clientFetchJson<ListResponse<Referral>>(`${apiUrl}/users/${addr}/referrals?limit=${PROFILE_INITIAL_LIMIT}&offset=0`),
    initialData: hasServerList(initialReferralsResponse) ? initialReferralsResponse : undefined,
    ...queryOptions,
  })
  const { data: statsResponse } = useQuery({
    queryKey: ["profile-stats", addr],
    queryFn: () => clientFetchJson<UserStatsResponse>(`${apiUrl}/users/${addr}/rewards`),
    initialData: hasServerProfile ? initialStatsResponse : undefined,
    ...queryOptions,
  })

  const profile = profileData ?? initialProfile

  const [activeTab, setActiveTab] = useState("holdings")
  const walletAddress = useMemo(() => profile?.user?.wallet_address || addressFromUrl || connectedAddress, [profile?.user?.wallet_address, addressFromUrl, connectedAddress])

  const isOwnProfile = useMemo(() => {
    if (!connectedAddress) return false
    const ca = connectedAddress.toLowerCase()
    return ca === walletAddress?.toLowerCase() || ca === profile?.user?.embedded_wallet_address?.toLowerCase()
  }, [connectedAddress, walletAddress, profile?.user?.embedded_wallet_address])

  const displayName = useMemo(() => {
    const name = profile?.user?.username || profile?.user?.display_name
    if (name && name.toLowerCase() !== profile?.user?.wallet_address?.toLowerCase()) return name
    if (isOwnProfile) {
      const connected = connectedUser?.username || connectedUser?.display_name
      if (connected && connected.toLowerCase() !== connectedAddress?.toLowerCase()) return connected
    }
    return walletAddress ? truncateAddress(walletAddress) : ""
  }, [profile?.user, connectedUser, connectedAddress, isOwnProfile, walletAddress])

  const allWallets = useMemo(() => {
    const set = new Set<string>()
    if (walletAddress) set.add(walletAddress.toLowerCase())
    if (addressFromUrl) set.add(addressFromUrl.toLowerCase())
    if (profile?.user?.embedded_wallet_address) set.add(profile.user.embedded_wallet_address.toLowerCase())
    return set
  }, [walletAddress, addressFromUrl, profile])
  const { data: pnl, isLoading: isPnlLoading } = useUserPnl(walletAddress)
  const rankProgress = useMemo(() => getRankProgress(profile?.stats?.total_points ?? 0), [profile?.stats?.total_points])

  const pnlByTokenAddress = useMemo(() => {
    const map: Record<string, { pnlUsd: number; pnlPercentage: number; boughtUsd: number; soldUsd: number; holdingUsd: number; quantityHeld: string }> = {}
    const positions = pnl?.positions ?? []

    for (const position of positions) {
      const tokenAddress = position.token_address?.toLowerCase?.()
      if (!tokenAddress) continue

      map[tokenAddress] = {
        pnlUsd: Number(position.pnl_usd ?? "0"),
        pnlPercentage: Number(position.pnl_percentage ?? "0"),
        boughtUsd: Number(position.total_bought_usd ?? position.bought_usd ?? "0"),
        soldUsd: Number(position.total_sold_usd ?? position.sold_usd ?? "0"),
        holdingUsd: Number(position.total_holding_usd ?? position.holding_usd ?? "0"),
        quantityHeld: position.total_quantity ?? position.quantity_held ?? "0",
      }
    }

    return map
  }, [pnl?.positions])

  const valueByTokenAddress = useMemo(() => {
    const map: Record<string, number> = {}
    const positions = pnl?.positions ?? []

    for (const position of positions) {
      const tokenAddress = position.token_address?.toLowerCase?.()
      if (!tokenAddress) continue
      map[tokenAddress] = Number(position.holding_usd ?? "0")
    }

    return map
  }, [pnl?.positions])

  if (!addr) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-neutral-400">Connect your wallet to view your profile</p>
      </div>
    )
  }

  const tabBar = (
    <div className="flex gap-1">
      <div
        onClick={() => setActiveTab("holdings")}
        className={cn(
          "flex cursor-pointer items-center gap-1.5 rounded-[12px] px-3 py-2 text-sm capitalize transition-colors",
          activeTab === "holdings"
            ? "bg-neutral-500/50! text-white"
            : "bg-transparent text-neutral-300 hover:text-white"
        )}
      >
        <Crown width={14} height={14} />
        Coins
      </div>
      <div
        onClick={() => setActiveTab("feed")}
        className={cn(
          "flex cursor-pointer items-center gap-1.5 rounded-[12px] px-3 py-2 text-sm capitalize transition-colors",
          activeTab === "feed" ? "bg-neutral-500/50! text-white" : "bg-transparent text-neutral-300 hover:text-white"
        )}
      >
        <TimerZero />
        Feed
      </div>
    </div>
  )

  const tabContent = (
    <>
      <Activity mode={activeTab === "holdings" ? "visible" : "hidden"}>
        {remixesResponse?.total ? (
          <>
            <div className="mb-2 text-xl font-medium text-white">
              Created
              <span className="ml-2 font-mono text-xl font-medium text-neutral-300">{remixesResponse?.total ?? 0}</span>
            </div>
            <Suspense fallback={<CreatedRemixTableSkeleton />}>
              <CreatedRemixTable
                remixes={remixesResponse?.results || []}
                total={remixesResponse?.total || 0}
                walletAddress={walletAddress ?? ""}
                pnlByTokenAddress={pnlByTokenAddress}
                valueByTokenAddress={valueByTokenAddress}
                isLoading={isRemixesLoading}
              />
            </Suspense>
          </>
        ) : null}
        <div className={cn(remixesResponse?.total ? "mt-12" : "", "mb-2 text-xl font-medium text-white")}>
          Holdings
          <span className="ml-2 font-mono text-xl font-medium text-neutral-300">{holdingsResponse?.total || ""}</span>
        </div>
        <Suspense fallback={<HoldingsTableSkeleton />}>
          <HoldingsTable
            holdings={holdingsResponse?.results || []}
            total={holdingsResponse?.total || 0}
            walletAddress={walletAddress ?? ""}
            pnlByTokenAddress={pnlByTokenAddress}
            isLoading={isHoldingsLoading}
          />
        </Suspense>
      </Activity>
      <Activity mode={activeTab === "feed" ? "visible" : "hidden"}>
        <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
          <TimerZero />
          <div className="mt-2 text-sm">Feed coming soon</div>
        </div>
      </Activity>
      {/* <Activity mode={activeTab === "ips" ? "visible" : "hidden"}>
        <CreatedIp address={walletAddress} ipsResponse={ipsResponse} />
      </Activity> */}
      <Activity mode={activeTab === "referrals" ? "visible" : "hidden"}>
        <Suspense fallback={<ReferralsSkeleton />}>
          <Referrals
            statsResponse={statsResponse ?? initialStatsResponse}
            address={walletAddress ?? ""}
            referrals={referralsResponse?.results || []}
            total={referralsResponse?.total || 0}
            currentPage={referralsCurrentPage}
            isLoading={isReferralsLoading}
          />
        </Suspense>
      </Activity>
    </>
  )

  return (
    <>
      {/* Desktop layout */}
      <div className="hidden w-full flex-1 gap-5 px-5 py-4 sm:flex">
        <div className="shrink-0 self-start sticky top-[72px] z-10 max-h-[min(940px,calc(100vh-72px))] overflow-y-auto no-scrollbar">
          <UserInfoCard
            user={profile?.user}
            stats={profile?.stats}
            ip={ipsResponse?.results?.find(ip => ip.owner_address && allWallets.has(ip.owner_address.toLowerCase()))}
            points={profile?.stats?.total_points}
            coinsCreated={remixesResponse?.total}
            referrals={referralsResponse?.total}
            ugcPosts={takesResponse?.total}
            nextRank={rankProgress.nextRank}
            pointsToGo={rankProgress.pointsToGo}
            progressPercent={rankProgress.progressPercent}
            pnl={pnl}
            ugc={profile?.ugc}
            isLoading={isProfileLoading}
            displayName={displayName}
          />
        </div>
        <div className="flex w-full flex-1 flex-col gap-4">
          <CarouselSection />
          <div className="bg-background sticky top-14 z-20 py-2 pt-4 -mt-2">
            <div className="w-full rounded-[16px] border border-neutral-600! bg-neutral-800/90! px-4 py-3 backdrop-blur-[20px]">{tabBar}</div>
          </div>
          <div className="flex flex-col">{tabContent}</div>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="flex flex-col gap-4 px-4 py-3 sm:hidden">
        {/* Centered profile: avatar + username + bio */}
        <div className="flex flex-col items-center gap-2 py-3">
          <UserAvatarWithRank user={profile?.user} tier={profile?.stats?.tier} size={64} />
          <div className="max-w-full truncate text-xl font-semibold">
            @{displayName}
          </div>
          {profile?.user?.bio && (
            <div className="line-clamp-2 text-center text-sm text-neutral-300">{profile?.user?.bio}</div>
          )}
        </div>

        {/* Points + progress */}
        <div className="overflow-hidden rounded-[16px] border">
          <div className="bg-chessboard border-b px-4 py-4">
            <div className="font-clash mb-3 text-[32px] leading-none">
              {formatNumberWithSuffix(profile?.stats?.total_points ?? 0)} <span className="text-lg text-neutral-300">pts</span>
            </div>
            <div className="relative mb-2 h-1.5 w-full rounded-full bg-neutral-600">
              <div className="absolute top-0 bottom-0 left-0 rounded-full bg-[#FF4988]" style={{ width: `${rankProgress.progressPercent}%` }} />
            </div>
            <div className="flex items-center justify-between gap-2 text-sm">
              <div className="text-neutral-400">Next Rank: {rankProgress.nextRank}</div>
              <div className="font-medium">{formatNumberWithSuffix(rankProgress.pointsToGo)} pts to go</div>
            </div>
          </div>

          {/* Stats — vertical stacked rows */}
          <div className="flex flex-col divide-y divide-neutral-700">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-neutral-300">Coins Created</span>
              <span className="font-mono text-base font-medium">{remixesResponse?.total ?? 0}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-neutral-300">Referrals</span>
              <span className="font-mono text-base font-medium">{referralsResponse?.total ?? 0}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-neutral-300">UGC Posts</span>
              <span className="font-mono text-base font-medium">{takesResponse?.total ?? 0}</span>
            </div>
          </div>
        </div>

        {/* IP Owner badge */}
        {(() => {
          const ownedIp = ipsResponse?.results?.find(ip => ip.owner_address && allWallets.has(ip.owner_address.toLowerCase()))
          if (!ownedIp) return null
          return (
            <div className="flex flex-col items-center gap-1 py-3">
              <div className="flex items-end justify-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="51" viewBox="0 0 30 51" fill="none">
                  <path d="M11.454 0C1.119 3.13014 7.27385 12.8887 7.27385 12.8887C7.27385 12.8887 14.5873 10.336 11.454 0Z" fill="#797979" />
                  <path d="M10.4021 25.5256L10.4 25.5214C10.7038 25.3856 17.927 22.063 15.4568 13.9038C15.4568 13.9038 7.99904 14.4366 9.43191 22.4666C8.1794 19.4955 5.48118 15.3071 0.02566 14.4048C-0.599395 30.2638 10.4023 25.5253 10.4023 25.5253L10.4021 25.5256Z" fill="#797979" />
                  <path d="M17.0248 37.6803C17.1543 37.5784 23.767 32.352 18.7984 24.3467C18.7984 24.3467 11.4328 26.8901 14.5992 34.5234C12.3615 32.2073 8.62088 29.5782 3.53882 30.2966C7.67097 45.5488 16.8663 37.8159 17.0246 37.6801L17.0248 37.6803Z" fill="#797979" />
                  <path d="M25.2087 32.8052C25.2087 32.8052 19.0935 37.8153 24.9177 43.9336C21.7216 42.7928 16.7636 41.9659 12.2351 45.18C23.414 57.3778 28.3082 45.5407 28.3082 45.5407L28.3061 45.5376C29.3143 43.3466 31.1975 37.465 25.2078 32.8054L25.2087 32.8052Z" fill="#797979" />
                </svg>
                <div className="flex flex-col items-center">
                  <div className="relative size-[58px] overflow-hidden rounded-[17px]">
                    <Image src={ownedIp.image ?? "/images/landing/cat.png"} alt="IP Image" fill className="object-cover" />
                  </div>
                  <p className="mt-1 text-xs font-bold uppercase text-white mb-1 font-sf-pro-rounded">{ownedIp.title}</p>
                  <p className="text-[9px] font-bold uppercase text-neutral-300 font-sf-pro-rounded">IP Owner</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="51" viewBox="0 0 30 51" fill="none">
                  <path d="M17.9479 0C28.2829 3.13014 22.1281 12.8887 22.1281 12.8887C22.1281 12.8887 14.8147 10.336 17.9479 0Z" fill="#797979" />
                  <path d="M18.9998 25.5256L19.0019 25.5214C18.6982 25.3856 11.4749 22.063 13.9451 13.9038C13.9451 13.9038 21.4029 14.4366 19.97 22.4666C21.2225 19.4955 23.9208 15.3071 29.3763 14.4048C30.0013 30.2638 18.9997 25.5253 18.9997 25.5253L18.9998 25.5256Z" fill="#797979" />
                  <path d="M12.3769 37.6803C12.2473 37.5784 5.63465 32.352 10.6033 24.3467C10.6033 24.3467 17.9689 26.8901 14.8025 34.5234C17.0402 32.2073 20.7808 29.5782 25.8629 30.2966C21.7307 45.5488 12.5354 37.8159 12.3771 37.6801L12.3769 37.6803Z" fill="#797979" />
                  <path d="M4.19304 32.8052C4.19304 32.8052 10.3082 37.8153 4.48397 43.9336C7.6801 42.7928 12.6381 41.9659 17.1666 45.18C5.9877 57.3778 1.09351 45.5407 1.09351 45.5407L1.09558 45.5376C0.0873775 43.3466 -1.79582 37.465 4.19388 32.8054L4.19304 32.8052Z" fill="#797979" />
                </svg>
              </div>
            </div>
          )
        })()}

        {/* Referral banner */}
        <CarouselSection className="flex" />

        {/* Trading stats — matching desktop card style */}
        {isPnlLoading ? (
          <div className="w-full rounded-[12px] border border-neutral-500 bg-neutral-700">
            <div className="relative z-1 -mb-9 rounded-[12px] bg-neutral-600 p-2 pb-10">
              <div className="h-3 w-24 animate-pulse rounded bg-neutral-500" />
            </div>
            <div className="relative z-2 -m-px overflow-hidden rounded-[12px] border border-neutral-500 bg-[#171717]">
              <div className="px-4 py-4">
                <div className="mb-4 h-2.5 w-16 animate-pulse rounded bg-neutral-700" />
                <div className="flex items-center justify-between">
                  <div className="h-7 w-32 animate-pulse rounded bg-neutral-700" />
                  <div className="h-4 w-14 animate-pulse rounded bg-neutral-800" />
                </div>
              </div>
              <div className="border-t border-neutral-600 px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="h-2.5 w-10 animate-pulse rounded bg-neutral-700" />
                  <div className="h-4 w-20 animate-pulse rounded bg-neutral-700" />
                </div>
              </div>
            </div>
          </div>
        ) : pnl && Number(pnl.total_holding_usd) > 0 && (() => {
          const totalPnl = formatUsdParts(pnl.total_pnl_usd ?? 0)
          return (
            <div className="rounded-[12px] border border-neutral-500 bg-neutral-700 w-full">
              <div className="relative z-1 -mb-9 flex items-center justify-between rounded-[12px] bg-neutral-600 p-2 pb-10">
                <div className="text-xs font-medium text-neutral-300 uppercase">Trading stats</div>
              </div>
              <div className="overflow-hidden rounded-[12px] border border-neutral-500 bg-[#171717] relative z-2 -m-px">
                <div className="px-4 py-4">
                  <div className="mb-4 text-xs text-neutral-300">Total PNL</div>
                  <div className={cn("font-mono text-2xl font-medium flex justify-between w-full items-center", Number(pnl.total_pnl_usd) >= 0 ? "text-green-neon" : "text-pink-neon")}>
                    <span>
                      {totalPnl.dollars}
                      <span className={cn(Number(pnl.total_pnl_usd) >= 0 ? "text-[#578017]!" : "text-[#AA3577]!")}>
                        {totalPnl.cents}
                      </span>
                    </span>
                    <span className="ml-2 text-sm">
                      ({Number(pnl.total_pnl_percentage) >= 0 ? "+" : ""}
                      {Math.round(Number(pnl.total_pnl_percentage))}%)
                    </span>
                  </div>
                </div>
                <div className="border-t border-neutral-600 px-4 py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xxs text-neutral-300 uppercase">Value</span>
                    <span className="font-mono text-base font-medium text-white">
                      {formatUSD(pnl.total_holding_usd)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Tab bar */}
        <div className="bg-background sticky top-14 z-20 -mx-4 px-4 py-2">
          <div className="rounded-[14px] border border-neutral-600 bg-neutral-800/90 px-2 py-2">{tabBar}</div>
        </div>

        {/* Tab content */}
        {tabContent}
      </div>
    </>
  )
}

export default ProfileContent
