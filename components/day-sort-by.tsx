"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { Sort } from "./icons/sort"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger } from "./ui/select"

const sortByOptions = [
  {
    key: "date_month_desc",
    value: { sort: "date_month", order: "desc" },
    label: "This Month",
    icon: <Sort size={10} />,
  },
  {
    key: "date_week_desc",
    value: { sort: "date_week", order: "desc" },
    label: "This Week",
    icon: <Sort size={10} />,
  },
  {
    key: "date_day_desc",
    value: { sort: "date_day", order: "desc" },
    label: "Today",
    icon: <Sort size={10} />,
  },
]

const DEFAULT_SORT = "date_week"
const DEFAULT_ORDER = "desc"
const SEARCH_PARAM_SORT_BY = "max_date"
const SEARCH_PARAM_SORT_ORDER = "sort_order"

const SortBy = () => {
  const searchParams = useSearchParams()
  const defaultSort = searchParams.get(SEARCH_PARAM_SORT_BY) ?? DEFAULT_SORT
  const defaultOrder = searchParams.get(SEARCH_PARAM_SORT_ORDER) ?? DEFAULT_ORDER

  const [selected, setSelected] = useState(
    defaultSort ? `${defaultSort}_${defaultOrder}` : `${DEFAULT_SORT}_${DEFAULT_ORDER}`
  )
  const pathname = usePathname()
  const router = useRouter()

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
    <div className="flex w-fit gap-2">
      <Select value={selected} onValueChange={onClick}>
        <SelectTrigger className="bg-neutral-2000 flex w-full cursor-pointer items-center gap-0.5 rounded-[1.25rem] border-none px-3 py-2 text-xs font-medium text-neutral-300">
          <div className="flex items-center gap-1">
            <Sort size={10} />
            {selected ? sortByOptions.find((option) => option.key === selected)?.label : "SORT"}
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {sortByOptions.map((option) => (
              <SelectItem value={option.key} key={option.key}>
                <div className="flex cursor-pointer items-center gap-1">
                  {option.icon}
                  {option.label}
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

export default SortBy
