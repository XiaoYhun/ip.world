import { NextRequest, NextResponse } from "next/server"
import { env } from "@/config"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const res = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/users/current`, {
      headers: req.headers,
      cache: "no-store",
    })
    const data = await res.json()

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
      },
    })
  } catch (error) {
    console.error("Fetch Current User Error:", error)

    return NextResponse.json(
      { results: null },
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

export async function POST(req: NextRequest) {
  const userData = await req.json()

  try {
    const res = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/users`, {
      method: "POST",
      body: JSON.stringify(userData),
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
    console.error("Create User Error:", error)

    return NextResponse.json(
      { error: "Failed to create user" },
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
