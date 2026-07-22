import { NextRequest, NextResponse } from "next/server"
import { env } from "@/config"

export const revalidate = 60

export async function GET(_req: NextRequest, props: { params: Promise<{ user_address: string }> }) {
  const params = await props.params
  const { user_address } = params

  try {
    if (!user_address?.trim()) {
      return NextResponse.json(null, { status: 404 })
    }

    const res = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/users/${user_address}/profile`, {
      next: { revalidate },
    })

    if (!res.ok) {
      return NextResponse.json(null, { status: res.status })
    }

    const json = await res.json()
    const user = json?.data?.user ?? json?.data ?? json

    const response = NextResponse.json(user)
    response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300")
    return response
  } catch (error) {
    console.error("Fetch User Profile Error:", error)
    return NextResponse.json(null, { status: 500 })
  }
}
