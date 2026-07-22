"use client"

import { Loader2 } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { PAGINATION_LIMIT } from "@/lib/constants"
import { Ip } from "@/types/ip"
import IpGridCard from "../../ips/ip-grid-card"
import { fetchUserIps } from "../[wallet_address]/actions"

type InfiniteScrollGridProps = {
  address: string
  initialIps: Ip[]
  total: number
}

export default function InfiniteScrollIp({ address, initialIps, total }: InfiniteScrollGridProps) {
  const [ips, setIps] = useState<Ip[]>(initialIps)
  const [offset, setOffset] = useState(PAGINATION_LIMIT)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialIps.length < total)
  const observerTarget = useRef<HTMLDivElement>(null)
  const lastAddressRef = useRef<string>("")
  const scrollPositionRef = useRef<number>(0)
  const isLoadingMoreRef = useRef<boolean>(false)

  // Reset when address actually changes (not just data refresh)
  useEffect(() => {
    const hasAddressChanged = lastAddressRef.current !== "" && lastAddressRef.current !== address

    if (hasAddressChanged) {
      // Address changed - reset everything and scroll to top
      setIps(initialIps)
      setOffset(PAGINATION_LIMIT)
      setHasMore(initialIps.length < total)
      scrollPositionRef.current = 0
      window.scrollTo({ top: 0, behavior: "smooth" })
    } else if (lastAddressRef.current === address && ips.length > PAGINATION_LIMIT && !isLoadingMoreRef.current) {
      // Data refresh with same address, we have loaded data, and we're NOT in the middle of loading more
      // This means it's an external refresh - preserve state and scroll position
      const preservedIps = [...ips]
      preservedIps.splice(0, PAGINATION_LIMIT, ...initialIps)
      setIps(preservedIps)
      setHasMore(preservedIps.length < total)

      // Preserve scroll position only if we're not at the top
      if (scrollPositionRef.current > 200) {
        requestAnimationFrame(() => {
          window.scrollTo({ top: scrollPositionRef.current, behavior: "auto" })
        })
      }
    } else if (lastAddressRef.current === "" || ips.length <= PAGINATION_LIMIT) {
      // First load or we only have initial data
      setIps(initialIps)
      setOffset(PAGINATION_LIMIT)
      setHasMore(initialIps.length < total)
    }

    lastAddressRef.current = address
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialIps, total, address])

  // Save scroll position periodically, but only when not loading
  useEffect(() => {
    const handleScroll = () => {
      if (!loading && !isLoadingMoreRef.current) {
        scrollPositionRef.current = window.scrollY
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [loading])

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return

    isLoadingMoreRef.current = true
    setLoading(true)
    try {
      const response = await fetchUserIps({
        userAddress: address,
        limit: PAGINATION_LIMIT,
        offset,
      })

      if (response.results.length > 0) {
        setIps((prev) => [...prev, ...response.results])
        setOffset((prev) => prev + PAGINATION_LIMIT)
        setHasMore(ips.length + response.results.length < response.total)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error("Failed to load more ips:", error)
      setHasMore(false)
    } finally {
      setLoading(false)
      // Small delay to ensure loading state is properly reset
      setTimeout(() => {
        isLoadingMoreRef.current = false
      }, 100)
    }
  }, [loading, hasMore, address, offset, ips.length])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [loadMore])

  if (total === 0) {
    return (
      <div className="flex w-full justify-center py-10">
        <p className="text-neutral-300">No ips data</p>
      </div>
    )
  }

  return (
    <div className="w-full px-2 py-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {ips.map((item, index) => (
          <IpGridCard key={`ip-${item.id}-${index}`} data={item} />
        ))}
      </div>

      {/* Intersection observer target */}
      {hasMore && (
        <div ref={observerTarget} className="flex justify-center py-8">
          {loading && (
            <div className="text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading more ips...</span>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
