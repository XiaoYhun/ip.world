"use client"

import { Download, XIcon } from "lucide-react"
import { useCallback } from "react"
import { toast } from "sonner"

import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { downloadImageUrl } from "@/lib/download-image"
import { cn } from "@/lib/utils"
import type { Remix } from "@/types/remix"

const floatBtn =
  "z-10 flex size-9 cursor-pointer items-center justify-center rounded-full border-0 bg-black/55 text-white shadow-md backdrop-blur-sm transition-colors hover:bg-black/75 focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  remix: Pick<Remix, "image" | "name" | "symbol" | "token_address">
}

export function TokenImageViewerDialog({ open, onOpenChange, remix }: Props) {
  const handleDownload = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!remix.image) return
      void downloadImageUrl(remix.image, remix.symbol || "token").catch(() => {
        toast.error("Could not download image")
      })
    },
    [remix.image, remix.symbol]
  )

  if (!remix.image) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hasCloseButton={false}
        className={cn(
          "!flex !w-fit !max-w-none flex-col gap-0 overflow-visible border-0 bg-transparent p-0 shadow-none sm:!max-w-none",
          "max-h-[min(90dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1rem))]",
          "dark:!bg-transparent"
        )}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">
          Token image — {remix.name} (${remix.symbol})
        </DialogTitle>
        <div className="relative leading-none">
          {/* eslint-disable-next-line @next/next/no-img-element -- intrinsic sizing for dialog hugging image */}
          <img
            src={remix.image}
            alt={`${remix.name} token image`}
            className="block max-h-[min(85dvh,calc(100dvh-2rem))] max-w-[min(96vw,calc(100vw-1.5rem))] h-auto w-auto object-contain"
            draggable={false}
          />
          <DialogClose className={cn(floatBtn, "absolute top-2 right-2")} aria-label="Close">
            <XIcon className="size-4" strokeWidth={2.5} />
          </DialogClose>
          <button type="button" className={cn(floatBtn, "absolute right-2 bottom-2")} onClick={handleDownload} aria-label="Download image">
            <Download className="size-4" strokeWidth={2.5} />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
