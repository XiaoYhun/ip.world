import { NextRequest, NextResponse } from "next/server"
import { env } from "@/config"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const res = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/users/referral`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: req.headers,
      cache: "no-store",
    })

    const data = await res.json()

    return NextResponse.json(data, {
      status: res.status,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
      },
    })
  } catch (error) {
    console.error("Add Referral Error:", error)

    return NextResponse.json(
      { error: "Failed to add referral" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          Pragma: "no-cache",
        },
      }
    )
  }
}
