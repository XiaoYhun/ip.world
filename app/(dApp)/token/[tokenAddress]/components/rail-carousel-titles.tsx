"use client"

import { type ReactNode } from "react"
import { TrendingUp } from "lucide-react"
import { motion, useReducedMotion } from "framer-motion"
import { cn } from "@/lib/utils"

const railTitleTransition = { duration: 0.26, ease: [0.32, 0.72, 0, 1] as const }

const railIconShellClass =
  "flex size-6 shrink-0 items-center justify-center rounded-[4px] border-[0.25px] border-[#313131] bg-[#191919] shadow-[0_1px_6px_rgba(0,0,0,0.2)]"

/** Icon tile beside rail titles; subtle scale + fade on mount. Respects reduced motion. */
export function RailAnimatedIconFrame({
  children,
  className,
  /** When true, skip mount animation (e.g. parent carousel handles horizontal slide). */
  suppressEnterAnimation,
}: {
  children: ReactNode
  className?: string
  suppressEnterAnimation?: boolean
}) {
  const reduceMotion = useReducedMotion()
  const merged = cn(railIconShellClass, className)

  if (reduceMotion || suppressEnterAnimation) {
    return <div className={merged}>{children}</div>
  }

  return (
    <motion.div
      className={merged}
      initial={{ opacity: 0, scale: 0.88, y: 2 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={railTitleTransition}
    >
      {children}
    </motion.div>
  )
}

type RailAnimatedTitleProps = {
  children: React.ReactNode
  className?: string
  as?: "h2" | "h3" | "span"
}

type RailAnimatedTitlePropsExt = RailAnimatedTitleProps & {
  /** When true, skip mount animation (e.g. parent carousel handles horizontal slide). */
  suppressEnterAnimation?: boolean
}

/** Subtle enter animation when the rail header mounts (e.g. carousel slide change). Respects reduced motion. */
export function RailAnimatedTitle({ children, className, as = "h3", suppressEnterAnimation }: RailAnimatedTitlePropsExt) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion || suppressEnterAnimation) {
    const Tag = as
    return <Tag className={className}>{children}</Tag>
  }

  if (as === "span") {
    return (
      <motion.span
        className={className}
        initial={{ opacity: 0, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        transition={railTitleTransition}
      >
        {children}
      </motion.span>
    )
  }

  if (as === "h2") {
    return (
      <motion.h2
        className={className}
        initial={{ opacity: 0, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        transition={railTitleTransition}
      >
        {children}
      </motion.h2>
    )
  }

  return (
    <motion.h3
      className={className}
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      transition={railTitleTransition}
    >
      {children}
    </motion.h3>
  )
}

export function TrendContextRailHeader({
  headerCarouselNav,
  suppressEnterAnimation,
  titleBlockOnly,
}: {
  headerCarouselNav?: ReactNode
  suppressEnterAnimation?: boolean
  titleBlockOnly?: boolean
}) {
  const suppress = Boolean(suppressEnterAnimation || titleBlockOnly)
  const titleRow = (
    <div className="flex min-w-0 items-center gap-2">
      <RailAnimatedIconFrame suppressEnterAnimation={suppress}>
        <TrendingUp size={12} className="text-[#D9D9D9]" strokeWidth={2.25} aria-hidden />
      </RailAnimatedIconFrame>
      <RailAnimatedTitle
        suppressEnterAnimation={suppress}
        className="truncate text-[14px] leading-[1.04] font-bold text-[#D9D9D9]"
      >
        Trend context
      </RailAnimatedTitle>
    </div>
  )
  if (titleBlockOnly) return titleRow
  return (
    <div className="flex items-center justify-between gap-2">
      {titleRow}
      <div className="flex shrink-0 items-center">{headerCarouselNav}</div>
    </div>
  )
}
