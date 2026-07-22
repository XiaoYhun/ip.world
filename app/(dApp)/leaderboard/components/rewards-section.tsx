"use client"

import { Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { useDynamicContext } from "@dynamic-labs/sdk-react-core"
import { useProfile } from "@/hooks/use-profile"
import { UserStatsResponse } from "@/types/leaderboard"
import { cn } from "@/lib/utils"

const questMetadata = {
  link_x: {
    title: "Link X Account",
    link: "/settings",
  },
  link_tiktok: {
    title: "Link TikTok",
    link: "/settings",
  },
  add_username: {
    title: "Set Username",
    link: "/settings",
  },
  first_trade: {
    title: "Complete First Trade",
    link: "/coins",
  },
  first_ip: {
    title: "Mint First IP",
    link: "/",
  },
  first_remix: {
    title: "First Token",
    link: "/coins",
  },
} as const

interface RewardsSectionProps {
  userStats?: UserStatsResponse
}

export default function RewardsSection({ userStats }: RewardsSectionProps) {
  const router = useRouter()
  const { user: connectedUser } = useProfile()

  // Dynamically generate questMap with point values from userStats
  const questMap = Object.entries(questMetadata).reduce(
    (acc, [key, meta]) => {
      const pointsValue =
        (userStats?.onboarding_quests?.[`${key}_points` as keyof typeof userStats.onboarding_quests] as
          | number
          | undefined) ?? 0

      acc[key as keyof typeof questMetadata] = {
        ...meta,
        points: `+${pointsValue} pts`,
      }

      return acc
    },
    {} as Record<keyof typeof questMetadata, { title: string; link: string; points: string }>
  )

  const questKeys = Object.keys(questMetadata) as Array<keyof typeof questMetadata>
  const completedCount = questKeys.filter((key) => userStats?.onboarding_quests?.[key] === true).length

  return (
    <div className="relative w-full rounded-[16px] border bg-[#121212] px-3 py-3">
      {/* Overlay when user not connected */}
      {!connectedUser && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[16px] bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 px-6 text-center">
            <h3 className="text-base font-semibold text-white">Register to unlock Missions</h3>
            <p className="text-xs text-neutral-200">
              To start earning points, you need to register for an account. Creating an account is quick and easy, allowing you to unlock exciting rewards!
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pb-4">
        <div className="text-sm font-medium">Rewards</div>
        <div className="text-xs font-medium text-neutral-200">
          {completedCount}/{questKeys.length} Complete
        </div>
      </div>

      <div className="flex w-full flex-col items-center justify-center gap-3">
        {questKeys.map((questId) => {
          const completed = userStats?.onboarding_quests?.[questId]
          const quest = questMap[questId]

          return (
            <div key={questId} className="w-full">
              <div className="flex w-full items-center justify-start gap-2">
                <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#ffffff33] bg-[#ffffff1a]", completed && "bg-purple-200")}>
                  {completed && <Check className="text-purple-600" />}
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-xs font-medium">{quest.title}</div>
                  <div className="text-xs font-medium text-neutral-300">{quest.points}</div>
                </div>
                <div
                  className={`${completed
                    ? "cursor-default text-neutral-300"
                    : "cursor-pointer text-neutral-200 transition-all hover:bg-[#444447] hover:text-white"
                    } ms-auto rounded-[4px] border-[0.0313rem] border-[#44444D] bg-[#2E2E33] px-2 py-1 text-xs font-medium`}
                  onClick={() => (completed ? undefined : router.push(quest.link))}
                >
                  {completed ? "Completed" : "Complete"}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
