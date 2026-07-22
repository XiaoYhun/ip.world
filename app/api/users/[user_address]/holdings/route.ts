import { NextRequest, NextResponse } from "next/server"
import { env } from "@/config"

export const revalidate = 15

export async function GET(req: NextRequest, props: { params: Promise<{ user_address: string }> }) {
  const { searchParams } = new URL(req.url)
  const params = await props.params
  const { user_address } = params

  try {
    // Validate address early to avoid unnecessary upstream calls
    const isValidAddress = /^0x[0-9a-fA-F]{40}$/.test(user_address)
    if (!isValidAddress) {
      const notFound = NextResponse.json({ error: "Not Found" }, { status: 404 })
      notFound.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120")
      return notFound
    }

    const upstreamUrl = `${env.NEXT_PUBLIC_API_BASE_URL}/users/${user_address}/holdings?${searchParams.toString()}`
    const res = await fetch(upstreamUrl, { next: { revalidate } })

    if (res.status === 404) {
      const notFound = NextResponse.json({ error: "Not Found" }, { status: 404 })
      notFound.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120")
      return notFound
    }

    if (!res.ok) {
      return NextResponse.json({ results: [] }, { status: 502 })
    }

    const data = await res.json()
    const json = NextResponse.json(data)
    json.headers.set("Cache-Control", "public, s-maxage=15, stale-while-revalidate=120")
    return json
  } catch (error) {
    console.error("Fetch Token Holdings Error:", error)
    return NextResponse.json({ results: [] }, { status: 500 })
  }
}
