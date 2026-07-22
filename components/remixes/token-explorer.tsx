"use client"

import { useState, useRef, useMemo, useEffect } from "react"
import { Category, Community, Creator, Crown, Grid, List, Sort, TimerZero } from "@/components/icons"
import { cn } from "@/lib/utils"
import InfiniteScrollGrid from "@/components/remixes/infinite-scroll-grid"
import { Remix } from "@/types/remix"
import { useRouter, useSearchParams } from "next/navigation"
import { X, Info } from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import CategoriesFilter from "@/components/ui/categories-filter"
import FilterMeta from "@/components/ui/filter-meta"
import { AnimatePresence, motion } from "framer-motion"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger } from "@/components/ui/select"

const ViewOptions = [
  {
    key: "all",
    label: "All",
    icon: <TimerZero />,
    sort: "trending_score_24h",
    order: "desc",
    licensed: false,
    community: false,
  },
  {
    key: "community",
    label: "Community",
    icon: <Community />,
    sort: "trending_score_24h",
    order: "desc",
    licensed: false,
    community: true,
    tooltip: "Coins where ownership is tied to the community",
  },
  {
    key: "creator",
    label: "Creator",
    icon: <Crown />,
    sort: "trending_score_24h",
    order: "desc",
    licensed: true,
    community: false,
    tooltip: "Coins where ownership is tied to a specific creator",
  },
]

const SortOptions = [
  {
    key: "trending_score_24h_desc",
    label: "Trending",
    icon: <TimerZero />,
    sort: "trending_score_24h",
    order: "desc",
    isGraduated: undefined as boolean | undefined,
  },
  {
    key: "created_at_desc",
    label: "Newest",
    icon: <Crown width={14} height={14} />,
    sort: "created_at",
    order: "desc",
    isGraduated: undefined as boolean | undefined,
  },
  {
    key: "market_cap_desc",
    label: "Market Cap",
    icon: <Category />,
    sort: "market_cap",
    order: "desc",
    isGraduated: undefined as boolean | undefined,
  },
  {
    key: "graduation_progress_desc",
    label: "About to Graduate",
    icon: <TimerZero />,
    sort: "graduation_progress",
    order: "desc",
    isGraduated: false,
  },
]

type TokenExplorerProps = {
  initialRemixes: Remix[]
  total: number
  /** Enable sticky filter bar (with sentinel-based edge-to-edge expansion) */
  sticky?: boolean
  /** Whether category filters start expanded */
  defaultFiltersExpanded?: boolean
  /** Additional bottom padding on the grid container */
  gridClassName?: string
}

export default function TokenExplorer({
  initialRemixes,
  total,
  sticky = false,
  defaultFiltersExpanded = false,
  gridClassName,
}: TokenExplorerProps) {
  const [activeTabIndex, setActiveTabIndex] = useState<string>("all")
  const [isFiltersExpanded, setIsFiltersExpanded] = useState<boolean>(defaultFiltersExpanded)
  const tabsRef = useRef<(HTMLDivElement | null)[]>([])
  const router = useRouter()
  const urlSearchParams = useSearchParams()
  const currentView = urlSearchParams.get("view") || "grid"
  const categoryParam = urlSearchParams.get("category") || ""
  const verifiedParam = urlSearchParams.get("verified") === "true"
  const hideSpamParam = urlSearchParams.get("hide_spam") !== "false"
  const sortBy = urlSearchParams.get("sort_by") || "trending_score_24h"
  const sortOrder = urlSearchParams.get("sort_order") || "desc"
  const isGraduatedParam = urlSearchParams.get("is_graduated") // "false" | null
  const [selectedSort, setSelectedSort] = useState<string>(`${sortBy}_${sortOrder}`)
  const previousFilterRef = useRef<string>(`${activeTabIndex}-${sortBy}_${sortOrder}--`)

  // Sticky sentinel + filter bar measurement
  const sentinelRef = useRef<HTMLDivElement>(null)
  const filterBarRef = useRef<HTMLDivElement>(null)
  const [isStuck, setIsStuck] = useState(false)
  const [filterBarBottom, setFilterBarBottom] = useState(120)

  useEffect(() => {
    if (!sticky) return
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      ([entry]) => setIsStuck(!entry.isIntersecting),
      { threshold: 0, rootMargin: "-57px 0px 0px 0px" }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [sticky])

  // Measure filter bar height to position sticky list headers below it
  useEffect(() => {
    const el = filterBarRef.current
    if (!el) return
    const update = () => {
      // Filter bar sticks at top-14 (56px) — list header sits below it
      setFilterBarBottom(56 + el.offsetHeight)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [isFiltersExpanded])

  // Prevent scroll restoration on navigation
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
    return () => {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto'
      }
    }
  }, [])

  const handleViewChange = (view: string) => {
    const params = new URLSearchParams(urlSearchParams.toString())
    params.set("view", view)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const handleSortChange = (value: string) => {
    setSelectedSort(value)
    const sortOption = SortOptions.find((option) => option.key === value)
    if (sortOption) {
      const params = new URLSearchParams(urlSearchParams.toString())
      params.set("sort_by", sortOption.sort)
      params.set("sort_order", sortOption.order)
      if (sortOption.isGraduated === false) {
        params.set("is_graduated", "false")
      } else {
        params.delete("is_graduated")
      }
      router.replace(`?${params.toString()}`, { scroll: false })
    }
  }

  // Track filter changes
  useEffect(() => {
    const currentFilter = `${activeTabIndex}-${selectedSort}-${categoryParam}-${verifiedParam}-${hideSpamParam}`
    if (previousFilterRef.current !== currentFilter) {
      previousFilterRef.current = currentFilter
    }
  }, [activeTabIndex, selectedSort, categoryParam, verifiedParam, hideSpamParam])

  // Get search params based on active tab and sort
  const searchParams = useMemo(() => {
    const activeOption = ViewOptions.find((opt) => opt.key === activeTabIndex)
    const isGraduated = isGraduatedParam === "false" ? false : undefined
    if (!activeOption) {
      return {
        query: "",
        sort: sortBy,
        sort_order: sortOrder,
        licensed: false,
        community: false,
        claimed: false,
        verified: verifiedParam,
        socials: false,
        category: categoryParam,
        is_graduated: isGraduated,
        hide_spam: hideSpamParam,
      }
    }

    return {
      query: "",
      sort: sortBy,
      sort_order: sortOrder,
      licensed: activeOption.licensed,
      community: activeOption.community,
      claimed: false,
      verified: verifiedParam,
      socials: false,
      category: categoryParam,
      is_graduated: isGraduated,
      hide_spam: hideSpamParam,
    }
  }, [activeTabIndex, sortBy, sortOrder, categoryParam, verifiedParam, isGraduatedParam, hideSpamParam])

  const FilterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path fillRule="evenodd" clipRule="evenodd" d="M2.01163 0.583252C1.22262 0.583252 0.583008 1.22287 0.583008 2.01188C0.583008 2.36177 0.711411 2.69949 0.943864 2.961L5.24967 7.80504V12.8333C5.24967 13.0354 5.35435 13.2232 5.52633 13.3295C5.6983 13.4358 5.91304 13.4454 6.09387 13.355L8.42721 12.1883C8.62484 12.0895 8.74967 11.8876 8.74967 11.6666V7.80504L13.0555 2.961C13.2879 2.69949 13.4163 2.36177 13.4163 2.01188C13.4163 1.22287 12.7767 0.583252 11.9877 0.583252H2.01163Z" fill="#B3B3B3" />
    </svg>
  )

  return (
    <div className="flex w-full flex-col gap-4">
      {/* Sentinel for sticky detection */}
      {sticky && <div ref={sentinelRef} className="h-0 w-full" />}

      {/* Filter Bar */}
      <div ref={filterBarRef} className={cn(
        "border border-neutral-600! flex flex-col transition-all duration-300",
        sticky
          ? cn(
            "sticky top-14 z-30 bg-[#111111]/90 backdrop-blur-md px-3 pt-2.5 pb-1 sm:px-4 sm:pt-3",
            isStuck
              ? "w-[calc(100%+1.5rem)] -ml-3 sm:w-[calc(100%+2rem)] sm:-ml-4 rounded-none border-x-0"
              : "w-full rounded-[12px] sm:rounded-[16px]"
          )
          : "rounded-[16px] bg-neutral-800/90! w-full px-4 pt-3 pb-1"
      )}>
        {/* Row 1: Filter tabs (scrollable on mobile) */}
        <div className="no-scrollbar flex items-center overflow-x-auto pb-2 sm:pb-0">
          <div className="flex flex-1 gap-0.5 sm:gap-1">
            {ViewOptions.map((option, index) => {
              const isActive = activeTabIndex === option.key
              return (
                <div
                  key={`view-option-${option.key}`}
                  onClick={() => setActiveTabIndex(option.key)}
                  ref={(el) => {
                    tabsRef.current[index] = el
                  }}
                  className={cn(
                    "rounded-[10px] px-2.5 py-1.5 capitalize cursor-pointer flex items-center gap-1.5 transition-colors text-xs whitespace-nowrap sm:rounded-[12px] sm:px-3 sm:py-2 sm:text-sm",
                    isActive ? "bg-neutral-500/50! text-white" : "bg-transparent text-neutral-300 hover:text-white"
                  )}
                >
                  {option.icon}
                  <span className="hidden sm:inline">{option.label}</span>
                  <span className="sm:hidden">{option.label}</span>
                  {option.tooltip && (
                    <Tooltip>
                      <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <span className="hidden sm:inline-flex -ml-0.5 opacity-40 hover:opacity-100 transition-opacity cursor-help">
                          <Info size={13} className="text-current" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" sideOffset={8}>
                        {option.tooltip}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              )
            })}
          </div>
          {/* Desktop-only: view toggle, sort, filter expand — inline with tabs */}
          <div className="hidden items-center gap-2 sm:flex">
            <div className="flex flex-row items-center gap-1">
              <div
                className={cn(
                  "hover:bg-neutral-700/50 flex h-8 w-8 cursor-pointer items-center justify-center rounded-[8px] transition-colors",
                  currentView === "grid" ? "border-neutral-500 text-white bg-neutral-700/30" : "text-neutral-400 border-transparent"
                )}
                onClick={() => handleViewChange("grid")}
              >
                <Grid />
              </div>
              <div
                className={cn(
                  "hover:bg-neutral-700/50 flex h-8 w-8 cursor-pointer items-center justify-center rounded-[8px] transition-colors",
                  currentView === "list" ? "border-neutral-500 text-white bg-neutral-700/30" : "text-neutral-400 border-transparent"
                )}
                onClick={() => handleViewChange("list")}
              >
                <List />
              </div>
            </div>
            <Select value={selectedSort} onValueChange={handleSortChange}>
              <SelectTrigger className="h-10 rounded-[12px] border bg-neutral-700 px-3 text-white hover:bg-neutral-600 transition-colors">
                <div className="flex items-center gap-2">
                  <Sort size={14} />
                  <span className="text-sm text-neutral-300">Sort by:</span>
                  <span className="text-sm font-normal">
                    {SortOptions.find((option) => option.key === selectedSort)?.label || "Sort"}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-[12px]">
                <SelectGroup>
                  {SortOptions.map((option) => (
                    <SelectItem value={option.key} key={option.key}>
                      <div className="flex items-center gap-2">
                        {option.icon}
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <div
              className={cn(
                "rounded-[12px] size-9.5! flex items-center justify-center border cursor-pointer hover:bg-neutral-700 hover:border-neutral-400 transition-colors",
                isFiltersExpanded ? "p-2" : "p-3"
              )}
              onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
            >
              {isFiltersExpanded ? <X size={14} /> : <FilterIcon />}
            </div>
          </div>
        </div>
        {/* Row 2 (mobile only): Sort + View toggle compact */}
        <div className="flex items-center justify-between gap-2 border-t border-neutral-600/50 pt-2 pb-1 sm:hidden">
          <Select value={selectedSort} onValueChange={handleSortChange}>
            <SelectTrigger className="h-8 rounded-[10px] border bg-neutral-700 px-2.5 text-white hover:bg-neutral-600 transition-colors">
              <div className="flex items-center gap-1.5">
                <Sort size={12} />
                <span className="text-xs font-normal">
                  {SortOptions.find((option) => option.key === selectedSort)?.label || "Sort"}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-[12px]">
              <SelectGroup>
                {SortOptions.map((option) => (
                  <SelectItem value={option.key} key={option.key}>
                    <div className="flex items-center gap-2">
                      {option.icon}
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <div
              className={cn(
                "hover:bg-neutral-700/50 flex h-7 w-7 cursor-pointer items-center justify-center rounded-[6px] transition-colors",
                currentView === "grid" ? "text-white bg-neutral-700/30" : "text-neutral-400"
              )}
              onClick={() => handleViewChange("grid")}
            >
              <Grid />
            </div>
            <div
              className={cn(
                "hover:bg-neutral-700/50 flex h-7 w-7 cursor-pointer items-center justify-center rounded-[6px] transition-colors",
                currentView === "list" ? "text-white bg-neutral-700/30" : "text-neutral-400"
              )}
              onClick={() => handleViewChange("list")}
            >
              <List />
            </div>
          </div>
        </div>
        {/* Expandable category filters */}
        <div className="hidden overflow-hidden pb-2 sm:block">
          <AnimatePresence initial={false}>
            {isFiltersExpanded && (
              <motion.div
                key="expanded-filters"
                initial={{ height: 0, scale: 1, y: -20 }}
                animate={{ opacity: 1, height: "auto", scale: 1, y: 0, transition: { duration: 0.2 } }}
                exit={{ height: 0, scale: 1, y: -20, transition: { duration: 0.2 } }}
                className="overflow-hidden"
              >
                <div className="pt-3">
                  <div className="flex items-center gap-4 p-2 rounded-[12px] bg-neutral-700 border justify-between">
                    <CategoriesFilter className="py-0 relative z-0" itemClassName="relative z-1 bg-transparent! hover:y-0! hover:border-neutral-400! data-[active=true]:bg-neutral-500!" />
                    <div>
                      <FilterMeta />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Token Grid */}
      <div className={cn("w-full min-h-[500px]", gridClassName)}>
        <InfiniteScrollGrid
          key={`${activeTabIndex}-${selectedSort}-${categoryParam}-${verifiedParam}-${isGraduatedParam}-${hideSpamParam}`}
          initialRemixes={activeTabIndex === "all" ? (initialRemixes ?? []) : []}
          total={activeTabIndex === "all" ? (total ?? 9999) : 0}
          searchParams={searchParams}
          isIpOwner={false}
          stickyHeaderTop={sticky ? `${filterBarBottom}px` : "120px"}
        />
      </div>
    </div>
  )
}
