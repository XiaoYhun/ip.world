import { NextRequest, NextResponse } from "next/server"
import { env } from "@/config"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  try {
    // Get the JWT from the Authorization header
    const authHeader = req.headers.get("X-Authorization")
    const jwtToken = authHeader?.replace("Bearer ", "")

    // If there's no JWT, return unauthorized
    if (!jwtToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const res = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/users/favorites?${searchParams.toString()}`, {
      headers: {
        "X-Authorization": `Bearer ${jwtToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!res.ok) {
      return NextResponse.json({ results: [] }, { status: res.status })
    }

    const data = await res.json()
    // Authenticated and personalized; avoid caching at edge
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
      },
    })
  } catch (error) {
    console.error("Fetch Favorites Error:", error)
    return NextResponse.json({ results: [] }, { status: 500 })
  }
}
