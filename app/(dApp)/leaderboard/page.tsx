import { fetchLeaderboard } from "./actions"
import CarouselSection from "./components/carousel-section"
import LeaderboardContent from "./components/leaderboard-content"
import Stats from "./components/stats"

export const revalidate = 120
export default async function LeaderboardPage() {
  const response = await fetchLeaderboard({
    query: "",
    limit: 20,
    offset: 0,
  })

  const leaderboard = response?.results || []
  const total = response?.total || 0

  return (
    <div className="flex min-h-full flex-col md:flex-row">
      <div className="flex w-full flex-col gap-4 px-3 py-3 sm:px-0 sm:pl-4 md:flex-1">
        <CarouselSection />
        {/* Mobile: show user stats inline */}
        <div className="sm:hidden">
          <Stats />
        </div>
        <LeaderboardContent leaderboard={leaderboard} total={total} />
      </div>
      <div className="sticky">
        <div className="hidden w-[374px] md:flex sticky top-15 ">
          <Stats />
        </div>
      </div>
    </div>
  )
}
