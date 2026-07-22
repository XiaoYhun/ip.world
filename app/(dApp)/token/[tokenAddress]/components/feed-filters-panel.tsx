"use client"

import { useIsLoggedIn } from "@dynamic-labs/sdk-react-core"
import { LayoutGroup, motion } from "framer-motion"
import { useId, type Dispatch, type ReactNode, type SetStateAction } from "react"
import { Tiktok, Twitter } from "@/components/icons"
import { cn } from "@/lib/utils"

const rowLabelClass =
  "shrink-0 text-[11px] font-semibold uppercase leading-none tracking-[0.08em] text-[#5C5C5C]"

const trayClass =
  "flex shrink-0 max-w-full items-center gap-0.5 rounded-[8px] border-[0.5px] border-[#313131] bg-[#191919] p-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"

const filterGridClass =
  "grid w-full min-w-0 grid-cols-[minmax(0,auto)_minmax(0,1fr)] items-center gap-x-3"
const trayCellClass = "flex min-w-0 justify-end"

const spring = { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.35 }

function AnimatedSegmentButton({
  layoutId,
  isActive,
  onClick,
  children,
  ariaLabel,
  title,
}: {
  layoutId: string
  isActive: boolean
  onClick: () => void
  children: ReactNode
  ariaLabel: string
  title?: string
}) {
  return (
    <motion.button
      type="button"
      title={title}
      onClick={onClick}
      aria-pressed={isActive}
      aria-label={ariaLabel}
      className={cn(
        "group relative inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-[7px] px-2 text-[12px] font-semibold leading-none",
        "focus-visible:ring-2 focus-visible:ring-[#E8E8E8]/35 focus-visible:outline-none",
        !isActive && "text-[#797979] hover:bg-white/[0.06] hover:text-[#D9D9D9]"
      )}
    >
      {isActive ? (
        <motion.span
          layoutId={layoutId}
          className="absolute inset-0 z-0 rounded-[7px] bg-[#D9D9D9] shadow-[0_1px_0_rgba(0,0,0,0.2)]"
          transition={spring}
        />
      ) : null}
      <span
        className={cn(
          "relative z-10 flex items-center justify-center transition-colors duration-200",
          isActive ? "text-[#121212]" : "text-inherit"
        )}
      >
        {children}
      </span>
    </motion.button>
  )
}

const sourceOptions = [
  { label: "All", value: "all", title: "All platforms" },
  {
    value: "twitter",
    icon: <Twitter size={12} />,
    title: "Twitter / X",
  },
  {
    value: "tiktok",
    icon: <Tiktok size={12} />,
    title: "TikTok",
  },
]

const postFilterOptions = [
  { label: "Mine", key: "my_posts" as const, title: "My posts" },
  { label: "Creators", key: "ip_world_creators" as const, title: "IP.World Creators" },
] as const

export type TokenFeedFiltersState = {
  feedSourceOption: string
  setFeedSourceOption: (value: string) => void
  feedMyPostsEnabled: boolean
  setFeedMyPostsEnabled: Dispatch<SetStateAction<boolean>>
  feedIpWorldCreatorsEnabled: boolean
  setFeedIpWorldCreatorsEnabled: Dispatch<SetStateAction<boolean>>
}

export function TokenFeedFiltersPanel({
  filters,
  className,
}: {
  filters: TokenFeedFiltersState
  className?: string
}) {
  const id = useId()
  const isLoggedIn = useIsLoggedIn()
  const {
    feedSourceOption,
    setFeedSourceOption,
    feedMyPostsEnabled,
    setFeedMyPostsEnabled,
    feedIpWorldCreatorsEnabled,
    setFeedIpWorldCreatorsEnabled,
  } = filters

  return (
    <section
      className={cn(
        "font-sf-pro-rounded flex w-full min-w-0 shrink-0 flex-col gap-3 overflow-hidden rounded-[12px] border-[0.5px] border-[#242424] bg-[#121212] px-2.5 py-2.5 shadow-[0_4px_11.7px_rgba(0,0,0,0.25)]",
        className
      )}
      aria-label="Feed filters"
    >
      <div className={cn(filterGridClass, "min-h-[34px]")}>
        <span className={rowLabelClass}>Platform</span>
        <div className={trayCellClass}>
          <LayoutGroup id={`${id}-feed-platform-segments`}>
            <div className={trayClass}>
              {sourceOptions.map((option) => {
                const isActive = feedSourceOption === option.value
                return (
                  <AnimatedSegmentButton
                    key={option.value}
                    layoutId={`${id}-feed-platform-pill`}
                    isActive={isActive}
                    ariaLabel={option.title}
                    title={option.title}
                    onClick={() => setFeedSourceOption(option.value)}
                  >
                    {option.icon ?? option.label}
                  </AnimatedSegmentButton>
                )
              })}
            </div>
          </LayoutGroup>
        </div>
      </div>

      {isLoggedIn ? (
        <div className={cn(filterGridClass, "min-h-[34px]")}>
          <span className={rowLabelClass}>Posts</span>
          <div className={trayCellClass}>
            <LayoutGroup id={`${id}-feed-posts-segments`}>
              <div className={trayClass}>
                {postFilterOptions.map((option) => {
                  const isActive =
                    option.key === "my_posts" ? feedMyPostsEnabled : feedIpWorldCreatorsEnabled
                  const toggle =
                    option.key === "my_posts"
                      ? () => setFeedMyPostsEnabled((v) => !v)
                      : () => setFeedIpWorldCreatorsEnabled((v) => !v)

                  return (
                    <AnimatedSegmentButton
                      key={option.key}
                      layoutId={`${id}-feed-posts-${option.key}`}
                      isActive={isActive}
                      ariaLabel={option.title}
                      title={option.title}
                      onClick={toggle}
                    >
                      {option.label}
                    </AnimatedSegmentButton>
                  )
                })}
              </div>
            </LayoutGroup>
          </div>
        </div>
      ) : null}
    </section>
  )
}
