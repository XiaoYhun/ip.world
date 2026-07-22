import { NextResponse } from "next/server"
import { env } from "@/config"
import { HIDDEN_TRENDING_IPS } from "@/lib/constants"

// Prevent Vercel from caching this API route
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 6000) // 6 second timeout

    // Fetch more IPs to account for potential filtering
    const fetchLimit = 1 + HIDDEN_TRENDING_IPS.length
    const res = await fetch(
      `${env.NEXT_PUBLIC_API_BASE_URL}/ips?limit=${fetchLimit}&offset=0&sort_by=viral_score&sort_order=desc&category=movement`,
      {
        cache: "no-store",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    clearTimeout(timeoutId)

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    }

    const data = await res.json()

    // Filter out hidden IPs and return only the first one
    const filteredResults = (data?.results ?? []).filter((ip: any) => !HIDDEN_TRENDING_IPS.includes(ip.id)).slice(0, 1)

    return NextResponse.json(filteredResults)
  } catch (error) {
    console.error("Fetch Trending Error:", error)

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
