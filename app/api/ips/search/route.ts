import { NextRequest, NextResponse } from "next/server"
import { env } from "@/config"

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic"
export const revalidate = 60

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  // Extract all query parameters like the server action
  const tag = searchParams.get("tag")
  const sort_by = searchParams.get("sort_by") || "viral_score"
  const sort_order = searchParams.get("sort_order") || "desc"
  const category = searchParams.get("category") || ""
  const limit = searchParams.get("limit") || "12"
  const offset = searchParams.get("offset") || "0"

  try {
    // Build URL with all parameters like server action does
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/ips/search?tag=${tag}&sort_by=${sort_by}&sort_order=${sort_order}&category=${category}&limit=${limit}&offset=${offset}`

    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 6000) // 6 second timeout

    const res = await fetch(url, {
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

    // Return the full response object to match the expected ListResponse<Ip> format
    return NextResponse.json(data)
  } catch (error) {
    console.error("Fetch IPs Search Error:", error)

    // Return proper error status based on error type
    const isTimeout = error instanceof Error && (error.name === "AbortError" || error.message.includes("timeout"))
    const status = isTimeout ? 408 : 500

    return NextResponse.json(
      {
        results: [],
        total: 0,
        limit: parseInt(limit) || 12,
        offset: parseInt(offset) || 0,
        error: isTimeout ? "Request timeout" : "Internal server error",
      },
      { status }
    )
  }
}
