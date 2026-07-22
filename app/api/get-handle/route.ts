import { NextRequest, NextResponse } from "next/server"
import { env } from "@/config"

export async function GET(req: NextRequest) {
  const ip_id = req.nextUrl.searchParams.get("ip_id")

  if (!ip_id) {
    return NextResponse.json({ error: "Missing ip_id" }, { status: 400 })
  }

  try {
    const res = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/ips/${ip_id}/handle`, {
      headers: req.headers,
    })

    if (!res.ok) {
      return NextResponse.json({ results: [] }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Fetch IP Handle Error:", error)
    return NextResponse.json({ results: [] }, { status: 500 })
  }
}
