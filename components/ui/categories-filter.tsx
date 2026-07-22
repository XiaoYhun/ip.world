"use client"

import { motion } from "framer-motion"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import React, { Suspense, useEffect, useRef, useState } from "react"
import { CATEGORIES } from "@/lib/constants"
import { cn } from "@/lib/utils"

const SEARCH_PARAM_CATEGORIES = "category"

const CategoriesFilter = ({ className, itemClassName }: { className?: string, itemClassName?: string }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Initialize active tags from URL search params (using keys)
  const initialTags = searchParams.get(SEARCH_PARAM_CATEGORIES)?.split(",") || []
  const [activeTags, setActiveTags] = useState<string[]>(initialTags)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return
      e.preventDefault()
      el.scrollBy({ left: e.deltaY, behavior: "smooth" })
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [])

  const toggleTag = (key: string) => {
    const newActiveTags = activeTags.includes(key) ? activeTags.filter((tag) => tag !== key) : [...activeTags, key]

    setActiveTags(newActiveTags)
    scrollRef.current?.scrollTo({ left: 0, behavior: "smooth" })

    // Update URL with new categories
    const params = new URLSearchParams(searchParams)

    if (newActiveTags.length > 0) {
      params.set(SEARCH_PARAM_CATEGORIES, newActiveTags.join(","))
    } else {
      params.delete(SEARCH_PARAM_CATEGORIES)
    }

    router.replace(pathname + "?" + params.toString(), { scroll: false })
  }

  // Sync with URL when navigating back/forward
  useEffect(() => {
    const currentTags = searchParams.get(SEARCH_PARAM_CATEGORIES)?.split(",") || []
    setActiveTags(currentTags)
  }, [searchParams])

  const sortedCategories = [...CATEGORIES].sort((a, b) => {
    const aActive = activeTags.includes(a.key) ? 0 : 1
    const bActive = activeTags.includes(b.key) ? 0 : 1
    return aActive - bActive
  })

  return (
    <Suspense>
      <div ref={scrollRef} className={cn("no-scrollbar flex w-full gap-2 overflow-x-auto py-1 md:w-auto", className)}>
        {sortedCategories.map(({ key, label, icon }) => {
          const isActive = activeTags.includes(key)
          return (
            <motion.button
              key={key}
              onClick={() => toggleTag(key)}
              className={cn(`relative flex shrink-0 cursor-pointer items-start justify-start gap-1 overflow-hidden rounded-[0.375rem] border bg-neutral-400 px-2 py-1 text-sm leading-[100%] font-semibold ${isActive ? "text-white" : "text-neutral-200"
                }`, itemClassName)}
              data-active={isActive}
              whileHover={{
                filter: "brightness(1.2)",
                transition: { duration: 0.15, ease: "easeOut" },
              }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="z-10">{React.createElement(icon)}</span>
              <span className="z-10">{label}</span>
              {!isActive && (
                <div className="pointer-events-none absolute inset-0 z-[0] bg-[#17171a] text-neutral-200" />
              )}
            </motion.button>
          )
        })}
      </div>
    </Suspense>
  )
}

export default CategoriesFilter
