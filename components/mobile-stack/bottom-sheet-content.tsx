"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { BottomSheetMenuPortalContext } from "@/context/bottom-sheet-menu-portal-context"
import { useMobileStack } from "@/context/mobile-ui-context"
import { useKeyboardHeight } from "@/hooks/use-keyboard-height"

interface BottomSheetContentProps {
  id: string
  children: React.ReactNode
  className?: string
  height?: string
  adjustForKeyboard?: boolean
}

const DRAG_DISMISS_PX = 48

export function BottomSheetContent({
  id,
  children,
  className = "",
  height = "50%",
  adjustForKeyboard = false,
}: BottomSheetContentProps) {
  const { isOpen, currentStackId, closeStack } = useMobileStack()
  const { isKeyboardVisible } = useKeyboardHeight()
  const isCurrentStack = currentStackId === id
  const sheetActive = isOpen && isCurrentStack
  const [menuPortalHost, setMenuPortalHost] = useState<HTMLDivElement | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement | null>(null)

  const dragPointerId = useRef<number | null>(null)
  const dragStartY = useRef(0)
  const dragMaxDelta = useRef(0)

  const endWindowDrag = useRef<(() => void) | null>(null)

  const attachWindowDrag = useCallback(
    (pointerId: number, startClientY: number) => {
      dragPointerId.current = pointerId
      dragStartY.current = startClientY
      dragMaxDelta.current = 0

      const onMove = (ev: PointerEvent) => {
        if (ev.pointerId !== dragPointerId.current) return
        dragMaxDelta.current = Math.max(dragMaxDelta.current, ev.clientY - dragStartY.current)
      }

      const onUp = (ev: PointerEvent) => {
        if (ev.pointerId !== dragPointerId.current) return
        dragPointerId.current = null
        window.removeEventListener("pointermove", onMove)
        window.removeEventListener("pointerup", onUp)
        window.removeEventListener("pointercancel", onUp)
        endWindowDrag.current = null
        if (dragMaxDelta.current > DRAG_DISMISS_PX) {
          closeStack()
        }
      }

      window.addEventListener("pointermove", onMove, { passive: true })
      window.addEventListener("pointerup", onUp)
      window.addEventListener("pointercancel", onUp)
      endWindowDrag.current = () => {
        window.removeEventListener("pointermove", onMove)
        window.removeEventListener("pointerup", onUp)
        window.removeEventListener("pointercancel", onUp)
        dragPointerId.current = null
      }
    },
    [closeStack]
  )

  useEffect(() => {
    if (!sheetActive && endWindowDrag.current) {
      endWindowDrag.current()
      endWindowDrag.current = null
    }
  }, [sheetActive])

  useEffect(() => {
    return () => {
      endWindowDrag.current?.()
    }
  }, [])

  const onDragHandlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return
      e.preventDefault()
      attachWindowDrag(e.pointerId, e.clientY)
    },
    [attachWindowDrag]
  )

  // When the OS keyboard is up, `visualViewport.height` is already the visible area above it.
  // `useKeyboardHeight().keyboardHeight` is `(innerHeight - visualViewport)` — subtracting it
  // again here double-counts and can shrink the sheet to ~0px (browser chrome triggers "keyboard").
  const MIN_SHEET_WHEN_KEYBOARD_PX = 280

  const getDynamicHeight = () => {
    if (!adjustForKeyboard || !isKeyboardVisible) {
      return height
    }

    if (typeof window === "undefined") return height

    const visiblePx = window.visualViewport?.height ?? window.innerHeight
    const px = Math.max(Math.floor(visiblePx - 12), MIN_SHEET_WHEN_KEYBOARD_PX)
    return `${px}px`
  }

  useEffect(() => {
    if (sheetActive && scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = 0
    }
  }, [sheetActive])

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) closeStack()
    },
    [closeStack]
  )

  return (
    <>
      <Sheet modal open={sheetActive} onOpenChange={handleOpenChange}>
        <SheetContent
          side="bottom"
          className={`flex flex-col gap-0 rounded-t-2xl border-t-1 border-r-0 border-l-0 bg-black p-0 pb-[env(safe-area-inset-bottom)] transition-all duration-300 ${className}`}
          style={{ height: getDynamicHeight() }}
          onPointerDownOutside={(e) => {
            const t = e.target as HTMLElement | null
            if (t?.closest("[data-asset-selector-menu]")) {
              e.preventDefault()
            }
          }}
          onInteractOutside={(e) => {
            const t = e.target as HTMLElement | null
            if (t?.closest("[data-asset-selector-menu]")) {
              e.preventDefault()
            }
          }}
        >
          <BottomSheetMenuPortalContext.Provider value={menuPortalHost}>
            <div ref={setMenuPortalHost} className="relative flex min-h-0 flex-1 flex-col">
              {/* Large hit target so drag-to-close works on touch devices */}
              <div
                role="separator"
                aria-orientation="horizontal"
                aria-label="Drag down to close"
                className="flex shrink-0 cursor-grab touch-none flex-col items-center justify-center py-3 active:cursor-grabbing"
                onPointerDown={onDragHandlePointerDown}
              >
                <div className="bg-neutral-600 h-1 w-12 rounded-full" />
              </div>
              <div
                ref={scrollAreaRef}
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
              >
                {children}
              </div>
            </div>
          </BottomSheetMenuPortalContext.Provider>
        </SheetContent>
      </Sheet>
    </>
  )
}
