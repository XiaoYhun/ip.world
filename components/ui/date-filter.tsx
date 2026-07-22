"use client"

import { cn } from "@/lib/utils"
import { useState } from "react"

const DEFAULT_SORT = "1w"

const sortByOptions = [
  {
    key: "1d",
    value: { sort: "1d" },
    label: "1D",
  },
  {
    key: "1w",
    value: { sort: "1w" },
    label: "1W",
  },
  {
    key: "1m",
    value: { sort: "1m" },
    label: "1M",
  },
  {
    key: "all",
    value: { sort: "all" },
    label: "ALL",
  },
]

interface DateFilterProps {
  initialSort?: string
  onChange?: (value: string) => void
}

const DateFilter = ({ initialSort, onChange }: DateFilterProps) => {
  const [selected, setSelected] = useState(initialSort || DEFAULT_SORT)

  const onClick = (value: string) => {
    setSelected(value)
    if (onChange) {
      onChange(value)
    }
  }

  return (
    <div className="flex w-fit items-center justify-center gap-2 rounded-[12px] border bg-black/2 p-2 backdrop-blur-[5px]">
      {sortByOptions.map((option) => (
        <div
          className={cn(
            `flex h-[26px] !cursor-pointer items-center justify-center rounded-[8px] px-3 py-[5px] text-xs font-medium text-neutral-300`,
            selected === option.key && "bg-neutral-600 text-white"
          )}
          key={option.key}
          onClick={() => onClick(option.key)}
        >
          {option.label}
        </div>
      ))}
    </div>
  )
}

export default DateFilter
