import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface MultiSwitchItem {
  label: string
  value: string
  icon?: React.ReactNode
}

interface MultiSwitchItemNodeProps {
  item: MultiSwitchItem
  isActive: boolean
  onClick: () => void
  updatePosition: (left: number, width: number, value: string) => void
}

const MultiSwitchItemNode = ({ item, isActive, onClick, updatePosition }: MultiSwitchItemNodeProps) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (element) {
      const rect = element.getBoundingClientRect()
      updatePosition(rect.left, rect.width, item.value)
    }
  }, [updatePosition, item.value])

  return (
    <div
      className={cn(
        "z-1 flex h-6 cursor-pointer items-center gap-2 px-2 py-1 text-[13px]! text-neutral-300 hover:text-neutral-200",
        isActive && "text-white!"
      )}
      onClick={onClick}
      ref={ref}
    >
      {item.icon && <span>{item.icon}</span>}
      <span className="text-sm">{item.label}</span>
    </div>
  )
}

interface MultiSwitchProps {
  items: MultiSwitchItem[]
  activeValue: string
  setActiveValue: (value: string) => void
  className?: string
}

export const MultiSwitch = ({ items, activeValue, setActiveValue, className }: MultiSwitchProps) => {
  const [switchLayout, setSwitchLayout] = useState<Record<string, { left: number; width: number }>>({})
  const [indicatorLeft, setIndicatorLeft] = useState<number>(0)
  const [indicatorWidth, setIndicatorWidth] = useState<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const updatePosition = useCallback((left: number, width: number, value: string) => {
    if (containerRef.current) {
      const containerLeft = containerRef.current.getBoundingClientRect().left
      const relativeLeft = left - containerLeft
      setSwitchLayout((prev) => ({ ...prev, [value]: { left: relativeLeft, width } }))
    }
  }, [])

  useEffect(() => {
    if (switchLayout[activeValue]) {
      setIndicatorLeft(switchLayout[activeValue].left)
      setIndicatorWidth(switchLayout[activeValue].width)
    }
  }, [activeValue, switchLayout])

  return (
    <div className={cn("relative flex", className)} ref={containerRef}>
      {items.map((item) => (
        <MultiSwitchItemNode
          key={item.value}
          item={item}
          isActive={activeValue === item.value}
          onClick={() => setActiveValue(item.value)}
          updatePosition={updatePosition}
        />
      ))}
      <div
        className="absolute top-0 left-0 z-0 h-full rounded-[6px] border transition-all duration-300"
        style={{
          left: indicatorLeft,
          width: indicatorWidth,
          background: "linear-gradient(173deg, #44444D 0%, #212124 100%)",
        }}
      />
    </div>
  )
}

export default MultiSwitch
