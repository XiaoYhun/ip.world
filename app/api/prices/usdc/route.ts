export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"

const PYTH_USDC_USD_FEED_ID =
  "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a"

const PYTH_HERMES_URL = `https://hermes.pyth.network/v2/updates/price/latest?ids[]=${PYTH_USDC_USD_FEED_ID}`

const USDC_FALLBACK_PRICE = 1

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
      return NextResponse.json({ price: USDC_FALLBACK_PRICE }, { status: res.status })
    }

    const data = await res.json()
    const parsed = data?.parsed?.[0]
    if (!parsed?.price?.price) {
      return NextResponse.json({ price: USDC_FALLBACK_PRICE }, { status: 502 })
    }

    const rawPrice = parseFloat(parsed.price.price)
    const expo = parsed.price.expo ?? 0
    const price = rawPrice * Math.pow(10, expo)

    if (price <= 0 || !Number.isFinite(price)) {
      return NextResponse.json({ price: USDC_FALLBACK_PRICE }, { status: 502 })
    }

    return NextResponse.json({ price })
  } catch (error) {
    console.error("Fetch USDC Price Error:", error)
    return NextResponse.json({ price: USDC_FALLBACK_PRICE }, { status: 500 })
  }
}
