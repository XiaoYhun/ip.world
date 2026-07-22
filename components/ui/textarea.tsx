import * as React from "react"

import { cn } from "@/lib/utils"

interface TextareaProps extends React.ComponentProps<"textarea"> {
  label?: string
  error?: string
  wrapperclassname?: string
  required?: boolean
  prefixEl?: React.ReactNode
  suffixEl?: React.ReactNode
}

function Textarea({ className, prefixEl, suffixEl, wrapperclassname, ...props }: TextareaProps) {
  return (
    <div className={wrapperclassname}>
      <div className="flex items-center gap-2">
        {!!prefixEl && <>{prefixEl}</>}
        <textarea
          data-slot="textarea"
          className={cn(
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 dark:bg-input/30 outline-border flex field-sizing-content min-h-16 w-full rounded-[6px] bg-transparent px-3 py-2 text-base shadow-xs outline transition-all duration-200 placeholder:text-neutral-300 focus-within:outline-2 focus-within:outline-neutral-400 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className
          )}
          {...props}
        />
        {!!suffixEl && <>{suffixEl}</>}
      </div>
    </div>
  )
}

export { Textarea }
