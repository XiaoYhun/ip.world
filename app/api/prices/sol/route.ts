export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"

const PYTH_SOL_USD_FEED_ID =
  "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d"

const PYTH_HERMES_URL = `https://hermes.pyth.network/v2/updates/price/latest?ids[]=${PYTH_SOL_USD_FEED_ID}`

export async function GET() {
  try {
    const res = await fetch(PYTH_HERMES_URL, {
      headers: {
        Accept: "application/json",
        "User-Agent": "ipworld-price-service/1.0",
      },
      next: { revalidate: 60 },
    })

    if (!res.ok) {
      return NextResponse.json({ price: 0 }, { status: res.status })
    }

    const data = await res.json()
    const parsed = data?.parsed?.[0]
    if (!parsed?.price?.price) {
      return NextResponse.json({ price: 0 }, { status: 502 })
    }

    const rawPrice = parseFloat(parsed.price.price)
    const expo = parsed.price.expo ?? 0
    const price = rawPrice * Math.pow(10, expo)

    if (price <= 0 || !Number.isFinite(price)) {
      return NextResponse.json({ price: 0 }, { status: 502 })
    }

    return NextResponse.json({ price })
  } catch (error) {
    console.error("Fetch SOL Price Error:", error)
    return NextResponse.json({ price: 0 }, { status: 500 })
  }
}
