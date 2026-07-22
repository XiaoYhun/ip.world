"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { useSearchParamState } from "@/hooks/use-search-param-state"
import { Community, Creator, DotCircle } from "../icons"

export enum FILTER_IP_OPTIONS {
  ALL = "all",
  CREATOR = "creator",
  COMMUNITY = "community",
}

const TabItem = ({
  option,
  isActive,
  onClick,
  updatePosition,
}: {
  option: {
    label: string
    key: string
    icon: React.ReactNode
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
  }, [updatePosition, option.key, isActive]) // Added isActive to dependencies

  return (
    <div
      className={cn("flex cursor-pointer items-center justify-center gap-2 py-4", {
        "text-white": isActive,
        "hover:text-neutral-200 text-neutral-300": !isActive,
      })}
      onClick={onClick}
      ref={ref}
    >
      {option.icon}
      <span className={cn("text-sm font-medium whitespace-nowrap")}>{option.label}</span>
    </div>
  )
}

const FilterIp = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [tabLayout, setTabLayout] = useState<Record<string, { left: number; width: number }>>({})
  const [indicatorLeft, setIndicatorLeft] = useState<number>(0)
  const [indicatorWidth, setIndicatorWidth] = useState<number>(0)

  // Use the hook to sync selected filter with URL search params
  const [selected, setSelected] = useSearchParamState<string>({
    paramKey: "type",
    defaultValue: FILTER_IP_OPTIONS.ALL,
    replace: true, // Use replace to avoid polluting browser history
  })

  const options = [
    {
      label: "All",
      key: FILTER_IP_OPTIONS.ALL,
      icon: <DotCircle />,
    },
    {
      label: "Creator",
      key: FILTER_IP_OPTIONS.CREATOR,
      icon: <Creator size={16} />,
    },
    {
      label: "Community",
      key: FILTER_IP_OPTIONS.COMMUNITY,
      icon: <Community width={16} height={16} />,
    },
  ]

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

  return (
    <div className="scrollbar-hide relative flex w-full overflow-x-auto px-4 md:gap-6 md:px-0" ref={containerRef}>
      {options.map((option) => (
        <TabItem
          key={option.key}
          option={option}
          isActive={selected === option.key}
          onClick={() => setSelected(option.key)}
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

export default FilterIp
