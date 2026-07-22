import { NextRequest, NextResponse } from "next/server"
import { env } from "@/config"

// Prevent Vercel from caching this API route
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(req: NextRequest, props: { params: Promise<{ id: string; user_address: string }> }) {
  const params = await props.params
  const { id, user_address } = params

  try {
    const res = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/ips/${id}/suggestions/${user_address}`, {
      headers: req.headers,
    })
    const data = await res.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error("Fetch Comments Error:", error)

    return NextResponse.json({ results: [] }, { status: 500 })
  }
}
