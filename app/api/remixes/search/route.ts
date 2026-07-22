import { NextRequest, NextResponse } from "next/server"
import { env } from "@/config"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  // Extract all query parameters
  const tag = searchParams.get("tag")
  const sort_by = searchParams.get("sort_by") || "market_cap"
  const sort_order = searchParams.get("sort_order") || "desc"
  const category = searchParams.get("category") || ""
  const limit = searchParams.get("limit") || "12"
  const offset = searchParams.get("offset") || "0"

  // Map frontend sort params to backend params
  const backendSort = sort_by === "featured" ? "is_featured" : sort_by

  try {
    // Build URL with all parameters like server action does
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/remixes/search?tag=${tag}&sort_by=${backendSort}&sort_order=${sort_order}&category=${category}&limit=${limit}&offset=${offset}`

    const res = await fetch(url, {
      cache: "force-cache",
      next: { revalidate: 300 }, // 5 minutes
    })
    const data = await res.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error("Fetch Remixes Search Error:", error)

    return NextResponse.json(
      {
        results: [],
        total: 0,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
      { status: 500 }
    )
  }
}
