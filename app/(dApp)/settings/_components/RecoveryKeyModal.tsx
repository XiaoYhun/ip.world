"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ParticleCanvas } from "./ParticleCanvas"
import { AlertTriangle, X } from "lucide-react"
import { toast } from "sonner"

interface RecoveryKeyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  walletName: string
  walletIcon?: React.ReactNode
  onRevealKey: () => Promise<string | boolean>
  keyPlaceholder?: string
}

const AUTO_HIDE_SECONDS = 30

export function RecoveryKeyModal({
  open,
  onOpenChange,
  walletName,
  walletIcon,
  onRevealKey,
  keyPlaceholder,
}: RecoveryKeyModalProps) {
  const [isRevealed, setIsRevealed] = useState(false)
  const [confirmStep, setConfirmStep] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(AUTO_HIDE_SECONDS)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [mounted, setMounted] = useState(false)
  const keyAreaRef = useRef<HTMLDivElement>(null)
  const revealedAtRef = useRef<number>(0)
  const exportedKeyRef = useRef<string | null>(null)

  const handleHide = useCallback(() => {
    setIsRevealed(false)
    setConfirmStep(false)
    setTimeLeft(AUTO_HIDE_SECONDS)
    exportedKeyRef.current = null
    const container = document.getElementById("recovery-key-container")
    if (container) {
      container.innerHTML = ""
      container.style.opacity = ""
      container.style.pointerEvents = ""
    }
  }, [])

  const handleCopy = useCallback(() => {
    const key = exportedKeyRef.current
    if (key) {
      navigator.clipboard.writeText(key)
      toast.success("Copied to clipboard")
      return
    }
    const container = document.getElementById("recovery-key-container")
    if (!container) return
    const text = container.innerText?.trim()
    if (text) {
      navigator.clipboard.writeText(text)
      toast.success("Copied to clipboard")
    }
  }, [])

  useEffect(() => {
    if (!open) {
      setIsRevealed(false)
      setConfirmStep(false)
      setIsLoading(false)
      setTimeLeft(AUTO_HIDE_SECONDS)
      setMounted(false)
      setDimensions({ width: 0, height: 0 })
      exportedKeyRef.current = null
      const container = document.getElementById("recovery-key-container")
      if (container) {
        container.innerHTML = ""
        container.style.opacity = ""
        container.style.pointerEvents = ""
      }
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    const measureTimeout = setTimeout(() => {
      const el = keyAreaRef.current
      if (el) {
        const rect = el.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0) {
          setDimensions({ width: rect.width, height: rect.height })
          setMounted(true)
        }
      }
    }, 100)

    return () => clearTimeout(measureTimeout)
  }, [open])

  useEffect(() => {
    if (!mounted) return
    const el = keyAreaRef.current
    if (!el) return

    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      if (width > 0 && height > 0) {
        setDimensions({ width, height })
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [mounted])

  useEffect(() => {
    if (!isRevealed) return

    revealedAtRef.current = Date.now()
    setTimeLeft(AUTO_HIDE_SECONDS)

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - revealedAtRef.current) / 1000)
      const remaining = AUTO_HIDE_SECONDS - elapsed
      if (remaining <= 0) {
        clearInterval(interval)
        handleHide()
      } else {
        setTimeLeft(remaining)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isRevealed, handleHide])

  useEffect(() => {
    if (!isRevealed) return

    const handleVisibility = () => {
      if (document.hidden) {
        handleHide()
      }
    }

    document.addEventListener("visibilitychange", handleVisibility)
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility)
  }, [isRevealed, handleHide])

  const handleReveal = useCallback(async () => {
    if (!confirmStep) {
      setConfirmStep(true)
      return
    }
    setIsLoading(true)
    try {
      const result = await onRevealKey()
      if (result) {
        if (typeof result === "string") {
          exportedKeyRef.current = result
        }
        setIsRevealed(true)
        setConfirmStep(false)
      }
    } catch (err) {
      console.error("Failed to reveal key:", err)
    } finally {
      setIsLoading(false)
    }
  }, [confirmStep, onRevealKey])

  const placeholder =
    keyPlaceholder ?? "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-0 overflow-hidden rounded-2xl border-[#303030] bg-[#111111] p-0 sm:max-w-md"
        hasCloseButton={false}
        backdrop="blur"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 pt-5">
          <div className="flex items-center gap-2.5">
            {walletIcon && (
              <div className="flex text-[#b3b3b3]">
                {walletIcon}
              </div>
            )}
            <h2 className="text-base font-semibold text-white">
              {walletName} Recovery Key
            </h2>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-full p-1.5 text-neutral-500 transition-colors hover:bg-[#1a1a1a] hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Warning text */}
        <div className="px-5 pb-4">
          <p className="text-[14px] leading-relaxed text-neutral-400">
            Never share your recovery key. Anyone with this key has full access
            to your wallet.
          </p>
        </div>

        {/* Key display area */}
        <div className="px-5">
          <div
            ref={keyAreaRef}
            className="relative min-h-[140px] w-full overflow-hidden rounded-[12px] border border-[#303030] bg-[#0a0a0a]"
            onContextMenu={(e) => isRevealed && e.preventDefault()}
          >
            {/* Particle canvas — shown when NOT revealed */}
            {!isRevealed &&
              mounted &&
              dimensions.width > 0 &&
              dimensions.height > 0 && (
                <ParticleCanvas
                  isRevealed={false}
                  width={dimensions.width}
                  height={dimensions.height}
                  text={placeholder}
                  fontSize={12}
                  textAlign="left"
                  textPadding={32}
                  textPaddingTop={36}
                />
              )}

            {/* Countdown + copy overlay — inside key area when revealed */}
            {isRevealed && (
              <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-3 pt-2">
                <span className="pointer-events-auto font-mono text-[11px] text-neutral-500">
                  {timeLeft}s
                </span>
              </div>
            )}

            {/* Key content container — populated by Dynamic's WaaS iframe */}
            <div
              id="recovery-key-container"
              className={`absolute bottom-2 left-7 right-7 top-8 z-10 ${isRevealed
                ? "opacity-100"
                : "pointer-events-none opacity-0"
                }`}
              style={{
                userSelect: isRevealed ? "text" : "none",
                overflow: "hidden",
                maxHeight: "100%",
              }}
            />

            {/* Progress bar — pinned to bottom of key box, clipped by rounded corners */}
            {isRevealed && (
              <div className="absolute inset-x-0 bottom-0 z-20 h-[3px] bg-[#303030]">
                <div
                  className="h-full bg-[#7C5CFC] transition-all duration-1000 ease-linear"
                  style={{
                    width: `${(timeLeft / AUTO_HIDE_SECONDS) * 100}%`,
                  }}
                />
              </div>
            )}

            {/* Warning shelf - slides up from bottom */}
            <div
              className={`absolute bottom-0 left-0 right-0 z-20 transition-all duration-300 ease-out ${confirmStep && !isRevealed
                ? "translate-y-0 opacity-100"
                : "pointer-events-none translate-y-full opacity-0"
                }`}
            >
              <div className="mx-2.5 mb-2.5 flex items-center gap-2.5 rounded-[10px] border border-[#A76600] border-[1.1px] bg-[#1A1A1AA6]/95 px-4 py-3.5 pr-3 backdrop-blur-sm">
                <svg width="14" height="12" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fill-rule="evenodd" clipRule="evenodd" d="M6.51427 0L13.0286 12H0L6.51427 0ZM5.70012 7.36417V4.63722H7.32842V7.36417H5.70012ZM5.70012 10.0912V8.45502H7.32842V10.0912H5.70012Z" fill="#FFA71C" />
                </svg>

                <p className="flex-1 text-[11px] leading-snug text-neutral-300">
                  Your key will be visible. Make sure no one is watching.
                </p>
                <button
                  onClick={() => setConfirmStep(false)}
                  className="shrink-0 rounded px-1.5 py-0.5 text-[11px] text-neutral-400 transition-colors hover:bg-[#1a1a1a] hover:text-neutral-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="p-5 pt-4">
          {isRevealed ? (
            <button
              onClick={handleHide}
              className="w-full rounded-[12px] border border-[#303030] py-3.5 text-sm font-medium text-white transition-colors hover:bg-[#1a1a1a]"
            >
              Hide Key
            </button>
          ) : (
            <button
              onClick={handleReveal}
              disabled={isLoading}
              className={`w-full rounded-[12px] border py-3.5 text-sm font-medium transition-colors disabled:opacity-50 ${confirmStep
                ? "border-[#A76600] bg-[#4A3219] text-[#FFA71C] hover:bg-[#423219]"
                : "border-[#303030] text-white hover:bg-[#1a1a1a]"
                }`}
            >
              {isLoading
                ? "Revealing..."
                : confirmStep
                  ? "I Understand, Reveal My Key"
                  : "Reveal My Key"}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
