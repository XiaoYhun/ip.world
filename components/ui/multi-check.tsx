"use client"

import { Checkbox } from "@/components/ui/checkbox"

const MultiCheck = ({
  options,
  onChange,
  isV2 = false,
  selected,
}: {
  options: { label: string; key: string }[]
  onChange: (key: string, checked: boolean) => void
  isV2?: boolean
  selected?: string[]
}) => {
  return (
    <div className="flex gap-4">
      {options.map((option) => (
        <Checkbox
          key={option.key}
          label={option.label}
          onCheckedChange={(checked: boolean) => {
            onChange(option.key, checked)
          }}
          className={
            isV2
              ? "dark:data-[state=checked]:!text-purple-secondary data-[state=checked]:!border-[#AD74FE] dark:data-[state=checked]:!bg-[#AD74FE]"
              : ""
          }
          checked={selected?.includes(option.key)}
        />
      ))}
    </div>
  )
}

export default MultiCheck
