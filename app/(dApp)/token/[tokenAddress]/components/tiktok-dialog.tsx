import { ReactNode, useCallback, useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useIsMobileView } from "@/context/mobile-ui-context"
import { useInterval } from "@/hooks/use-interval"
import { cn } from "@/lib/utils"
import { Feed } from "@/types/feed"
import { X } from "lucide-react"
import { createPortal } from "react-dom"

const TiktokEmbed = ({ feed, onLoaded }: { feed: Feed; onLoaded?: () => void }) => {
  const [isLoading, setIsLoading] = useState(true)

  // Auto-dismiss skeleton after 3s — cross-origin checks are unreliable
  useEffect(() => {
    const timeout = setTimeout(() => { setIsLoading(false); onLoaded?.() }, 3000)
    return () => clearTimeout(timeout)
  }, [onLoaded])

  const checkIfLoaded = useCallback(() => {
    const iframe = document.querySelector(`iframe[src*="${feed.uid}"]`) as HTMLIFrameElement | null
    if (iframe) {
      try {
        if (iframe.style.visibility === "hidden") return
        setIsLoading(false); onLoaded?.()
      } catch {
        setIsLoading(false); onLoaded?.()
      }
    }
  }, [feed.uid, onLoaded])

  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://www.tiktok.com/embed.js"
    script.async = true
    document.body.appendChild(script)
    queueMicrotask(() => checkIfLoaded())
    return () => { document.body.removeChild(script) }
  }, [feed.uid, checkIfLoaded])

  useInterval(checkIfLoaded, isLoading ? 300 : null)

  return (
    <div className="relative flex flex-col">
      {isLoading && (
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 z-1 flex -translate-x-1/2 -translate-y-1/2 animate-pulse flex-col gap-4 rounded-[10px] bg-neutral-800/50"
          style={{ width: "325px", height: "741px" }}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-neutral-700" />
            <div className="flex-1">
              <div className="h-4 w-24 rounded bg-neutral-700" />
              <div className="mt-2 h-3 w-16 rounded bg-neutral-700" />
            </div>
          </div>
          <div className="flex-1 rounded-[10px] bg-neutral-700" />
          <div className="flex gap-4">
            <div className="h-6 w-6 rounded-full bg-neutral-700" />
            <div className="h-6 w-6 rounded-full bg-neutral-700" />
            <div className="h-6 w-6 rounded-full bg-neutral-700" />
          </div>
        </div>
      )}
      <blockquote
        className={cn("tiktok-embed border-neutral-600 border", isLoading && "opacity-0")}
        cite={`https://www.tiktok.com/@${feed.author_handle}/video/${feed.uid}`}
        data-video-id={feed.uid}
        data-embed-from="oembed"
        style={{ maxWidth: "325px", minWidth: "325px", minHeight: "600px", maxHeight: "741px" }}
      >
        <section></section>
      </blockquote>
    </div>
  )
}

const TiktokDialog = ({ trigger, feed }: { trigger: ReactNode; feed: Feed }) => {
  const [isOpen, setIsOpen] = useState(false)
  const isMobile = useIsMobileView()

  const handleOpen = () => {
    const existingDialogOverlay = document.querySelector("[data-radix-dialog-overlay]")
    const existingDialogContent = document.querySelector("[data-radix-dialog-content]")
    if (existingDialogOverlay || existingDialogContent) return
    setIsOpen(true)
  }

  // Lock body scroll when mobile overlay is open
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = "hidden"
      return () => { document.body.style.overflow = "" }
    }
  }, [isMobile, isOpen])

  // ─── MOBILE: plain portal overlay, no Radix ───
  if (isMobile) {
    return (
      <>
        <div onClick={handleOpen}>{trigger}</div>
        {isOpen && createPortal(
          <div className="fixed inset-0 z-[100] flex flex-col items-center bg-black/95 backdrop-blur-lg">
            {/* Close button */}
            <div className="flex w-full items-center justify-end px-4 pt-3 pb-2 shrink-0">
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-600 text-neutral-300"
              >
                <X size={16} />
              </button>
            </div>
            {/* Embed */}
            <div className="flex-1 flex items-start justify-center overflow-y-auto px-4">
              <TiktokEmbed feed={feed} />
            </div>
          </div>,
          document.body
        )}
      </>
    )
  }

  // ─── DESKTOP: Radix Dialog ───
  return (
    <Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="!w-fit !bg-black p-2 rounded-[16px]">
        <DialogHeader className="hidden">
          <DialogTitle></DialogTitle>
        </DialogHeader>
        <TiktokEmbed feed={feed} />
      </DialogContent>
    </Dialog>
  )
}

export default TiktokDialog
