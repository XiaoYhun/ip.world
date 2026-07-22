import { NextRequest, NextResponse } from "next/server"
import { env } from "@/config"
import { HttpMethod } from "@/lib/http-utils"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  // Extract query parameters
  const remix_id = searchParams.get("remix_id")

  try {
    const res = await fetch(
      `${env.NEXT_PUBLIC_API_BASE_URL}/comments?remix_id=${remix_id}&sort_by=created_at&limit=1000&offset=0`
    )
    const data = await res.json()

    return NextResponse.json(data?.results ?? [])
  } catch (error) {
    console.error("Fetch Comments Error:", error)

    return NextResponse.json({ results: [] }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { remix_id, body, user_address, parent_id } = await req.json()

  try {
    const response = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/comments`, {
      method: HttpMethod.POST,
      body: JSON.stringify({
        remix_id,
        body,
        user_address,
        parent_id,
      }),
      cache: "no-store",
      headers: {
        ...req.headers,
        // Explicitly remove origin
        origin: undefined,
      },
    })

    if (!response.ok) {
      return NextResponse.json({ response: response, header: req.headers }, { status: 500 })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (e) {
    console.error("Create Comment Error:", e)

    return NextResponse.json({ e: e, header: req.headers }, { status: 500 })
  }
}
