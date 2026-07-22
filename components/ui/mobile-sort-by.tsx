"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export interface TabProps {
  key: string
  value: { sort: string; order: string }
  label: string
  className?: string
}

const TabItem = ({
  tab,
  isActive,
  onClick,
  updatePosition,
}: {
  tab: TabProps
  isActive: boolean
  onClick: () => void
  updatePosition: (left: number, width: number, label: string) => void
}) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (element) {
      const rect = element.getBoundingClientRect()
      updatePosition(rect.left, rect.width, tab.key)
    }
  }, [updatePosition, tab.key])

  return (
    <div
      className={cn("flex w-full cursor-pointer items-center justify-center py-4", tab.className)}
      onClick={onClick}
      ref={ref}
    >
      <span
        className={cn(
          "hover:text-neutral-200 text-sm font-medium text-neutral-300",
          isActive && "text-white hover:text-white"
        )}
      >
        {tab.label}
      </span>
    </div>
  )
}

const DEFAULT_SORT = "featured"
const DEFAULT_ORDER = "desc"
const SEARCH_PARAM_SORT_BY = "sort_by"
const SEARCH_PARAM_SORT_ORDER = "sort_order"

type MobileFilterProps = {
  options: TabProps[]
}

export const MobileSortByFilter = ({ options }: MobileFilterProps) => {
  const searchParams = useSearchParams()
  const defaultSort = searchParams.get(SEARCH_PARAM_SORT_BY) ?? DEFAULT_SORT
  const defaultOrder = searchParams.get(SEARCH_PARAM_SORT_ORDER) ?? DEFAULT_ORDER

  const [tabLayout, setTabLayout] = useState<Record<string, { left: number; width: number }>>({})
  const [indicatorLeft, setIndicatorLeft] = useState<number>(0)
  const [indicatorWidth, setIndicatorWidth] = useState<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const [selected, setSelected] = useState(
    defaultSort ? `${defaultSort}_${defaultOrder}` : `${DEFAULT_SORT}_${DEFAULT_ORDER}`
  )
  const pathname = usePathname()
  const router = useRouter()

  const onClick = (value: string) => {
    setSelected(value)

    const sortBy = options.find((option) => option.key === value)
    const params = new URLSearchParams(searchParams)

    if (sortBy) {
      params.set(SEARCH_PARAM_SORT_BY, sortBy.value.sort)
      params.set(SEARCH_PARAM_SORT_ORDER, sortBy.value.order)
      router.push(pathname + "?" + params.toString())
    }
  }

  const updatePosition = useCallback((left: number, width: number, label: string) => {
    if (containerRef.current) {
      const containerLeft = containerRef.current.getBoundingClientRect().left
      const relativeLeft = left - containerLeft
      setTabLayout((prev) => ({ ...prev, [label]: { left: relativeLeft, width } }))
    }
  }, [])

  useEffect(() => {
    if (tabLayout[selected]) {
      setIndicatorLeft(tabLayout[selected].left)
      setIndicatorWidth(tabLayout[selected].width)
    }
  }, [selected, tabLayout])

  return (
    <div className={cn("relative flex w-full justify-between px-1")} ref={containerRef}>
      {options.map((tab) => (
        <TabItem
          key={tab.key}
          tab={tab}
          isActive={selected === tab.key}
          onClick={() => onClick(tab.key)}
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
