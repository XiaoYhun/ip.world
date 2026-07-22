import { NextRequest, NextResponse } from "next/server"
import { env } from "@/config"

export async function GET(req: NextRequest, props: { params: Promise<{ tokenAddress: string }> }) {
  const params = await props.params
  const { tokenAddress } = params
  const { searchParams } = new URL(req.url)

  const headers: Record<string, string> = {}
  const xAuth = req.headers.get("x-authorization")
  if (xAuth) {
    headers["X-Authorization"] = xAuth
  }

  try {
    const res = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/remixes/${tokenAddress}/feed?${searchParams.toString()}`, {
      cache: "no-store",
      headers,
    })
    const data = await res.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error("Fetch Token Feed Error:", error)

    return NextResponse.json({ results: [] }, { status: 500 })
  }
}
