"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Leaderboard } from "@/types/leaderboard"
import FilterBar from "./filter-bar"
import UGCTable from "./ugc-table"
import UserTable from "./user-table"

interface LeaderboardContentProps {
  leaderboard: Leaderboard[]
  total: number
}

export default function LeaderboardContent({ leaderboard, total }: LeaderboardContentProps) {
  const searchParams = useSearchParams()
  const initialFilter = searchParams.get("filter") || "trading"
  const [activeFilter, setActiveFilter] = useState<string>(initialFilter)

  return (
    <>
      <FilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      <div className="min-h-[500px]">
        {activeFilter === "trading" ? (
          <UserTable initialLeaderboard={leaderboard} initialTotal={total} />
        ) : (
          <UGCTable initialLeaderboard={leaderboard} initialTotal={total} />
        )}
      </div>
    </>
  )
}
