import { getAuthToken } from "@/lib/dynamic"

/** Fetch JSON - no auth (throws on error for React Query) */
export async function fetchJSON<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
  return res.json()
}

/** Fetch JSON with JWT auth (throws on error for React Query) */
export async function fetchJSONWithAuth<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "X-Authorization": `Bearer ${getAuthToken()}` },
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
  return res.json()
}
