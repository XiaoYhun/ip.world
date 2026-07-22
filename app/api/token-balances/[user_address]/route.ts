import { NextRequest, NextResponse } from "next/server"
import { env } from "@/config"

export const revalidate = 15

export async function GET(req: NextRequest, props: { params: Promise<{ user_address: string }> }) {
  const params = await props.params
  const { user_address } = params

  try {
    // Validate address early
    const isValidAddress = /^0x[0-9a-fA-F]{40}$/.test(user_address)
    if (!isValidAddress) {
      const notFound = NextResponse.json({ error: "Not Found" }, { status: 404 })
      notFound.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120")
      return notFound
    }

    const hasAuth = Boolean(req.headers.get("authorization") || req.headers.get("x-authorization"))
    const res = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/address/${user_address}/token-balances`, {
      headers: req.headers,
      ...(hasAuth ? {} : { next: { revalidate } }),
    })
    if (!res.ok) {
      return NextResponse.json({ results: [] }, { status: res.status })
    }
    const data = await res.json()

    const json = NextResponse.json(data)
    if (!hasAuth) {
      json.headers.set("Cache-Control", "public, s-maxage=15, stale-while-revalidate=120")
    }
    return json
  } catch (error) {
    console.error("Fetch Token Balances Error:", error)

    return NextResponse.json({ results: [] }, { status: 500 })
  }
}
