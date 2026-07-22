export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { env } from "@/config"

export async function GET() {
  try {
    const res = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/prices/ip`)

    if (!res.ok) {
      console.error(`Fetch Price Error: upstream returned ${res.status}`)
      return NextResponse.json({ price: 0 }, { status: res.status })
    }

    const contentType = res.headers.get("content-type") ?? ""
    if (!contentType.includes("application/json")) {
      console.error(`Fetch Price Error: unexpected content-type "${contentType}"`)
      return NextResponse.json({ price: 0 }, { status: 502 })
    }

    const data = await res.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error("Fetch Price Error:", error)

    return NextResponse.json({ price: 0 }, { status: 500 })
  }
}
