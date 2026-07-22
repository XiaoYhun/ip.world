"use client"

import { StarIcon } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
// import Person from "./icons/person"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger } from "./ui/select"
import { DollarFill, New, Sort } from "./icons"

const sortByOptions = [
  {
    key: "total_volume_desc",
    value: { sort: "total_volume", order: "desc" },
    label: "Featured",
    icon: <StarIcon />,
  },
  {
    key: "created_at_desc",
    value: { sort: "created_at", order: "desc" },
    label: "Newest",
    icon: <New />,
  },
  {
    key: "created_at_asc",
    value: { sort: "created_at", order: "asc" },
    label: "Oldest",
    icon: <New />,
  },
  {
    key: "market_cap_desc",
    value: { sort: "market_cap", order: "desc" },
    label: "Mcap: High To Low",
    icon: <DollarFill size={14} />,
  },
  {
    key: "market_cap_asc",
    value: { sort: "market_cap", order: "asc" },
    label: "Mcap: Low To High",
    icon: <DollarFill size={14} />,
  },
  // {
  //   key: "number_of_holders",
  //   value: { sort: "number_of_holders", order: "desc" },
  //   label: "HOLDERS",
  //   icon: <Person size={14} />,
  // },
]

const DEFAULT_SORT = "total_volume"
const DEFAULT_ORDER = "desc"
const SEARCH_PARAM_SORT_BY = "sort_by"
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
    <div className="flex w-full cursor-pointer gap-2 md:max-w-[200px]">
      <Select value={selected} onValueChange={onClick}>
        <SelectTrigger className="!h-[2rem] w-full cursor-pointer">
          <div className="flex cursor-pointer items-center gap-1">
            <Sort size={16} />
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
