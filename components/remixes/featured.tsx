"use client"
import { useEffect, useRef } from "react"
import { Info } from "lucide-react"
import { Remix } from "@/types/remix"
import RemixGridItemFeatured from "./grid-item-featured"
import { LivePurchaseParticles } from "../ui/live-purchase-particles"
import Image from "../image"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

const FeaturedRemixCard = ({ data }: { data: Remix }) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const borderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const card = cardRef.current
    const border = borderRef.current
    if (!card || !border) return

    let bounds: DOMRect

    const rotateToMouse = (e: MouseEvent) => {
      const mouseX = e.clientX
      const mouseY = e.clientY
      const leftX = mouseX - bounds.x
      const topY = mouseY - bounds.y
      const center = {
        x: leftX - bounds.width / 2,
        y: topY - bounds.height / 2,
      }
      const distance = Math.sqrt(center.x ** 2 + center.y ** 2)

      card.style.transform = `
        scale3d(1.07, 1.07, 1.07)
        rotate3d(
          ${center.y / 100},
          ${-center.x / 100},
          0,
          ${Math.log(distance) * 2}deg
        )
      `
    }

    const handleMouseEnter = () => {
      bounds = card.getBoundingClientRect()
      document.addEventListener("mousemove", rotateToMouse)
    }

    const handleMouseLeave = () => {
      document.removeEventListener("mousemove", rotateToMouse)
      card.style.transform = ""
    }

    card.addEventListener("mouseenter", handleMouseEnter)
    card.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      card.removeEventListener("mouseenter", handleMouseEnter)
      card.removeEventListener("mouseleave", handleMouseLeave)
      document.removeEventListener("mousemove", rotateToMouse)
    }
  }, [])

  return (
    <div className="px-3 pt-0 pb-4 sm:px-4">
      <div className="bg-chessboard relative mx-auto flex h-[400px] items-center justify-center overflow-hidden rounded-[24px] border py-30">
        <div className="absolute top-10 left-8">
          <div className="bg-purple/20 border-purple-accent/50 flex items-center gap-1.5 rounded-[6px] border px-2 py-1 text-sm text-[#C297FF] uppercase">
            Featured Coin
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 cursor-help opacity-60 transition-opacity hover:opacity-100" />
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={6}>
                The most recent coin to graduate
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        <div className="pointer-events-none absolute top-[30%] right-[30%] bottom-[20%] left-[25%] z-10 overflow-visible">
          <LivePurchaseParticles />
        </div>
        <div
          className="relative z-20 sm:max-w-[24rem] md:max-w-[26rem] lg:max-w-[29.0625rem]"
          style={{ perspective: "93.75rem" }}
        >
          <div
            ref={cardRef}
            className="group relative rounded-[12px] p-[0.1px] transition-all duration-300 ease-out hover:z-10"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div
              ref={borderRef}
              className="pointer-events-none absolute -top-[4px] -left-[4px] h-[calc(100%+8px)] w-[calc(100%+8px)] rounded-[12px] blur-xl transition-all duration-300 group-hover:-top-[8px] group-hover:-left-[8px] group-hover:h-[calc(100%+16px)] group-hover:w-[calc(100%+16px)] group-hover:blur-2xl"
            />
            <div className="pointer-events-none absolute -top-[2px] -left-[2px] h-[calc(100%+4px)] w-[calc(100%+4px)] rounded-[12px] transition-all duration-300 group-hover:-top-[4px] group-hover:-left-[4px] group-hover:h-[calc(100%+8px)] group-hover:w-[calc(100%+8px)]" />
            <div className="relative z-10 h-auto cursor-pointer rounded-[12px]">
              <div className="absolute -top-[20px] -left-[20px]">
                <Image src="/svg/featured-remix.svg" alt="featured-remix" width={64} height={64} />
              </div>
              <RemixGridItemFeatured data={data} className="relative" />
            </div>
          </div>
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-20 h-4 w-1/3 bg-purple blur-[120px] opacity-80">
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-20 h-4 w-1/3 bg-green-500 blur-[120px] opacity-50">
        </div>
      </div>
    </div>
  )
}

export default FeaturedRemixCard
