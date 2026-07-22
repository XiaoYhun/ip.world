import { NextRequest, NextResponse } from "next/server"
import { env } from "@/config"

// Prevent Vercel from caching this API route
export const dynamic = "force-dynamic"
export const revalidate = 60

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const { id } = params

  try {
    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 6000) // 6 second timeout

    const res = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/ips/${id}/suggestions`, {
      signal: controller.signal,
      headers: {
        ...req.headers,
        "Content-Type": "application/json",
      },
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Fetch Suggestions Error:", error)

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
