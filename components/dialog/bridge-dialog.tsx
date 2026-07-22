"use client"

import { useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RELAY_STORY_CHAIN_ID } from "@/config/relay-chains"

declare global {
  interface Window {
    deBridge?: {
      widget: (config: Record<string, unknown>) => void
    }
  }
}

interface BridgeDialogProps {
  trigger: React.ReactNode
}

const WIDGET_ELEMENT_ID = "debridgeWidget"

const BridgeDialog = ({ trigger }: BridgeDialogProps) => {
  const [open, setOpen] = useState(false)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!open || initializedRef.current) return

    // Wait one tick for the dialog content to mount before initializing
    const timer = setTimeout(() => {
      if (typeof window !== "undefined" && window.deBridge) {
        window.deBridge.widget({
          v: "1",
          element: WIDGET_ELEMENT_ID,
          title: "",
          description: "",
          width: "100%",
          height: "580",
          outputChain: RELAY_STORY_CHAIN_ID,
          outputCurrency: "0x0000000000000000000000000000000000000000",
          lang: "en",
          mode: "deswap",
          theme: "dark",
          isHideLogo: false,
        })
        initializedRef.current = true
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [open])

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[640px] p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-5 pb-0">
            <DialogTitle>Bridge to Story</DialogTitle>
          </DialogHeader>
          <div id={WIDGET_ELEMENT_ID} className="w-full" />
        </DialogContent>
      </Dialog>
    </>
  )
}

export default BridgeDialog
