import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("url")
  if (!target) {
    return NextResponse.json({ error: "Missing url query param" }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(target)
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 })
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return NextResponse.json({ error: "Only http/https urls are allowed" }, { status: 400 })
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      method: "GET",
      cache: "no-store",
      redirect: "follow",
      headers: {
        Accept: "image/*,*/*;q=0.8",
        "User-Agent": "ip.world-image-proxy/1.0",
      },
    })

    if (!upstream.ok) {
      return NextResponse.json({ error: `Upstream image fetch failed (${upstream.status})` }, { status: 502 })
    }

    const contentType = upstream.headers.get("content-type") || "image/png"
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Upstream resource is not an image" }, { status: 415 })
    }

    const body = await upstream.arrayBuffer()
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    })
  } catch (error) {
    console.error("[image-proxy] fetch failed", error)
    return NextResponse.json({ error: "Image proxy failed" }, { status: 500 })
  }
}

