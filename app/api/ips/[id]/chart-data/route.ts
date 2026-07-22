import { NextRequest, NextResponse } from "next/server"
import { env } from "@/config"

export const dynamic = "force-dynamic"
export const revalidate = 60
export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { searchParams } = new URL(req.url)
  const params = await props.params
  const { id } = params
  const metrics = searchParams.get("metrics")
  const timeRange = searchParams.get("time_range")

  try {
    // Validate time_range if provided
    if (timeRange && !["7d", "30d", "90d"].includes(timeRange)) {
      return NextResponse.json({ error: "Invalid time_range parameter. Must be one of: 7d, 30d, 90d" }, { status: 400 })
    }

    const apiParams = new URLSearchParams()
    if (metrics) apiParams.append("metrics", metrics)
    if (timeRange && timeRange !== "all") apiParams.append("time_range", timeRange)

    const res = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/ips/${id}/chart-data?${apiParams.toString()}`, {
      cache: "no-store",
    })

    if (!res.ok) {
      throw new Error(`API responded with status ${res.status}`)
    }

    const data = await res.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error("Fetch IP Chart Data Error:", error)
    return NextResponse.json({ error: "Failed to fetch chart data" }, { status: 500 })
  }
}
