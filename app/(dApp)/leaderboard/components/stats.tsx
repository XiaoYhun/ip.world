"use client"

import { useIsLoggedIn } from "@dynamic-labs/sdk-react-core"
import { ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import Image from "@/components/image"
import defaultUserImage from "@/public/images/default-user.png"
import SocialsList from "@/components/socials-list"
import YourStats from "@/components/stats/your-stats"
import { useNavigation } from "@/context/navigation-context"
import { useProfile } from "@/hooks/use-profile"
import { truncateAddress } from "@/lib/strings"
import { UserStatsResponse } from "@/types/leaderboard"
import { fetchUserStats } from "../actions"
import RewardsSection from "./rewards-section"

export default function Stats() {
  const [userStats, setUserStats] = useState<UserStatsResponse>()
  const router = useRouter()
  const isLoggedIn = useIsLoggedIn()
  const { user: connectedUser } = useProfile()
  const { setPreviousPage } = useNavigation()

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetchUserStats(connectedUser?.wallet_address || "")
      setUserStats(response)
    } catch (error) {
      console.error("Failed to load more ips:", error)
    } finally {
    }
  }, [connectedUser])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const handleViewAllClick = () => {
    setPreviousPage("leaderboard")
    router.push("/profile")
  }

  return (
    <div className="w-full px-3 py-3 max-h-screen overflow-y-auto no-scrollbar overscroll-contain pb-5 sm:pb-30">
      <div className="flex flex-col gap-4">
        <div
          className="overflow-visible rounded-[16px] border border-neutral-600 bg-neutral-800 px-3 py-4"
          style={{ boxShadow: "0 2px 12px 0 rgba(0, 0, 0, 0.50)" }}
        >
          <YourStats statsResponse={userStats} disableSecondRow={true} />
        </div>
        <div className="hidden sm:block rounded-[16px] " style={{ boxShadow: "0 2px 12px 0 rgba(0, 0, 0, 0.50)" }}>
          <RewardsSection userStats={userStats} />
        </div>
        {/* {userStats?.referred_users && userStats?.referred_users.length > 0 && (
              <div className="flex w-full flex-col gap-5 px-4 py-5">
                <div className="flex w-full items-center justify-between">
                  <div className="text-sm font-medium">Referred Users</div>
                  <div
                    className="ms-auto flex cursor-pointer items-center justify-center gap-2"
                    onClick={handleViewAllClick}
                  >
                    <div className="text-sm font-normal text-neutral-200">View All</div>
                    <ArrowRight className="h-3 w-3 text-neutral-200" />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-neutral-300">USER</div>
                  <div className="text-xs font-semibold text-neutral-300">POINTS YOU EARNED</div>
                </div>

                <div className="flex w-full flex-col items-center justify-center gap-2">
                  {userStats?.referred_users?.map((user) => (
                    <div key={user?.username} className="flex w-full items-center justify-between">
                      <div className="flex h-9 items-center justify-start gap-2">
                        <Image
                          src={user?.avatar_url || defaultUserImage}
                          alt={"user-image"}
                          className="aspect-square h-9 w-9 rounded-full object-cover"
                          width={36}
                          height={36}
                        />
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <div className="max-w-[5rem] truncate">@{user?.username}</div>
                            {user.socials && <SocialsList className="!gap-1" socials={user.socials} />}
                          </div>
                          <div className="text-sm font-normal text-neutral-300">
                            {truncateAddress(user?.wallet_address)}
                          </div>
                        </div>
                      </div>
                      <div className="text-md font-bold">{user?.points_earned} pts</div>
                    </div>
                  ))}
                </div>
              </div>
            )} */}
      </div>
    </div>
  )
}
