import { NextResponse, type NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // Sunset /profile/@username and /profile/0x... → redirect to /@identifier
  if (pathname.startsWith("/profile/")) {
    const identifier = pathname.slice("/profile/".length)
    if (identifier) {
      const url = request.nextUrl.clone()
      url.pathname = identifier.startsWith("@") ? `/${identifier}` : `/@${identifier}`
      return NextResponse.redirect(url, 301)
    }
  }

  const response = NextResponse.next()

  // Capture referral code from ?ref= query param into cookie
  const ref = searchParams.get("ref")
  if (ref && !request.cookies.has("ref")) {
    response.cookies.set({
      name: "ref",
      value: ref,
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
    })
  }

  return response
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon\\.ico|images|.*\\..*).*)"],
}
