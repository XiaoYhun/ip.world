"use client"

import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useMobileStack } from "@/context/mobile-ui-context"
import { TitleNavbar } from "../navigation/mobile-navbar"

interface MobileStackContentProps {
  id: string
  children: React.ReactNode
  title?: string
  subtitle?: string
  className?: string
}

export function MobileStackContent({
  id,
  children,
  title = "",
  subtitle = "",
  className = "",
}: MobileStackContentProps) {
  const { isOpen, currentStackId, closeStack } = useMobileStack()
  const isCurrentStack = currentStackId === id

  const handleOpenChange = (next: boolean) => {
    if (!next) closeStack()
  }

  return (
    <>
      {/* Stack Content */}
      <Sheet open={isOpen && isCurrentStack} onOpenChange={handleOpenChange}>
        <SheetContent side="right" className={`flex size-full flex-col border-none bg-black p-0 ${className}`}>
          {/* Header */}
          <TitleNavbar title={title} subtitle={subtitle} onBack={closeStack} />
          <div className="h-12 md:hidden" />

          {/* Content */}
          <div className="flex flex-1 flex-col overflow-y-auto">{children}</div>
        </SheetContent>
      </Sheet>
    </>
  )
}
