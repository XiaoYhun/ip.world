import { NextResponse } from "next/server"
import { env } from "@/config"
import { HIDDEN_TRENDING_IPS } from "@/lib/constants"

export async function GET() {
  try {
    const res = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/explore`, {
      next: { revalidate: 60 }, // Cache for 60 seconds instead of no-store
    })
    const data = await res.json()

    // Filter out hidden IPs
    const filteredResults = (data?.viral_ips?.results ?? []).filter((ip: any) => !HIDDEN_TRENDING_IPS.includes(ip.id))
    data.viral_ips.results = filteredResults

    return NextResponse.json(data)
  } catch (error) {
    console.error("Fetch Explore Error:", error)

    return NextResponse.json(
      {
        total_remixes: 0,
        total_user_rewards: 0,
        viral_ips: {
          results: [],
          total: 0,
          limit: 0,
          offset: 0,
        },
        top_takes: [],
      },
      { status: 500 }
    )
  }
}
