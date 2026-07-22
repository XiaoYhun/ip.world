"use client"

import * as DialogPrimitive from "@radix-ui/react-dialog"
import { useDynamicContext } from "@dynamic-labs/sdk-react-core"
import { X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useWalletClient } from "wagmi"
import { env } from "@/config"

interface HallidayPaymentDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  /** "Debit" | "Credit Card" — used to pre-open the cash/card section */
  paymentMethod?: string
}

const HallidayPaymentDialog = ({ isOpen, onOpenChange, paymentMethod }: HallidayPaymentDialogProps) => {
  const { data: walletClient } = useWalletClient()
  const { primaryWallet } = useDynamicContext()
  const [isHallidayInitialized, setIsHallidayInitialized] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)

  // Reset Halliday state when overlay closes
  useEffect(() => {
    if (!isOpen) {
      setIsHallidayInitialized(false)
      setInitError(null)

      // Clear the iframe content to ensure clean state
      const iframeElement = document.getElementById("halliday-payments-iframe")
      if (iframeElement) {
        iframeElement.innerHTML = ""
      }
    }
  }, [isOpen])

  // Initialize Halliday after the modal opens and iframe element is rendered
  useEffect(() => {
    if (!isOpen || isHallidayInitialized || initError) return

    const initializeHalliday = async () => {
      try {
        // Check if we have a valid API key
        if (!env.NEXT_PUBLIC_HALLIDAY_PUBLIC_API_KEY || env.NEXT_PUBLIC_HALLIDAY_PUBLIC_API_KEY.trim() === "") {
          throw new Error("Halliday API key is not configured")
        }
        // Dynamically import the Halliday SDK to avoid module-level execution
        const { openHallidayPayments } = await import("@halliday-sdk/payments")

        const logoUrl = `${window.location.origin}/logo.svg`

        // "Debit" and "Credit Card" both map to the cash/card category.
        // paymentCategoryOrder with "open-cash" first pre-expands it on load.
        const isCardPayment = paymentMethod === "Debit" || paymentMethod === "Credit Card"

        // Prepare the config object
        const config = {
          apiKey: env.NEXT_PUBLIC_HALLIDAY_PUBLIC_API_KEY,
          outputs: ["story:0x"],
          sandbox: false,
          windowType: "EMBED" as const,
          targetElementId: "halliday-payments-iframe",
          ...(isCardPayment && {
            paymentCategoryOrder: ["open-cash", "wallet", "exchange"] as const,
            headerTitle: paymentMethod,
          }),
          customStyles: {
            primaryColor: "#ad74fe",
            backgroundColor: "#17171a",
            borderColor: "#222226",
            textColor: "#ffffff",
            textSecondaryColor: "#b3b3b3",
            logo: {
              src: logoUrl,
              alt: "IP.World",
              width: 32,
              height: 31,
            },
            getSigner: async () => {
              return primaryWallet?.address
            },
          },
        }

        await openHallidayPayments(config)
        await new Promise((resolve) => setTimeout(resolve, 1200))
        setIsHallidayInitialized(true)
      } catch (error) {
        console.error("Failed to initialize Halliday payments:", error)
        setInitError(error instanceof Error ? error.message : "Failed to initialize payment system")
      }
    }

    // Small delay to ensure DOM is rendered
    const timeoutId = setTimeout(initializeHalliday, 100)
    return () => clearTimeout(timeoutId)
  }, [isOpen, isHallidayInitialized, initError, walletClient, primaryWallet?.address, paymentMethod])

  const contentRef = useRef<HTMLDivElement>(null)

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Backdrop */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-9999 bg-black/80" />

        {/* Content */}
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-10000 -translate-x-1/2 -translate-y-1/2 outline-none"
          onEscapeKeyDown={() => onOpenChange(false)}
          onPointerDownOutside={() => onOpenChange(false)}
        >
          <div className="relative">
            {/* Close button sits outside the iframe div so it cannot be intercepted */}
            <button
              onClick={() => onOpenChange(false)}
              className="absolute -right-3 -top-3 z-10 flex size-7 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-neutral-600"
              style={{ backgroundColor: "rgba(34, 34, 38, 0.95)" }}
            >
              <X size={16} className="text-neutral-200 hover:text-white" />
            </button>

            <div
              ref={contentRef}
              className="relative max-h-[90vh] w-[480px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[8px] border border-[#222226] bg-[#17171a] shadow-2xl"
            >
              {/* Halliday iframe container */}
              <div
                id="halliday-payments-iframe"
                className="min-h-[400px] w-full overflow-hidden rounded-[8px]"
                style={{ border: "1px solid #222226", backgroundColor: "#17171a" }}
              />

              {/* Loading overlay */}
              {!isHallidayInitialized && !initError && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center rounded-[8px]"
                  style={{ backgroundColor: "rgba(23, 23, 26, 0.9)" }}
                >
                  <div
                    className="mb-4 h-8 w-8 animate-spin rounded-full border-b-2"
                    style={{ borderColor: "#ad74fe" }}
                  />
                </div>
              )}

              {/* Error overlay */}
              {initError && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center rounded-[8px] text-center"
                  style={{ backgroundColor: "rgba(23, 23, 26, 0.9)" }}
                >
                  <div className="mb-2 text-red-500">Payment system unavailable</div>
                  <div className="text-sm text-neutral-400">{initError}</div>
                </div>
              )}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export default HallidayPaymentDialog
