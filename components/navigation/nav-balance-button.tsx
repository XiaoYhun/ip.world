"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ChevronDown } from "lucide-react"
import { Ip, Solana, Usdc } from "../icons"
import { useNavAssetBalances } from "@/hooks/use-nav-asset-balances"
import { usePaymentCurrency } from "@/context/payment-currency-context"
import { usePortfolio } from "@/context/portfolio-context"
import { type PaymentCurrency } from "@/config/relay-chains"
import { cn } from "@/lib/utils"

export const NAV_ASSET_OPTIONS: Array<{
  value: PaymentCurrency
  label: string
  icon: React.ReactNode
}> = [
  { value: "IP", label: "IP", icon: <Ip size={16} /> },
  { value: "SOL", label: "Solana", icon: <Solana size={16} /> },
  { value: "USDC", label: "USDC", icon: <Usdc size={16} /> },
]

export function NavBalanceButton() {
  const { paymentCurrency, setPaymentCurrency } = usePaymentCurrency()
  const { openPortfolio } = usePortfolio()
  const balances = useNavAssetBalances()
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const wrapRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const selected = NAV_ASSET_OPTIONS.find((o) => o.value === paymentCurrency) ?? NAV_ASSET_OPTIONS[0]
  const bal = balances[paymentCurrency]

  const syncMenuPosition = () => {
    if (!wrapRef.current) return
    const rect = wrapRef.current.getBoundingClientRect()
    setMenuPosition({ top: rect.bottom + 4, left: rect.left })
  }

  useEffect(() => {
    if (!menuOpen) return
    syncMenuPosition()
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (!wrapRef.current?.contains(t) && !menuRef.current?.contains(t)) setMenuOpen(false)
    }
    const onScroll = () => syncMenuPosition()
    const onResize = () => syncMenuPosition()
    document.addEventListener("pointerdown", onDown)
    window.addEventListener("scroll", onScroll, true)
    window.addEventListener("resize", onResize)
    return () => {
      document.removeEventListener("pointerdown", onDown)
      window.removeEventListener("scroll", onScroll, true)
      window.removeEventListener("resize", onResize)
    }
  }, [menuOpen])

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex h-[36px] items-center rounded-full border-[0.5px] border-neutral-600 bg-neutral-800">
        {/* Balance area → opens portfolio */}
        <button
          type="button"
          onClick={() => { setMenuOpen(false); openPortfolio() }}
          className="flex items-center gap-2 rounded-l-full py-2 pl-3 pr-2 transition-colors hover:bg-neutral-700"
        >
          {selected.icon}
          <span className="font-mono text-sm font-medium text-white">{bal.formatted}</span>
        </button>

        {/* Divider */}
        <div className="h-4 w-px bg-neutral-600" />

        {/* Chevron → opens dropdown */}
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="flex items-center rounded-r-full py-2 pr-3 pl-2 transition-colors hover:bg-neutral-700"
        >
          <ChevronDown size={14} className={cn("text-white/80 transition-transform", menuOpen && "rotate-180")} />
        </button>
      </div>

      {menuOpen &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: "fixed", top: menuPosition.top, left: menuPosition.left }}
            className="z-200 w-[220px] overflow-hidden rounded-[12px] border border-[#313131] bg-neutral-700 p-1 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-md"
          >
            {NAV_ASSET_OPTIONS.map((option) => {
              const isSelected = option.value === paymentCurrency
              return (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => {
                    setPaymentCurrency(option.value)
                    setMenuOpen(false)
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[8px] px-3 py-4 text-left transition-colors hover:bg-white/5",
                    isSelected && "bg-white/5"
                  )}
                >
                  <div className="shrink-0">{option.icon}</div>
                  <span className="text-sm font-medium leading-none text-nowrap text-white">
                    {balances[option.value].formatted} {option.value}
                  </span>
                </button>
              )
            })}
          </div>,
          document.body
        )}
    </div>
  )
}
