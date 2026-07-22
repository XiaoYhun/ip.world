"use client"
import * as React from "react"

import { cn } from "@/lib/utils"

interface TextareaProps extends React.ComponentProps<"textarea"> {
  label?: string | React.ReactNode
  error?: string
  required?: boolean
  wrapperclassname?: string
  suffixEl?: React.ReactNode
}

function CustomTextarea({
  className,
  label,
  wrapperclassname,
  suffixEl,
  required,
  ...props
}: TextareaProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const handleWrapperClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't focus if clicking on the textarea itself
    if (e.target !== textareaRef.current) {
      textareaRef.current?.focus()
    }
  }

  return (
    <div className={wrapperclassname}>
      <div
        onMouseDown={handleWrapperClick}
        className="cursor-text rounded-[12px] flex flex-col gap-2 bg-neutral-800 p-3 shadow-xs outline transition-[box-shadow] duration-200 focus-within:[box-shadow:0_0_2px_1px_var(--purple-200)]"
      >
        {label && (
          <label className="pointer-events-none text-sm leading-normal font-normal text-neutral-400">
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}
        <div className="relative">
          <textarea
            ref={textareaRef}
            data-slot="textarea"
            className={cn(
              "file:text-foreground selection:bg-primary selection:text-primary-foreground flex min-h-[80px] w-full resize-none bg-transparent! px-0! py-0! text-base [box-shadow:none!important] transition-colors outline-none placeholder:text-neutral-500 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
              className
            )}
            {...props}
          />
          {suffixEl && (
            <div className="pointer-events-none absolute bottom-0 right-0 text-xs text-neutral-400">
              {suffixEl}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CustomTextarea
