"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import MobileFilters from "@/components/ui/mobile-filters"
import { exploreTabOptions } from "./constants/tabs"

const DEFAULT_SORT = "featured"
const DEFAULT_ORDER = "desc"

const SEARCH_PARAM_SORT_BY = "sort_by"
const SEARCH_PARAM_SORT_ORDER = "sort_order"

export default function MobileFilterWrapper() {
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

    const sortBy = exploreTabOptions.find((option) => option.key === value)
    const params = new URLSearchParams(searchParams)

    if (sortBy) {
      params.set(SEARCH_PARAM_SORT_BY, sortBy.value.sort)
      params.set(SEARCH_PARAM_SORT_ORDER, sortBy.value.order)
      router.push(pathname + "?" + params.toString())
    }
  }

  return <MobileFilters options={exploreTabOptions} selected={selected} onClick={onClick} />
}
