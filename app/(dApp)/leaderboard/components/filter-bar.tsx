"use client"

import { Search } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const FilterOptions = [
  {
    key: "trading",
    label: "Points",
  },
  {
    key: "ugc",
    label: "UGC",
  },
]

interface FilterBarProps {
  activeFilter: string
  onFilterChange: (filter: string) => void
}

export default function FilterBar({ activeFilter, onFilterChange }: FilterBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState<string>(searchParams.get("query") || "")

  const handleFilterChange = (filterKey: string) => {
    onFilterChange(filterKey)
    const params = new URLSearchParams(searchParams.toString())
    params.set("filter", filterKey)
    params.delete("page") // Reset to page 1 when filter changes
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value)
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const params = new URLSearchParams(searchParams.toString())
      if (searchValue.trim()) {
        params.set("query", searchValue.trim())
      } else {
        params.delete("query")
      }
      params.delete("page") // Reset to page 1 when searching
      router.replace(`?${params.toString()}`, { scroll: false })
    }
  }

  return (
    <div className="sticky top-14 z-10 -mx-3 -my-4 bg-background px-3 py-4">
      <div className="rounded-[12px] border bg-neutral-800 border-neutral-600! w-full flex flex-col gap-2 px-3 py-2.5 sm:rounded-[16px] sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-3 sm:gap-0">
        {/* Filter Tabs */}
        <div className="flex gap-1">
          {FilterOptions.map((option) => {
            const isActive = activeFilter === option.key
            return (
              <div
                key={`filter-option-${option.key}`}
                onClick={() => handleFilterChange(option.key)}
                className={cn(
                  "rounded-[10px] px-3 py-2 capitalize cursor-pointer flex items-center gap-1.5 transition-colors text-sm font-medium sm:rounded-[12px] sm:px-4 sm:py-3",
                  isActive ? "bg-neutral-500/50! text-white" : "bg-transparent text-neutral-300 hover:text-white"
                )}
              >
                {option.label}
              </div>
            )
          })}
        </div>

        {/* Search Input */}
        <div className="w-full sm:w-[280px]">
          <Input
            prefixEl={<Search size={14} className="text-neutral-400" />}
            className="bg-neutral-700! h-9 rounded-[10px] border-neutral-600! text-sm placeholder:text-neutral-400 sm:rounded-[12px]"
            placeholder="Search Users..."
            value={searchValue}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
          />
        </div>
      </div>
    </div>
  )
}
