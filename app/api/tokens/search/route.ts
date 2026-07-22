import { NextRequest, NextResponse } from "next/server"
import { env } from "@/config"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  // Extract query parameters
  const tag = searchParams.get("tag")

  try {
    const res = await fetch(
      `${env.NEXT_PUBLIC_API_BASE_URL}/remixes/search?tag=${tag}&sort_by=market_cap&sort_order=desc&limit=10`,
      {
        cache: "force-cache",
        next: { revalidate: 300 }, // 5 minutes
      }
    )
    const data = await res.json()

    return NextResponse.json(data?.results ?? [])
  } catch (error) {
    console.error("Fetch Comments Error:", error)

    return NextResponse.json({ results: [] }, { status: 500 })
  }
}
