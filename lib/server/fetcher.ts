const fetchWithJWTCheck = async (url: string, options: RequestInit = {}, token?: string) => {
  if (!token) {
    throw new Error("Unauthorized: No token provided")
  }

  const headers = new Headers(options.headers || {})
  headers.set("X-Authorization", `Bearer ${token}`)

  const method = (options.method || "GET").toUpperCase()
  const hasAuth = Boolean(headers.get("authorization") || headers.get("x-authorization"))

  const response = await fetch(url, {
    ...options,
    headers,
    cache: method === "POST" || hasAuth ? "no-store" : options.cache,
  })

  return response
}

export default fetchWithJWTCheck
