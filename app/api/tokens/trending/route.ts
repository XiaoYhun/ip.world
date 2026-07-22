import { NextResponse } from "next/server"
import { env } from "@/config"
import { HIDDEN_TRENDING_REMIXES } from "@/lib/constants"

export async function GET() {
  try {
    const fetchLimit = 10 + HIDDEN_TRENDING_REMIXES.length
    const res = await fetch(
      `${env.NEXT_PUBLIC_API_BASE_URL}/remixes?sort_by=featured&sort_order=desc&limit=${fetchLimit}`,
      {
        cache: "force-cache",
        next: { revalidate: 60 }, // 1 minutes
      }
    )
    const data = await res.json()

    // Filter out hidden remixes and return only 3
    const filteredResults = (data?.results ?? []).filter((remix: any) => !HIDDEN_TRENDING_REMIXES.includes(remix.id))

    return NextResponse.json(filteredResults)
  } catch (error) {
    console.error("Fetch Comments Error:", error)

    return NextResponse.json({ results: [] }, { status: 500 })
  }
}
