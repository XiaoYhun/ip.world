"use client"

import { ViewToggle } from "@/components/view-toggle"
import useDock from "@/hooks/use-dock"
import { cn } from "@/lib/utils"
import { TabProps } from "./mobile-sort-by"
import MobileMetaFilter from "./mobile-meta-filter"
import { MobileTabs } from "./mobile-tabs"
import SearchBar from "./search-bar"
import CategoriesFilter from "./categories-filter"

type MobileFilterProps = {
  options: TabProps[]
  selected: string
  onClick: (value: string) => void
  hideViewToggle?: boolean
}

export default function MobileFilters({ options, selected, onClick, hideViewToggle }: MobileFilterProps) {
  const { isDocked } = useDock({ threshold: 200, offset: 50 })

  return (
    <div className="md:hidden">
      <div className={cn("transition-all duration-300", isDocked ? "h-32" : "h-0")} />

      <div
        className={cn(
          "border-neutral-600 z-40 flex flex-col gap-4 border-b bg-black/95 backdrop-blur-md transition-all duration-300",
          isDocked ? "fixed top-[56px] right-0 left-0 px-4 py-3" : "relative mb-4 px-4"
        )}
      >
        <div className="flex flex-col gap-2">
          <div className="flex flex-row items-center gap-2">
            <div className="flex w-full justify-between gap-2">
              <MobileMetaFilter />
              <SearchBar />
            </div>
            {!hideViewToggle && <ViewToggle />}
          </div>

          <MobileTabs options={options} selected={selected} onClick={onClick} />
        </div>

        <CategoriesFilter />
      </div>
    </div>
  )
}
