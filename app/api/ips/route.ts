import { NextRequest, NextResponse } from "next/server"
import { env } from "@/config"
import { HIDDEN_TRENDING_IPS } from "@/lib/constants"

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic"
export const revalidate = 60

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  if (!searchParams.get("sort_by")) {
    searchParams.set("sort_by", "total_volume")
  }
  if (!searchParams.get("sort_order")) {
    searchParams.set("sort_order", "desc")
  }
  if (searchParams.get("verified")) {
    searchParams.set("is_verified", "true")
    searchParams.delete("verified")
  }

  try {
    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 6000) // 6 second timeout

    const res = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/ips?${searchParams.toString()}`, {
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    }

    const data = await res.json()

    // Filter out hidden IPs from results
    if (data?.results) {
      data.results = data.results.filter((ip: any) => !HIDDEN_TRENDING_IPS.includes(ip.id))
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Fetch IPs Error:", error)

    // Return proper error status based on error type
    const isTimeout = error instanceof Error && (error.name === "AbortError" || error.message.includes("timeout"))
    const status = isTimeout ? 408 : 500

    return NextResponse.json(
      {
        results: [],
        total: 0,
        limit: 0,
        offset: 0,
        error: isTimeout ? "Request timeout" : "Internal server error",
      },
      { status }
    )
  }
}
