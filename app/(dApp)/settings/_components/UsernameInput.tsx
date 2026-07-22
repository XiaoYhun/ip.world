"use client"
import * as React from "react"

import { sanitizeUsernameInput } from "@/lib/username"
import { cn } from "@/lib/utils"

interface InputProps extends React.ComponentProps<"input"> {
  label?: string | React.ReactNode
  error?: string
  required?: boolean
  wrapperclassname?: string
  prefixEl?: React.ReactNode
  suffixEl?: React.ReactNode
  suffixInside?: boolean
  suffixPadding?: string
}

function UsernameInput({
  className,
  label,
  wrapperclassname,
  prefixEl,
  suffixEl,
  suffixInside = false,
  suffixPadding = "pe-8",
  required,
  type,
  onChange,
  ...props
}: InputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = sanitizeUsernameInput(e.target.value)
    if (next !== e.target.value) {
      e.target.value = next
    }
    onChange?.(e)
  }

  const handleWrapperClick = (_e: React.MouseEvent<HTMLDivElement>) => {
    inputRef.current?.focus()
  }

  return (
    <div className={wrapperclassname}>
      <div
        onMouseDown={handleWrapperClick}
        className={cn("cursor-text rounded-[12px] flex flex-col gap-2 bg-neutral-800 p-3 shadow-xs outline transition-[box-shadow] duration-200 focus-within:[box-shadow:0_0_2px_1px_var(--purple-200)]", className)}
      >
        {label && (
          <label className="pointer-events-none text-sm leading-normal font-normal text-neutral-400">
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            {prefixEl && <div className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2">{prefixEl}</div>}
            <input
              ref={inputRef}
              type={type}
              data-slot="input"
              onChange={handleChange}
              className={cn(
                "file:text-foreground selection:bg-primary selection:text-primary-foreground flex w-full min-w-0 bg-transparent! px-0! text-base [box-shadow:none!important] transition-colors outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                prefixEl ? "pl-7" : "pl-0",
                suffixInside && suffixEl ? suffixPadding : "pr-0",
                className
              )}
              {...props}
            />
            {suffixInside && suffixEl && (
              <div className="pointer-events-none absolute top-1/2 right-0 -translate-y-1/2 text-sm text-neutral-500">
                {suffixEl}
              </div>
            )}
          </div>
          {!suffixInside && !!suffixEl && <div className="pointer-events-none text-sm text-neutral-500">{suffixEl}</div>}
        </div>
      </div>
    </div>
  )
}

export default UsernameInput
