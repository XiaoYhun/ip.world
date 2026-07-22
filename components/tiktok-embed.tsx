import { useCallback, useEffect, useState } from "react"
import { useInterval } from "@/hooks/use-interval"
import { cn } from "@/lib/utils"
import { Feed } from "@/types/feed"

const TiktokEmbed = (feed: Feed) => {
  const [isLoading, setIsLoading] = useState(true)

  const checkIfLoaded = useCallback(() => {
    const iframe = document.querySelector(`iframe[src*="${feed.uid}"]`) as HTMLIFrameElement | null
    if (iframe) {
      try {
        // Check if iframe is still loading (TikTok sets visibility to hidden while loading)
        if (iframe.style.visibility === "hidden") {
          setIsLoading(true)
          return
        }

        // Try to access iframe content to check for video
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
        if (iframeDoc) {
          const videoElement = iframeDoc.querySelector("video")
          if (videoElement) {
            setIsLoading(false)
          } else {
            setIsLoading(true)
          }
        }
      } catch {
        // If we can't access iframe content (cross-origin), fallback to visibility check
        setIsLoading(iframe.style.visibility === "hidden")
      }
    }
  }, [feed.uid])

  useEffect(() => {
    // Reload TikTok embed script when component mounts
    const script = document.createElement("script")
    script.src = "https://www.tiktok.com/embed.js"
    script.async = true
    document.body.appendChild(script)

    // Initial check
    checkIfLoaded()

    return () => {
      document.body.removeChild(script)
    }
  }, [feed.uid, checkIfLoaded])

  // Use our custom interval hook
  useInterval(checkIfLoaded, isLoading ? 300 : null)

  return (
    <div className={cn("tiktok-embed-wrapper relative flex w-[325px] items-center justify-center")}>
      {isLoading && (
        <div
          className="absolute top-1/2 left-1/2 z-1 flex -translate-x-1/2 -translate-y-1/2 animate-pulse flex-col gap-4 rounded-[10px] bg-neutral-800/50 p-4"
          style={{ width: "325px", height: "741px" }}
        >
          {/* Author info skeleton */}
          <div className="flex items-center gap-3">
            <div className="bg-neutral-2000 h-10 w-10 rounded-full" />
            <div className="flex-1">
              <div className="bg-neutral-2000 h-4 w-24 rounded" />
              <div className="bg-neutral-2000 mt-2 h-3 w-16 rounded" />
            </div>
          </div>
          {/* Video skeleton */}
          <div className="bg-neutral-2000 flex-1 rounded-[10px]" />
          {/* Actions skeleton */}
          <div className="flex gap-4">
            <div className="bg-neutral-2000 h-6 w-6 rounded-full" />
            <div className="bg-neutral-2000 h-6 w-6 rounded-full" />
            <div className="bg-neutral-2000 h-6 w-6 rounded-full" />
          </div>
        </div>
      )}
      <blockquote
        className={cn("tiktok-embed border-neutral-600 border", isLoading && "opacity-0")}
        cite={`https://www.tiktok.com/@${feed.author_handle}/video/${feed.uid}`}
        data-video-id={feed.uid}
        data-embed-from="oembed"
        style={{ maxWidth: "325px", minWidth: "325px", minHeight: "741px", maxHeight: "741px" }}
      >
        <section></section>
      </blockquote>
    </div>
  )
}

export default TiktokEmbed
