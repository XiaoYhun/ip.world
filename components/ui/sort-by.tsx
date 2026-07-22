"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import React, { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

const sortByOptions = [
  {
    key: "total_volume_usd_desc",
    value: { sort: "total_volume_usd", order: "desc" },
    label: "Featured",
  },
  {
    key: "created_at_desc",
    value: { sort: "created_at", order: "desc" },
    label: "Newest",
  },
  {
    key: "market_cap_desc",
    value: { sort: "market_cap", order: "desc" },
    label: "Mcap",
  },
]

const DEFAULT_SORT = "total_volume_usd"
const DEFAULT_ORDER = "desc"
const SEARCH_PARAM_SORT_BY = "sort_by"
const SEARCH_PARAM_SORT_ORDER = "sort_order"

const TabItem = ({
  option,
  isActive,
  onClick,
  updatePosition,
}: {
  option: {
    label: string
    key: string
  }
  isActive: boolean
  onClick: () => void
  updatePosition: (left: number, width: number, key: string) => void
}) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (element) {
      const rect = element.getBoundingClientRect()
      updatePosition(rect.left, rect.width, option.key)
    }
  }, [updatePosition, option.key, isActive])

  return (
    <div
      className={cn("flex cursor-pointer items-center justify-center gap-2 py-4", {
        "text-white": isActive,
        "hover:text-neutral-200 text-neutral-300": !isActive,
      })}
      onClick={onClick}
      ref={ref}
    >
      <span className={cn("text-sm font-medium whitespace-nowrap")}>{option.label}</span>
    </div>
  )
}

const SortBy = () => {
  const searchParams = useSearchParams()
  const defaultSort = searchParams.get(SEARCH_PARAM_SORT_BY) ?? DEFAULT_SORT
  const defaultOrder = searchParams.get(SEARCH_PARAM_SORT_ORDER) ?? DEFAULT_ORDER
  const pathname = usePathname()
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [tabLayout, setTabLayout] = useState<Record<string, { left: number; width: number }>>({})
  const [indicatorLeft, setIndicatorLeft] = useState<number>(0)
  const [indicatorWidth, setIndicatorWidth] = useState<number>(0)

  const [selected, setSelected] = useState(
    defaultSort ? `${defaultSort}_${defaultOrder}` : `${DEFAULT_SORT}_${DEFAULT_ORDER}`
  )

  const updatePosition = useCallback((left: number, width: number, key: string) => {
    if (containerRef.current) {
      const containerLeft = containerRef.current.getBoundingClientRect().left
      const relativeLeft = left - containerLeft
      setTabLayout((prev) => ({ ...prev, [key]: { left: relativeLeft, width } }))
    }
  }, [])

  useEffect(() => {
    if (tabLayout[selected]) {
      setIndicatorLeft(tabLayout[selected].left)
      setIndicatorWidth(tabLayout[selected].width)
    }
  }, [selected, tabLayout])

  const onClick = (value: string) => {
    setSelected(value)

    const sortBy = sortByOptions.find((option) => option.key === value)
    const params = new URLSearchParams(searchParams)

    if (sortBy) {
      params.set(SEARCH_PARAM_SORT_BY, sortBy.value.sort)
      params.set(SEARCH_PARAM_SORT_ORDER, sortBy.value.order)
      router.push(pathname + "?" + params.toString())
    }
  }

  return (
    <div className="scrollbar-hide relative flex w-full overflow-x-auto px-4 md:gap-6 md:px-0" ref={containerRef}>
      {sortByOptions.map((option) => (
        <TabItem
          key={option.key}
          option={option}
          isActive={selected === option.key}
          onClick={() => onClick(option.key)}
          updatePosition={updatePosition}
        />
      ))}
      <div
        className={cn("absolute bottom-0 h-[2px] bg-white transition-all duration-300")}
        style={{
          width: `${indicatorWidth}px`,
          left: `${indicatorLeft}px`,
        }}
      />
    </div>
  )
}

export default SortBy
