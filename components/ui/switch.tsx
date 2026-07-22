"use client"

import * as SwitchPrimitive from "@radix-ui/react-switch"
import * as React from "react"
import { cn } from "@/lib/utils"

const Switch = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>) => (
  <SwitchPrimitive.Root
    className={cn(
      "focus-visible:ring-ring focus-visible:ring-offset-background data-[state=checked]:bg-green-neon peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[state=unchecked]:bg-neutral-400",
      className
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-neutral-700 shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitive.Root>
)
Switch.displayName = SwitchPrimitive.Root.displayName

export default Switch
