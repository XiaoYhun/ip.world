import * as React from "react"

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

function Input({
  className,
  label,
  wrapperclassname,
  prefixEl,
  suffixEl,
  suffixInside = false,
  suffixPadding = "pe-8",
  required,
  type,
  ...props
}: InputProps) {
  return (
    <div className={wrapperclassname}>
      {label && (
        <label className="text-sm leading-normal font-normal">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      <div className="relative flex items-center gap-2">
        {/* {!!prefixEl && !suffixInside && <>{prefixEl}</>} */}
        <div className="relative flex-1">
          <input
            type={type}
            data-slot="input"
            className={cn(
              "file:text-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 flex h-9 w-full min-w-0 rounded-[6px] bg-transparent py-1 text-base shadow-xs outline transition-[color,box-shadow] duration-200 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-300 focus-within:outline-2 focus-within:outline-neutral-400 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
              prefixEl ? "pl-10" : "pl-3", // Adjust left padding if there's a prefix
              suffixInside && suffixEl ? suffixPadding : "pr-3", // Adjust right padding if there's an inside suffix
              className
            )}
            {...props}
          />
          {prefixEl && <div className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">{prefixEl}</div>}
          {suffixInside && suffixEl && <div className="absolute top-1/2 right-3 -translate-y-1/2">{suffixEl}</div>}
        </div>
        {!suffixInside && !!suffixEl && <>{suffixEl}</>}
      </div>
    </div>
  )
}

export { Input }
