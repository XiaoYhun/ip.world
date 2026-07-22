"use client"

import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import * as React from "react"

import { cn } from "@/lib/utils"
import { Label } from "./label"
import { CheckboxCheckmark } from "../icons/checkbox-checkmark"

interface CheckboxProps extends React.ComponentProps<typeof CheckboxPrimitive.Root> {
  variant?: "default" | "grotesk" | "brand"
  label?: React.ReactNode
  align?: "top" | "center"
}

function Checkbox({ className, label, align, variant = "default", ...props }: CheckboxProps) {
  const { checked } = props
  return (
    <div className={cn("flex gap-2", align === "top" ? "items-start" : "items-center")}>
      <CheckboxPrimitive.Root
        data-slot="checkbox"
        style={
          variant === "brand" && checked
            ? {
                backgroundColor: "var(--purple)",
                borderColor: "var(--purple)",
                color: "var(--purple-secondary)",
              }
            : undefined
        }
        className={cn(
          "peer border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 cursor-pointer rounded-[2px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator
          data-slot="checkbox-indicator"
          className="flex items-center justify-center text-current transition-none"
        >
          <CheckboxCheckmark color={variant === "brand" ? "var(--purple-secondary)" : "currentColor"} />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {label && <Label className="whitespace-nowrap">{label}</Label>}
    </div>
  )
}

export { Checkbox }
