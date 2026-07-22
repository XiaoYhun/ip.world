"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ChevronDown } from "lucide-react"
import { useBottomSheetMenuPortalHost } from "@/context/bottom-sheet-menu-portal-context"
import { cn } from "@/lib/utils"

export interface AssetSelectorOption<T extends string> {
  value: T
  triggerLabel: string
  menuLabel?: string
  icon?: React.ReactNode
}

interface AssetSelectorDropdownProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: AssetSelectorOption<T>[]
  disabled?: boolean
  /** Only show the selected icon in the trigger (no label or balance) */
  iconOnly?: boolean
  /** Optional balance to show in the trigger (amount + symbol) */
  balance?: { amount: React.ReactNode; symbol: React.ReactNode }
  /** Optional icon shown before balance (e.g. Wallet) */
  balanceIcon?: React.ReactNode
  /** Second row inside the trigger container: label tag + amount (hides inline balance / balanceIcon). */
  balanceBelow?: { label?: string; amount: React.ReactNode; symbol: React.ReactNode }
  /** Wrapper when `balanceBelow` is set (border / radius live here). */
  containerClassName?: string
  /** Optional icon override for the trigger while keeping option icons in the menu */
  triggerIcon?: React.ReactNode
  /** Render menu inline (absolute) instead of portaling to document.body — use inside dialogs/sheets */
  inline?: boolean
  menuAlign?: "start" | "end"
  menuWidthClassName?: string
  textSizeClassName?: string
  triggerClassName?: string
  menuItemClassName?: string
}

export default function AssetSelectorDropdown<T extends string>({
  value,
  onChange,
  options,
  disabled = false,
  iconOnly = false,
  balance,
  balanceIcon,
  balanceBelow,
  containerClassName,
  triggerIcon,
  inline = false,
  menuAlign = "start",
  menuWidthClassName = "w-[320px]",
  textSizeClassName = "text-base",
  triggerClassName,
  menuItemClassName,
}: AssetSelectorDropdownProps<T>) {
  const [open, setOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const triggerWrapRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuPortalHost = useBottomSheetMenuPortalHost()

  const syncMenuPosition = useCallback(() => {
    if (!triggerWrapRef.current) return
    const triggerRect = triggerWrapRef.current.getBoundingClientRect()
    const menuWidth = menuRef.current?.offsetWidth ?? triggerRect.width
    const viewportPadding = 8

    if (menuPortalHost && !inline) {
      const hostRect = menuPortalHost.getBoundingClientRect()
      const preferredLeft = menuAlign === "end"
        ? triggerRect.right - hostRect.left - menuWidth
        : triggerRect.left - hostRect.left
      const maxLeft = Math.max(viewportPadding, hostRect.width - menuWidth - viewportPadding)
      setMenuPosition({
        top: triggerRect.bottom - hostRect.top + 4,
        left: Math.min(Math.max(preferredLeft, viewportPadding), maxLeft),
      })
      return
    }

    const preferredLeft = menuAlign === "end"
      ? triggerRect.right - menuWidth
      : triggerRect.left
    const maxLeft = Math.max(viewportPadding, window.innerWidth - menuWidth - viewportPadding)

    setMenuPosition({
      top: triggerRect.bottom + 4,
      left: Math.min(Math.max(preferredLeft, viewportPadding), maxLeft),
    })
  }, [inline, menuAlign, menuPortalHost])

  useEffect(() => {
    if (!open) return
    syncMenuPosition()
    const frame = requestAnimationFrame(syncMenuPosition)

    const onDown = (e: PointerEvent) => {
      const target = e.target as Node
      const clickedTrigger = !!triggerWrapRef.current?.contains(target)
      const clickedMenu = !!menuRef.current?.contains(target)
      if (!clickedTrigger && !clickedMenu) setOpen(false)
    }
    const onScroll = () => syncMenuPosition()
    const onResize = () => syncMenuPosition()

    document.addEventListener("pointerdown", onDown)
    window.addEventListener("scroll", onScroll, true)
    window.addEventListener("resize", onResize)

    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener("pointerdown", onDown)
      window.removeEventListener("scroll", onScroll, true)
      window.removeEventListener("resize", onResize)
    }
  }, [open, syncMenuPosition])

  const selected = options.find((option) => option.value === value)
  if (!selected) return null

  const showBalanceBelow = balanceBelow != null

  const triggerButton = (
    <button
      type="button"
      onClick={() => !disabled && setOpen((previous) => !previous)}
      disabled={disabled}
      className={cn(
        "flex h-[41px] items-center gap-2 rounded-full border-[0.5px] border-[#313131] bg-[#151515] px-4 transition-colors hover:bg-[#1E1E1E] disabled:cursor-not-allowed disabled:opacity-50",
        showBalanceBelow &&
          "h-auto min-h-0 w-full justify-between !rounded-none border-0 !bg-transparent !px-0 py-0.5 !shadow-none hover:!bg-transparent",
        triggerClassName
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        {triggerIcon !== undefined ? triggerIcon : selected.icon}
        {!iconOnly && (
          <span className={cn("font-medium text-white", textSizeClassName)}>{selected.triggerLabel}</span>
        )}
      </span>
      {balance != null && !showBalanceBelow && (
        <span className="flex items-center gap-1 font-mono text-white">
          {balanceIcon}
          <span className={cn("font-medium", textSizeClassName)}>{balance.amount}</span>
          <span className={cn("ml-0.5 font-medium", textSizeClassName)}>{balance.symbol}</span>
        </span>
      )}
      <ChevronDown size={14} className={cn("shrink-0 text-white/80 transition-transform", open && "rotate-180")} />
    </button>
  )

  return (
    <div
      ref={triggerWrapRef}
      className={cn(
        "relative",
        showBalanceBelow &&
          cn(
            "flex flex-col gap-1.5 rounded-[23px] border-[0.5px] border-[#313131] bg-transparent p-2 transition-colors hover:bg-[#1A1A1A]",
            containerClassName
          )
      )}
    >
      {triggerButton}
      {showBalanceBelow && (
        <div className="flex items-center justify-between gap-2 px-0.5">
          <span className="shrink-0 rounded bg-[#242424] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#797979]">
            {balanceBelow.label ?? "Balance"}
          </span>
          <span className="flex min-w-0 items-center gap-1 text-right text-[14px] font-bold leading-none text-[#797979]">
            {balanceBelow.amount}
            {balanceBelow.symbol}
          </span>
        </div>
      )}

      {open && (() => {
        const portaledToSheet = Boolean(menuPortalHost && !inline)
        const menu = (
          <div
            ref={menuRef}
            data-asset-selector-menu
            style={
              inline
                ? undefined
                : {
                    position: portaledToSheet ? ("absolute" as const) : ("fixed" as const),
                    top: menuPosition.top,
                    left: menuPosition.left,
                  }
            }
            className={cn(
              "max-w-[calc(100vw-16px)] overflow-hidden rounded-[12px] border border-[#313131] bg-[#1D1D1D] p-1 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-md",
              inline ? "absolute left-0 top-[calc(100%+4px)] z-50" : "z-[9999]",
              menuWidthClassName
            )}
          >
            {options.map((option) => {
              const isSelected = option.value === value
              return (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-4 text-left transition-colors rounded-[8px] hover:bg-white/5",
                    isSelected && "bg-white/5",
                    menuItemClassName
                  )}
                >
                  <div className="shrink-0">
                    {option.icon}
                  </div>
                  <span className={cn("font-medium leading-none text-white text-nowrap", textSizeClassName)}>
                    {option.menuLabel ?? option.triggerLabel}
                  </span>
                </button>
              )
            })}
          </div>
        )
        if (inline) return menu
        const target = typeof document !== "undefined" ? (menuPortalHost ?? document.body) : null
        return target ? createPortal(menu, target) : null
      })()}
    </div>
  )
}
