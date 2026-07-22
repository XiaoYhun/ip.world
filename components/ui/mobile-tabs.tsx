"use client"

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

type MobileTabsProps = {
  options: TabProps[]
  selected: string
  onClick: (value: string) => void
}

export const MobileTabs = ({ options, selected, onClick }: MobileTabsProps) => {
  const [tabLayout, setTabLayout] = useState<Record<string, { left: number; width: number }>>({})
  const [indicatorLeft, setIndicatorLeft] = useState<number>(0)
  const [indicatorWidth, setIndicatorWidth] = useState<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)

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
