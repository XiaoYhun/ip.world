import { NextResponse } from "next/server"
import { HIDDEN_TRENDING_IPS } from "@/lib/constants"
import { getAPIRootUrl } from "@/lib/utils"

// Prevent Vercel from caching this API route
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 6000) // 6 second timeout

    // Fetch more IPs to account for filtering
    const fetchLimit = 10 + HIDDEN_TRENDING_IPS.length
    const res = await fetch(`${getAPIRootUrl()}/ips?sort_by=feature_score&sort_order=desc&limit=${fetchLimit}`, {
      cache: "no-store",
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

    // Filter out hidden IPs and return only 3
    const filteredResults = (data?.results ?? []).filter((ip: any) => !HIDDEN_TRENDING_IPS.includes(ip.id)).slice(0, 3)

    return NextResponse.json(filteredResults)
  } catch (error) {
    console.error("Fetch Trending IPs Error:", error)

    // Return proper error status based on error type
    const isTimeout = error instanceof Error && (error.name === "AbortError" || error.message.includes("timeout"))
    const status = isTimeout ? 408 : 500

    return NextResponse.json(
      {
        results: [],
        error: isTimeout ? "Request timeout" : "Internal server error",
      },
      { status }
    )
  }
}
