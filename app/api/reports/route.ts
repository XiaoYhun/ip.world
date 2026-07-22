// app/api/ips/[id]/report/route.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { env } from "@/config"

export async function POST(request: NextRequest) {
  try {
    // Get the request body with proper type checking
    const body = await request.json()
    const { entity, entity_id, type, metadata } = body as {
      entity: string
      entity_id: string
      type: string
      metadata: Record<string, unknown>
    }

    // Get the JWT from the X-Authorization header
    const authHeader = request.headers.get("X-Authorization")
    const jwtToken = authHeader?.replace("Bearer ", "")

    // If there's no JWT, return unauthorized
    if (!jwtToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Prepare headers for the external API call
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Authorization": `Bearer ${jwtToken}`,
    }

    // Make the external API call
    const response = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/reports`, {
      method: "POST",
      headers,
      body: JSON.stringify({ entity, entity_id, type, metadata }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        {
          success: false,
          message: errorData.message || "Failed to submit report",
        },
        { status: response.status }
      )
    }

    const responseData = await response.json()
    return NextResponse.json({
      success: true,
      data: {
        ...responseData,
      },
    })
  } catch (error) {
    console.error("Report IP Error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    )
  }
}
