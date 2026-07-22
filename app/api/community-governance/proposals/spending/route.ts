import { NextRequest, NextResponse } from "next/server"
import { env } from "@/config"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate required fields
    const {
      ip_id,
      snapshot_id,
      snapshot_space_id,
      title,
      description,
      vault_address,
      recipient_address,
      token_address,
      amount,
      purpose,
      created_by,
    } = body

    if (
      !ip_id ||
      !snapshot_id ||
      !snapshot_space_id ||
      !title ||
      !description ||
      !vault_address ||
      !recipient_address ||
      !token_address ||
      !amount ||
      !purpose ||
      !created_by
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout for proposal creation

    const response = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/community-governance/proposals/spending`, {
      method: "POST",
      signal: controller.signal,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Create Proposal Error:", `HTTP ${response.status}:`, errorText)
      return NextResponse.json({ error: errorText || "Failed to create proposal" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Create Proposal Error:", error)

    // Return proper error status based on error type
    const isTimeout = error instanceof Error && (error.name === "AbortError" || error.message.includes("timeout"))
    const status = isTimeout ? 408 : 500

    return NextResponse.json({ error: isTimeout ? "Request timeout" : "Internal server error" }, { status })
  }
}
