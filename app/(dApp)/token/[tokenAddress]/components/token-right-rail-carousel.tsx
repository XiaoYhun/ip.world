"use client"

import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  type TouchEvent,
} from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { cn } from "@/lib/utils"
import { UgcRewardsRailHeader } from "./owner-earning"
// import { TrendContextRailHeader } from "./rail-carousel-titles"
import { TopEarnersRailHeader } from "./top-earners"
import { TOKEN_RAIL_CARD_HEIGHT_PX } from "../token-layout"

// Third slide (trend context) commented out — restore SLIDE_COUNT = 3 when re-enabled.
const SLIDE_COUNT = 2
const SWIPE_PX = 56

/** Single source of truth for panel + title strip motion (matches prior `duration-300` + cubic-bezier). */
export const RAIL_CAROUSEL_SLIDE_DURATION_SEC = 0.3
export const RAIL_CAROUSEL_SLIDE_EASE = [0.32, 0.72, 0, 1] as const

const railTitleSlideTransition = {
  duration: RAIL_CAROUSEL_SLIDE_DURATION_SEC,
  ease: RAIL_CAROUSEL_SLIDE_EASE,
}

const railTitleSlideVariants = {
  enter: (dir: number) => ({ x: dir >= 0 ? "100%" : "-100%" }),
  center: { x: 0 },
  exit: (dir: number) => ({ x: dir >= 0 ? "-100%" : "100%" }),
} as const

/** Direction (1 = forward / next, -1 = back) for header slide animation along shortest carousel path. */
function railHeaderStepDirection(from: number, to: number, n: number): 1 | -1 {
  if (from === to) return 1
  let d = to - from
  if (d > n / 2) d -= n
  if (d < -n / 2) d += n
  return d > 0 ? 1 : -1
}

/** @deprecated Use TOKEN_RAIL_CARD_HEIGHT_PX from token-layout */
export const RAIL_CARD_HEIGHT_PX = TOKEN_RAIL_CARD_HEIGHT_PX

type TokenRightRailCarouselProps = {
  rewardsPanel: ReactNode
  topEarnersPanel: ReactNode
  trendContextPanel?: ReactNode
  className?: string
  /** First slide title row; default is UGC Rewards. Pass IP owner header from the token page when applicable. */
  renderFirstSlideHeader?: (nav: ReactNode) => ReactNode
  /**
   * UGC “before bonding” solo rail: only the rewards panel, no Top Earners / Trend slides,
   * shell height follows content instead of the fixed rail height.
   */
  ugcBondingOnly?: boolean
}

type CarouselInjectedProps = {
  railCarouselEmbedded?: boolean
  railCarouselBodyOnly?: boolean
  railCarouselNaturalHeight?: boolean
}

function injectRailSlideProps(panel: ReactNode, extra?: { railCarouselNaturalHeight?: boolean }): ReactNode {
  if (!isValidElement(panel)) return panel
  return cloneElement(panel as ReactElement<CarouselInjectedProps>, {
    railCarouselEmbedded: true,
    railCarouselBodyOnly: true,
    ...(extra?.railCarouselNaturalHeight ? { railCarouselNaturalHeight: true } : {}),
  })
}

/* Trend context placeholder — unused while third carousel slide is disabled.
export function TokenTrendContextPlaceholder({
  className,
  headerCarouselNav,
  railCarouselEmbedded,
  railCarouselBodyOnly,
}: {
  className?: string
  headerCarouselNav?: ReactNode
  railCarouselEmbedded?: boolean
  railCarouselBodyOnly?: boolean
}) {
  const frameStyle = railCarouselEmbedded
    ? ({ fontVariantNumeric: "lining-nums tabular-nums" } as const)
    : ({
        fontVariantNumeric: "lining-nums tabular-nums" as const,
        height: TOKEN_RAIL_CARD_HEIGHT_PX,
        minHeight: TOKEN_RAIL_CARD_HEIGHT_PX,
        maxHeight: TOKEN_RAIL_CARD_HEIGHT_PX,
      } as const)

  return (
    <div
      className={cn(
        "font-sf-pro-rounded flex min-h-0 w-full flex-col",
        railCarouselEmbedded
          ? "h-full"
          : "overflow-hidden rounded-[16px] border-[0.5px] border-[#242424] bg-[#121212] p-3 shadow-[0_4px_11.7px_rgba(0,0,0,0.25)]",
        className
      )}
      style={frameStyle}
    >
      {!railCarouselBodyOnly ? (
        <TrendContextRailHeader headerCarouselNav={headerCarouselNav} />
      ) : null}
      <p
        className={cn(
          "text-center text-[13px] font-medium leading-snug text-[#494949]",
          railCarouselBodyOnly ? "flex flex-1 items-center justify-center" : "mt-4 flex flex-1 items-center justify-center"
        )}
      >
        Trend context for this token will appear here.
      </p>
    </div>
  )
}
*/

export function TokenRightRailCarousel({
  rewardsPanel,
  topEarnersPanel,
  className,
  renderFirstSlideHeader,
  ugcBondingOnly = false,
}: TokenRightRailCarouselProps) {
  const [index, setIndex] = useState(0)
  /** Forward (next) vs back — drives title strip only; chevrons/dots stay fixed. */
  const [headerSlideDir, setHeaderSlideDir] = useState<1 | -1>(1)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (ugcBondingOnly) setIndex(0)
  }, [ugcBondingOnly])

  // const trendPanel = trendContextPanel ?? <TokenTrendContextPlaceholder />

  const slideCount = ugcBondingOnly ? 1 : SLIDE_COUNT
  const slideWidthFrac = 100 / slideCount

  const go = useCallback(
    (delta: number) => {
      setHeaderSlideDir(delta > 0 ? 1 : -1)
      setIndex((i) => (i + delta + slideCount) % slideCount)
    },
    [slideCount]
  )

  const railTitleBlock = useCallback((i: number) => {
    if (i === 0) return <UgcRewardsRailHeader titleBlockOnly />
    return <TopEarnersRailHeader titleBlockOnly />
  }, [])

  const pageDots = (
    <div
      className="flex items-center justify-center gap-[5px] px-0.5"
      role="tablist"
      aria-label="Carousel pages"
    >
      {Array.from({ length: slideCount }, (_, i) => {
        const active = i === index
        return (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={`Panel ${i + 1} of ${slideCount}`}
            onClick={() => {
              if (i === index) return
              setHeaderSlideDir(railHeaderStepDirection(index, i, slideCount))
              setIndex(i)
            }}
            className={cn(
              "shrink-0 rounded-full border-0 p-0 focus-visible:ring-2 focus-visible:ring-[#E8E8E8]/40 focus-visible:outline-none",
              active
                ? "h-1.5 w-[18px] bg-[linear-gradient(90deg,#E8E8E8_0%,#E8E8E8_63%,#5C5C5C_63%,#5C5C5C_100%)]"
                : "size-[5px] bg-[#5C5C5C]"
            )}
          />
        )
      })}
    </div>
  )

  const minimalNav = (
    <div className="flex shrink-0 items-center gap-0.5">
      <button
        type="button"
        onClick={() => go(-1)}
        className="flex size-5 items-center justify-center rounded text-[#797979] transition-colors hover:text-white"
        aria-label="Previous panel"
      >
        <ChevronLeft className="size-3.5" strokeWidth={2.25} />
      </button>
      {pageDots}
      <button
        type="button"
        onClick={() => go(1)}
        className="flex size-5 items-center justify-center rounded text-[#797979] transition-colors hover:text-white"
        aria-label="Next panel"
      >
        <ChevronRight className="size-3.5" strokeWidth={2.25} />
      </button>
    </div>
  )

  const slides = ugcBondingOnly
    ? [injectRailSlideProps(rewardsPanel, { railCarouselNaturalHeight: true })]
    : [
        injectRailSlideProps(rewardsPanel),
        injectRailSlideProps(topEarnersPanel),
        // injectRailSlideProps(trendPanel),
      ]

  const onTouchStart = useCallback((e: TouchEvent) => {
    const t = e.targetTouches[0]
    touchStart.current = { x: t.clientX, y: t.clientY }
  }, [])

  const onTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!touchStart.current) return
      const t = e.changedTouches[0]
      const dx = t.clientX - touchStart.current.x
      const dy = t.clientY - touchStart.current.y
      touchStart.current = null
      if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(dy)) return
      if (dx > 0) go(-1)
      else go(1)
    },
    [go]
  )

  const slideTrackStyle = useMemo((): CSSProperties => {
    const base: CSSProperties = {
      width: `${slideCount * 100}%`,
      transform: `translateX(calc(-${index} * ${slideWidthFrac}%))`,
    }
    if (reduceMotion) return base
    const [a, b, c, d] = RAIL_CAROUSEL_SLIDE_EASE
    return {
      ...base,
      transition: `transform ${RAIL_CAROUSEL_SLIDE_DURATION_SEC}s cubic-bezier(${a}, ${b}, ${c}, ${d})`,
    }
  }, [slideCount, index, slideWidthFrac, reduceMotion])

  if (ugcBondingOnly) {
    return (
      <div className={cn("flex w-full flex-col gap-1.5", className)}>
        <div
          className={cn(
            "font-sf-pro-rounded flex w-full min-w-0 flex-col gap-3 overflow-hidden rounded-[16px] border-[0.5px] border-[#242424] bg-[#121212] p-3 shadow-[0_4px_11.7px_rgba(0,0,0,0.25)]"
          )}
        >
          <div className="shrink-0">
            {renderFirstSlideHeader?.(null) ?? <UgcRewardsRailHeader />}
          </div>
          <div className="min-h-0 overflow-hidden">{slides[0]}</div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex w-full flex-col gap-1.5", className)}>
      <div
        className={cn(
          "font-sf-pro-rounded flex min-h-0 w-full min-w-0 flex-col gap-3 overflow-hidden rounded-[16px] border-[0.5px] border-[#242424] bg-[#121212] p-3 shadow-[0_4px_11.7px_rgba(0,0,0,0.25)]"
        )}
        style={{ height: TOKEN_RAIL_CARD_HEIGHT_PX, minHeight: TOKEN_RAIL_CARD_HEIGHT_PX }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="shrink-0">
          {renderFirstSlideHeader && index === 0 ? (
            renderFirstSlideHeader(minimalNav)
          ) : (
            <div className="flex items-center justify-between gap-2">
              <div className="relative min-h-[32px] min-w-0 flex-1 overflow-hidden">
                {reduceMotion ? (
                  <div key={index} className="w-full">
                    {railTitleBlock(index)}
                  </div>
                ) : (
                  <AnimatePresence initial={false} custom={headerSlideDir}>
                    <motion.div
                      key={index}
                      custom={headerSlideDir}
                      className="absolute inset-x-0 top-0 w-full"
                      variants={railTitleSlideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={railTitleSlideTransition}
                    >
                      {railTitleBlock(index)}
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
              {minimalNav}
            </div>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <div className="flex h-full will-change-transform" style={slideTrackStyle}>
            {slides.map((panel, i) => (
              <div
                key={i}
                className="box-border flex h-full min-w-0 shrink-0 flex-col overflow-hidden"
                style={{ width: `${100 / slideCount}%` }}
              >
                {panel}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
