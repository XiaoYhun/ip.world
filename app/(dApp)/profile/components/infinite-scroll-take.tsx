"use client"

import { Loader2 } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import Masonry from "react-masonry-css"
import { PAGINATION_LIMIT } from "@/lib/constants"
import { Take } from "@/types/take"
import TakeItem from "../../ip/[id]/components/take-item"
import { fetchUserTakes } from "../[wallet_address]/actions"

type InfiniteScrollGridProps = {
  address: string
  initialTakes: Take[]
  total: number
}

export default function InfiniteScrollTake({ address, initialTakes, total }: InfiniteScrollGridProps) {
  const [takes, setTakes] = useState<Take[]>(initialTakes)
  const [offset, setOffset] = useState(PAGINATION_LIMIT)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialTakes.length < total)
  const observerTarget = useRef<HTMLDivElement>(null)
  const lastAddressRef = useRef<string>("")
  const scrollPositionRef = useRef<number>(0)
  const isLoadingMoreRef = useRef<boolean>(false)

  // Reset when address actually changes (not just data refresh)
  useEffect(() => {
    const hasAddressChanged = lastAddressRef.current !== "" && lastAddressRef.current !== address

    if (hasAddressChanged) {
      // Address changed - reset everything and scroll to top
      setTakes(initialTakes)
      setOffset(PAGINATION_LIMIT)
      setHasMore(initialTakes.length < total)
      scrollPositionRef.current = 0
      window.scrollTo({ top: 0, behavior: "smooth" })
    } else if (lastAddressRef.current === address && takes.length > PAGINATION_LIMIT && !isLoadingMoreRef.current) {
      // Data refresh with same address, we have loaded data, and we're NOT in the middle of loading more
      // This means it's an external refresh - preserve state and scroll position
      const preservedTakes = [...takes]
      preservedTakes.splice(0, PAGINATION_LIMIT, ...initialTakes)
      setTakes(preservedTakes)
      setHasMore(preservedTakes.length < total)

      // Preserve scroll position only if we're not at the top
      if (scrollPositionRef.current > 200) {
        requestAnimationFrame(() => {
          window.scrollTo({ top: scrollPositionRef.current, behavior: "auto" })
        })
      }
    } else if (lastAddressRef.current === "" || takes.length <= PAGINATION_LIMIT) {
      // First load or we only have initial data
      setTakes(initialTakes)
      setOffset(PAGINATION_LIMIT)
      setHasMore(initialTakes.length < total)
    }

    lastAddressRef.current = address
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTakes, total, address])

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
      const response = await fetchUserTakes({
        userAddress: address,
        limit: PAGINATION_LIMIT,
        offset,
      })

      if (response.results.length > 0) {
        setTakes((prev) => [...prev, ...response.results])
        setOffset((prev) => prev + PAGINATION_LIMIT)
        setHasMore(takes.length + response.results.length < response.total)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error("Failed to load more takes:", error)
      setHasMore(false)
    } finally {
      setLoading(false)
      // Small delay to ensure loading state is properly reset
      setTimeout(() => {
        isLoadingMoreRef.current = false
      }, 100)
    }
  }, [loading, hasMore, address, offset, takes.length])

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

  const breakpointColumnsObj = {
    default: 1,
  }

  if (total === 0) {
    return (
      <div className="flex w-full justify-center py-10">
        <p className="text-neutral-300">No takes data</p>
      </div>
    )
  }

  return (
    <div className="max-w-[58.9375rem] px-2 py-9">
      <div className="flex flex-col">
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className="my-masonry-grid w-full max-w-[58.9375rem]"
          columnClassName="my-masonry-grid_column"
        >
          {takes.map((take: Take) => (
            <div key={`take-${take.id}`} className="w-full">
              <TakeItem data={take} />
              <div className="bg-neutral-600 my-8 h-[0.0625rem] w-full"></div>
            </div>
          ))}
        </Masonry>
      </div>
      {/* Intersection observer target */}
      {hasMore && (
        <div ref={observerTarget} className="flex justify-center py-8">
          {loading && (
            <div className="text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading more takes...</span>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
