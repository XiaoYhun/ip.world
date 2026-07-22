import { NextRequest, NextResponse } from "next/server"
import { env } from "@/config"

export async function GET(req: NextRequest, { params }: { params: Promise<{ ip_id: string }> }) {
  try {
    const { ip_id } = await params

    if (!ip_id) {
      return NextResponse.json({ error: "IP ID is required" }, { status: 400 })
    }

    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 6000) // 6 second timeout

    const response = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/community-governance/proposals/ip/${ip_id}`, {
      signal: controller.signal,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Fetch Proposals Error:", error)

    // Return proper error status based on error type
    const isTimeout = error instanceof Error && (error.name === "AbortError" || error.message.includes("timeout"))
    const status = isTimeout ? 408 : 500

    return NextResponse.json({ error: isTimeout ? "Request timeout" : "Internal server error" }, { status })
  }
}
