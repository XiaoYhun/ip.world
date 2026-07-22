"use client"
import YourStats from "@/components/stats/your-stats"
import { PAGINATION_LIMIT } from "@/lib/constants"
import { UserStatsResponse } from "@/types/leaderboard"
import { Referral } from "@/types/referral"
import ReferralTable from "./referral-table"

export const ReferralsSkeleton = () => (
  <div className="flex flex-col-reverse items-center lg:flex-row">
    <div className="w-full border-r">
      <div className="w-full">
        {/* Header row */}
        <div className="flex items-center gap-3 border-b border-neutral-700 px-4 py-3">
          {[8, 48, 28, 24, 20].map((w, i) => (
            <div key={i} className={`h-3 w-${w} animate-pulse rounded bg-neutral-700`} />
          ))}
        </div>
        {/* Data rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-neutral-700/50 px-4 py-4">
            <div className="h-3 w-8 animate-pulse rounded bg-neutral-700" />
            <div className="flex items-center gap-2">
              <div className="size-9 shrink-0 animate-pulse rounded-full bg-neutral-700" />
              <div className="flex flex-col gap-1.5">
                <div className="h-3 w-24 animate-pulse rounded bg-neutral-700" />
                <div className="h-2.5 w-32 animate-pulse rounded bg-neutral-800" />
              </div>
            </div>
            <div className="ml-auto flex gap-6">
              <div className="h-3 w-16 animate-pulse rounded bg-neutral-700" />
              <div className="h-3 w-20 animate-pulse rounded bg-neutral-700" />
              <div className="h-3 w-14 animate-pulse rounded bg-neutral-700" />
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className="flex h-full w-full flex-col items-center justify-start lg:w-fit lg:min-w-[26.25rem]">
      <div className="w-full p-4">
        <div className="h-6 w-32 animate-pulse rounded bg-neutral-700 mb-4" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="mb-3 h-10 w-full animate-pulse rounded-[10px] bg-neutral-800" />
        ))}
      </div>
    </div>
  </div>
)

export default function Referrals({
  referrals,
  total,
  currentPage,
  statsResponse,
  isLoading = false,
}: {
  address: string
  referrals: Referral[]
  total: number
  currentPage: number
  statsResponse: UserStatsResponse
  isLoading?: boolean
}) {
  if (isLoading) {
    return <ReferralsSkeleton />
  }

  const totalPages = Math.ceil(total / PAGINATION_LIMIT)

  if (total === 0) {
    return (
      <div className="flex w-full justify-center py-10">
        <p className="text-neutral-300">No referrals data</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col-reverse items-center lg:flex-row">
      <div className="virtualized w-full border-r">
        <ReferralTable referrals={referrals} totalPages={totalPages} currentPage={currentPage} />
      </div>
      <div className="flex h-full w-full flex-col items-center justify-start lg:w-fit lg:min-w-[26.25rem]">
        <YourStats statsResponse={statsResponse} />
      </div>
    </div>
  )
}
