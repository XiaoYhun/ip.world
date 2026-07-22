"use client"

import { useSearchParamState } from "@/hooks/use-search-param-state"
import { Checkbox } from "./checkbox"

const FilterMeta = () => {
  const [verified, setVerified] = useSearchParamState<boolean>({
    paramKey: "verified",
    defaultValue: false,
    serialize: (v) => (v ? "true" : "false"),
    deserialize: (v) => v === "true",
    replace: true,
  })

  const [hideSpam, setHideSpam] = useSearchParamState<boolean>({
    paramKey: "hide_spam",
    defaultValue: true,
    serialize: (v) => (v ? "true" : "false"),
    deserialize: (v) => v !== "false",
    replace: true,
  })

  return (
    <div className="flex items-center gap-3">
      <div className="flex cursor-pointer! items-center gap-2 rounded-[6px] border border-neutral-500 bg-neutral-700 p-1.5 hover:bg-neutral-600">
        <Checkbox
          className="size-4! rounded-[4px] text-sm! leading-[10px]! data-[state=checked]:border-black! data-[state=checked]:bg-white! data-[state=checked]:text-black!"
          onCheckedChange={(checked: boolean) => {
            setVerified(checked)
          }}
          checked={verified}
          id="verified"
        />
        <label htmlFor="verified" className="cursor-pointer! text-sm font-medium text-white">
          Verified
        </label>
      </div>
      <div className="flex cursor-pointer! items-center gap-2 rounded-[6px] border border-neutral-500 bg-neutral-700 p-1.5 hover:bg-neutral-600">
        <Checkbox
          className="size-4! rounded-[4px] text-sm! leading-[10px]! data-[state=checked]:border-black! data-[state=checked]:bg-white! data-[state=checked]:text-black!"
          onCheckedChange={(checked: boolean) => {
            setHideSpam(checked)
          }}
          checked={hideSpam}
          id="hide_spam"
        />
        <label htmlFor="hide_spam" className="cursor-pointer! text-sm font-medium text-white text-nowrap">
          Hide Spam
        </label>
      </div>
    </div>
  )
}

export default FilterMeta
