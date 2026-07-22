import { NextRequest, NextResponse } from "next/server"
import { env } from "@/config"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  // Extract query parameters
  const tokenAddress = searchParams.get("token_address")
  const intervalType = searchParams.get("interval_type")
  const to = searchParams.get("to")
  const limit = searchParams.get("limit")

  try {
    // Validate required parameters
    if (!tokenAddress) {
      return NextResponse.json({ error: "token_address is required" }, { status: 400 })
    }

    if (!intervalType) {
      return NextResponse.json({ error: "interval_type is required" }, { status: 400 })
    }

    if (!to) {
      return NextResponse.json({ error: "to parameter is required" }, { status: 400 })
    }

    // Build API URL with parameters
    const apiParams = new URLSearchParams()
    apiParams.append("token_address", tokenAddress)
    apiParams.append("interval_type", intervalType)
    apiParams.append("to", to)
    if (limit) apiParams.append("limit", limit)

    const res = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/ohlcv?${apiParams.toString()}`, {
      next: { revalidate: 10 },
    })

    if (!res.ok) {
      throw new Error(`API responded with status ${res.status}`)
    }

    const data = await res.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error("Fetch OHLCV Data Error:", error)
    return NextResponse.json({ error: "Failed to fetch OHLCV data" }, { status: 500 })
  }
}
