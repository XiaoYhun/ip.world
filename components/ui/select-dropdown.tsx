"use client"

import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface SelectDropdownOption<T extends string> {
  value: T
  label: string
  icon?: React.ReactNode
}

interface SelectDropdownProps<T extends string> {
  value: T
  onChange: (val: T) => void
  options: SelectDropdownOption<T>[]
  placeholder?: string
  disabled?: boolean
  className?: string
  contentClassName?: string
}

export function SelectDropdown<T extends string>({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  className,
  contentClassName,
}: SelectDropdownProps<T>) {
  const selected = options.find((o) => o.value === value)

  return (
    <Select value={value} onValueChange={(v) => onChange(v as T)} disabled={disabled}>
      <SelectTrigger
        noArrow
        className={cn(
          "h-9 w-full gap-3 rounded-[10px] border border-neutral-500 bg-neutral-600 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-500",
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
      >
        <SelectValue placeholder={placeholder}>
          <span className="flex items-center gap-2.5">
            {selected?.icon}
            <span>{selected?.label ?? placeholder}</span>
          </span>
        </SelectValue>
        <ChevronDown size={14} className="ml-auto shrink-0 text-white opacity-60" />
      </SelectTrigger>
      <SelectContent
        className={cn(
          "z-50 rounded-[10px] border border-neutral-500 bg-neutral-700/95 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-md",
          contentClassName,
        )}
      >
        {options.map((opt) => (
          <SelectItem
            key={opt.value}
            value={opt.value}
            className="flex items-center gap-2.5 rounded-[6px] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/5 focus:bg-white/5"
          >
            <span className="flex items-center gap-2.5">
              {opt.icon}
              <span>{opt.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
