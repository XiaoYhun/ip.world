import { NextRequest, NextResponse } from "next/server"
import { env } from "@/config"
import { HIDDEN_TRENDING_REMIXES } from "@/lib/constants"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  try {
    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 6000) // 6 second timeout

    const res = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/remixes?${searchParams.toString()}`, {
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 60 }, // 1 minute
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    }

    const data = await res.json()

    // Filter out hidden remixes from results
    if (data?.results) {
      data.results = data.results.filter((remix: any) => !HIDDEN_TRENDING_REMIXES.includes(remix.id))
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Fetch Remixes Error:", error)

    // Return proper error status based on error type
    const isTimeout = error instanceof Error && (error.name === "AbortError" || error.message.includes("timeout"))
    const status = isTimeout ? 408 : 500

    return NextResponse.json(
      {
        results: [],
        total: 0,
        error: isTimeout ? "Request timeout" : "Internal server error",
      },
      { status }
    )
  }
}
