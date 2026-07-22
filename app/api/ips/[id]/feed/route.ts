import { NextRequest, NextResponse } from "next/server"
import { env } from "@/config"

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const { id } = params
  const { searchParams } = new URL(req.url)

  try {
    const res = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/ips/${id}/feed?${searchParams.toString()}`, {
      cache: "no-store",
      next: { revalidate: 60 }, // 1 minutes
    })
    const data = await res.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error("Fetch Ip Error:", error)

    return NextResponse.json({ results: [] }, { status: 500 })
  }
}
