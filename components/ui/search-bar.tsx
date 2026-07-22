"use client"

import Form from "next/form"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useRef, useState } from "react"
import { Search } from "../icons/search"
import { useSearchParamState } from "@/hooks/use-search-param-state"

const SearchBar = ({ inputClassName }: { inputClassName?: string }) => {
  const ref = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useSearchParamState({
    paramKey: "query",
    defaultValue: "",
  })
  const [inputValue, setInputValue] = useState(query)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      setQuery(inputValue)
    }
  }

  return (
    <div
      className={`${inputClassName ? inputClassName : ""} text-neutral-300 border-neutral-600 flex h-8 items-center gap-3 rounded-[10px] border px-3 transition-colors focus-within:border-white focus-within:text-white hover:border-white hover:text-white active:border-white active:text-white disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <input
        ref={ref}
        type="text"
        placeholder="Search"
        className="w-full bg-transparent font-normal placeholder:text-neutral-300 focus-visible:outline-hidden"
        name="query"
        defaultValue={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button type="submit" className="hidden">
        Submit
      </button>
      <Search />
    </div>
  )
}

export default SearchBar
