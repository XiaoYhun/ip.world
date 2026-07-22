"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger } from "./select"
import { Sort } from "../icons/sort"

const sortByOptions = [
  { key: "all", label: "All" },
  { key: "verified", label: "Verified" },
  { key: "socials", label: "Socials" },
]

export default function MobileMetaFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  // Determine current value from params
  const getValueFromParams = () => {
    if (searchParams.get("verified") === "true") return "verified"
    if (searchParams.get("socials") === "true") return "socials"
    return "all"
  }
  const [selected, setSelected] = useState(getValueFromParams())

  useEffect(() => {
    setSelected(getValueFromParams())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handleChange = (value: string) => {
    setSelected(value)

    const params = new URLSearchParams(searchParams)
    if (value === "verified") {
      params.set("verified", "true")
      params.delete("socials")
    } else if (value === "socials") {
      params.set("socials", "true")
      params.delete("verified")
    } else {
      params.delete("verified")
      params.delete("socials")
    }
    router.push(pathname + "?" + params.toString())
  }

  return (
    <div className="flex w-fit gap-2">
      <Select value={selected} onValueChange={handleChange}>
        <SelectTrigger
          className="border-neutral-600 flex w-32 cursor-pointer items-center rounded-[10px] border bg-transparent text-xs font-medium text-neutral-300"
          size="sm"
        >
          <div className="flex items-center gap-1">
            <Sort size={10} />
            {selected ? sortByOptions.find((option) => option.key === selected)?.label : "SORT"}
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {sortByOptions.map((option) => (
              <SelectItem value={option.key} key={option.key}>
                <div className="flex cursor-pointer items-center gap-1">{option.label}</div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
