import { NextRequest, NextResponse } from "next/server"
import { env } from "@/config"
import { hasControlCharacter, isLeaderboardSearchPayload } from "@/lib/user-search-proxy"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get("q") ?? ""
  const rawLimit = searchParams.get("limit") ?? "10"
  const limit = /^\d+$/.test(rawLimit) ? rawLimit : "10"

  if (hasControlCharacter(query)) {
    return NextResponse.json({ error: "invalid search query" }, { status: 400 })
  }

  try {
    const res = await fetch(
      `${env.NEXT_PUBLIC_API_BASE_URL}/leaderboard?${new URLSearchParams({ search: query, limit })}`,
      { cache: "no-store" }
    )
    const data = await res.json()
    if (!res.ok || !isLeaderboardSearchPayload(data)) {
      return NextResponse.json({ results: [], total: 0 }, { status: 502 })
    }
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ results: [], total: 0 }, { status: 502 })
  }
}
