import { NextRequest, NextResponse } from "next/server"
import { env } from "@/config"

// Generic proxy route that forwards all requests to API_BASE_URL
export async function GET(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  return handleProxyRequest(req, props, "GET")
}

export async function POST(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  return handleProxyRequest(req, props, "POST")
}

export async function PUT(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  return handleProxyRequest(req, props, "PUT")
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  return handleProxyRequest(req, props, "DELETE")
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  return handleProxyRequest(req, props, "PATCH")
}

export async function OPTIONS(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  return handleProxyRequest(req, props, "OPTIONS")
}

async function handleProxyRequest(req: NextRequest, props: { params: Promise<{ path: string[] }> }, method: string) {
  try {
    const params = await props.params
    const { path } = params
    const { searchParams } = new URL(req.url)

    // Reconstruct the path from the catch-all route
    const apiPath = path.join("/")
    const queryString = searchParams.toString()
    const targetUrl = `${env.NEXT_PUBLIC_API_BASE_URL}/${apiPath}${queryString ? `?${queryString}` : ""}`

    // Detect if the request is multipart (file upload)
    const incomingContentType = req.headers.get("content-type") || ""
    const isMultipart = incomingContentType.includes("multipart/form-data")

    // Prepare headers to forward
    const forwardHeaders: HeadersInit = {}

    // Preserve the original content-type for multipart; default to JSON otherwise
    if (isMultipart) {
      forwardHeaders["Content-Type"] = incomingContentType
    } else {
      forwardHeaders["Content-Type"] = "application/json"
    }

    // Forward relevant headers from the original request
    const headersToForward = [
      "authorization",
      "x-authorization",
      "x-api-key",
      "x-requested-with",
      "user-agent",
      "accept",
      "accept-language",
    ]

    headersToForward.forEach((header) => {
      const value = req.headers.get(header)
      if (value) {
        forwardHeaders[header] = value
      }
    })

    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    // Prepare request body for methods that support it
    let body: BodyInit | undefined
    if (["POST", "PUT", "PATCH"].includes(method)) {
      try {
        if (isMultipart) {
          // Pass the raw body through to preserve multipart boundaries
          body = await req.arrayBuffer()
        } else {
          body = await req.text()
        }
      } catch (error) {
        console.error("Error reading request body:", error)
      }
    }

    const res = await fetch(targetUrl, {
      method,
      headers: forwardHeaders,
      body,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    // Forward the response
    const responseHeaders = new Headers()

    // Forward relevant response headers
    const responseHeadersToForward = [
      "content-type",
      "content-length",
      "cache-control",
      "etag",
      "last-modified",
      "x-ratelimit-limit",
      "x-ratelimit-remaining",
      "x-ratelimit-reset",
    ]

    responseHeadersToForward.forEach((header) => {
      const value = res.headers.get(header)
      if (value) {
        responseHeaders.set(header, value)
      }
    })

    // Add CORS headers
    responseHeaders.set("Access-Control-Allow-Origin", "*")
    responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
    responseHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")

    const responseBody = await res.text()

    return new NextResponse(responseBody, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error("Proxy Error:", error)

    // Return proper error status based on error type
    const isTimeout = error instanceof Error && (error.name === "AbortError" || error.message.includes("timeout"))
    const status = isTimeout ? 408 : 500

    return NextResponse.json(
      {
        error: isTimeout ? "Request timeout" : "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status }
    )
  }
}
