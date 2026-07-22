"use client"

import { ReactNode } from "react"
import type { MobileStackPayload } from "@/context/mobile-ui-context"
import { useMobileStack } from "@/context/mobile-ui-context"

interface MobileStackTriggerProps {
  stackId: string
  stackPayload?: MobileStackPayload | null
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function MobileStackTrigger({
  stackId,
  stackPayload,
  children,
  className = "",
  onClick,
}: MobileStackTriggerProps) {
  const { openStack } = useMobileStack()

  return (
    <div
      className={className}
      onClick={() => {
        openStack(stackId, stackPayload === undefined ? undefined : stackPayload)
        onClick?.()
      }}
    >
      {children}
    </div>
  )
}
