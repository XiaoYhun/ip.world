import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { getAPIRootUrl } from "@/lib/utils"

export type ResolvedUser = {
  username: string
  avatar_url: string
}

export type UserMap = Record<string, ResolvedUser>

async function resolveUsers(addresses: string[]): Promise<UserMap> {
  if (addresses.length === 0) return {}
  const res = await fetch(`${getAPIRootUrl()}/users/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ addresses }),
  })
  if (!res.ok) return {}
  return res.json()
}

/**
 * Batch-resolves wallet addresses to {username, avatar_url}.
 * Deduplicates and lowercases addresses before calling the API.
 * Results are cached by the sorted address set for 2 minutes.
 */
export function useResolveUsers(addresses: string[]) {
  const dedupedKey = useMemo(() => {
    const seen = new Set<string>()
    for (const addr of addresses) {
      if (addr) seen.add(addr.toLowerCase())
    }
    return Array.from(seen).sort()
  }, [addresses])

  const { data, isLoading } = useQuery<UserMap>({
    queryKey: ["resolve-users", dedupedKey],
    queryFn: () => resolveUsers(dedupedKey),
    enabled: dedupedKey.length > 0,
    staleTime: 2 * 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  })

  return { userMap: data ?? {}, isLoading }
}

/** Lookup helper: returns the resolved user for an address, or undefined. */
export function lookupUser(userMap: UserMap, address: string): ResolvedUser | undefined {
  return userMap[address?.toLowerCase()]
}
