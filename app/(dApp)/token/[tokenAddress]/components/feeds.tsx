"use client"

import { FilterIcon, RotateCcw, Search } from "lucide-react"
import React, { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { buildFeedIndexingTagPool } from "@/lib/social-reward-tags"
import { useInView } from "react-intersection-observer"
import Masonry from "react-masonry-css"
import MultiSwitch from "@/components/ui/multi-switch"
import Spinner from "@/components/ui/spinner"
import { useIsMobileView } from "@/context/mobile-ui-context"
import { useTokenFeeds } from "@/hooks/use-token-feeds"
import { Ip } from "@/types/ip"
import { Remix } from "@/types/remix"

import { useIsLoggedIn } from "@dynamic-labs/sdk-react-core"
import { HorizontalSliders, Tiktok, Twitter } from "@/components/icons"
import { Input } from "@/components/ui/input"
import { useOnboarding } from "@/context/onboarding-context"
import { ArrowRight } from "lucide-react"

import TwitterEmbed from "./twitter-embed"
import TiktokEmbedCard from "./tiktok-embed-card"
import type { TokenFeedFiltersState } from "./feed-filters-panel"
// HowItWorks moved to modal in tab bar

function OnboardingPrompt() {
  const { openOnboarding } = useOnboarding()
  const isLoggedIn = useIsLoggedIn()
  const [isDone, setIsDone] = useState(false)

  useEffect(() => {
    const completed = localStorage.getItem("onboarding-completed") === "true"
    const skipped = localStorage.getItem("onboarding-skipped") === "true"
    setIsDone(completed || skipped)
  }, [])

  if (!isLoggedIn || isDone) return null

  return (
    <button
      type="button"
      onClick={() => openOnboarding()}
      className="mb-4 flex w-full items-center justify-between gap-4 rounded-[16px] border border-neutral-600 bg-neutral-900 px-4 py-3 text-left transition-colors hover:bg-neutral-800"
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-white">Complete your profile</span>
        <span className="text-xs text-neutral-400">Set up your username, socials, and start earning rewards.</span>
      </div>
      <ArrowRight className="size-4 shrink-0 text-neutral-400" />
    </button>
  )
}

const sourceOptions = [
  { label: "All", value: "all" },
  { label: "Twitter", value: "twitter", icon: <Twitter size={12} /> },
  { label: "TikTok", value: "tiktok", icon: <Tiktok size={12} /> },
]

const sortOptions = [
  { label: "Newest", sortBy: "created_at", sortOrder: "desc" },
  { label: "Oldest", sortBy: "created_at", sortOrder: "asc" },
  { label: "Most Featured", sortBy: "weighted_viral_score", sortOrder: "desc" },
  { label: "Least Featured", sortBy: "weighted_viral_score", sortOrder: "asc" },
]

function FeedsNoResults() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <p className="text-[15px] font-medium text-neutral-400">No feed items indexed</p>
    </div>
  )
}

function FeedsEmptyState({ symbol, tokenName, ipName, category }: { symbol?: string; tokenName?: string; ipName?: string; category?: string }) {
  const [tags, setTags] = useState<Array<{ id: number; label: string; x: number; y: number; xOffset: number }>>([])
  const tagIdRef = React.useRef(0)

  // Build tag pool from token data
  const tagPool = React.useMemo(() => {
    const pool = buildFeedIndexingTagPool({
      tokenName,
      tokenSymbol: symbol,
      ipName,
      category,
    })
    return pool.length > 0 ? pool : ["#token\u30b7"]
  }, [tokenName, ipName, symbol, category])

  useEffect(() => {
    const createTag = () => ({
      id: tagIdRef.current++,
      label: tagPool[Math.floor(Math.random() * tagPool.length)],
      x: 5 + Math.random() * 85,
      y: 5 + Math.random() * 75,
      xOffset: Math.floor(Math.random() * 20 - 10),
    })

    // Stagger initial tags over the first few seconds
    const initialTimeouts: NodeJS.Timeout[] = []
    for (let i = 0; i < 4; i++) {
      initialTimeouts.push(
        setTimeout(() => {
          setTags((prev) => [...prev, createTag()])
        }, i * 1500 + Math.random() * 800)
      )
    }

    // Spawn one at a time with randomized interval
    let timeout: NodeJS.Timeout
    const scheduleNext = () => {
      const delay = 1200 + Math.random() * 1500 // 1.2-2.7s between each
      timeout = setTimeout(() => {
        setTags((prev) => {
          const fresh = prev.length > 8 ? prev.slice(-5) : prev
          return [...fresh, createTag()]
        })
        scheduleNext()
      }, delay)
    }
    scheduleNext()

    return () => {
      initialTimeouts.forEach(clearTimeout)
      clearTimeout(timeout)
    }
  }, [tagPool])

  return (
    <div className="bg-chessboard relative min-h-[280px] w-full overflow-hidden rounded-[20px] border border-neutral-600 [--cell-size:26px] [--first-color:#141414] [--second-color:#151515]">
      {/* Floating tags — uses same float-up-bounce animation as explore page particles */}
      {tags.map((tag) => (
        <div
          key={tag.id}
          className="pointer-events-none absolute rounded-full border border-white/[0.15] bg-white/[0.08] px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-[18px]"
          style={{
            left: `${tag.x}%`,
            top: `${tag.y}%`,
            animation: `float-up-bounce 5s forwards 0.1s`,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ["--random-x" as any]: tag.xOffset,
            fontFeatureSettings: "'lnum' 1, 'tnum' 1",
          }}
        >
          {tag.label}
        </div>
      ))}

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center gap-8 py-14 text-center">
        {/* Clock icon with spinning purple arc */}
        <div className="relative size-[160px]">
          {/* Gray circle + clock icon (static) */}
          <svg className="absolute inset-0 size-full" viewBox="0 0 183.859 183" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g filter="url(#filter0_empty)">
              <rect x="27.5" y="23.5" width="128" height="128" rx="64" fill="#313131" shapeRendering="crispEdges" />
              <g clipPath="url(#clip0_empty)">
                <path fillRule="evenodd" clipRule="evenodd" d="M69.5005 87.0001C69.5005 74.5736 79.5741 64.5001 92.0005 64.5001C104.427 64.5001 114.501 74.5736 114.501 87.0001C114.501 99.4264 104.427 109.5 92.0005 109.5C79.5741 109.5 69.5005 99.4264 69.5005 87.0001ZM92.0005 60.0001C77.0888 60.0001 65.0005 72.0884 65.0005 87.0001C65.0005 101.912 77.0888 114 92.0005 114C106.912 114 119.001 101.912 119.001 87.0001C119.001 72.0884 106.912 60.0001 92.0005 60.0001ZM89.7505 71.2501V87.0001C89.7505 87.511 89.9244 88.0067 90.2435 88.4056L99.2435 99.6556L102.758 96.8445L94.2505 86.2108V71.2501H89.7505Z" fill="#797979" />
              </g>
            </g>
            <defs>
              <filter id="filter0_empty" x="0" y="0" width="183.859" height="183" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="4" />
                <feGaussianBlur stdDeviation="13.75" />
                <feComposite in2="hardAlpha" operator="out" />
                <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
              </filter>
              <clipPath id="clip0_empty">
                <rect width="54" height="54" fill="white" transform="translate(65.0003 60)" />
              </clipPath>
            </defs>
          </svg>
          {/* Purple arc spinner — Material-style indeterminate */}
          <svg
            className="absolute inset-0 size-full animate-[spin_2s_linear_infinite]"
            viewBox="0 0 183 183"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ transformOrigin: '50% 47.5%' }}
          >
            <circle
              cx="91.5" cy="87.5" r="64.5"
              stroke="#C093FF"
              strokeWidth="3.44"
              strokeLinecap="round"
              fill="none"
              className="animate-[spinner-dash_1.5s_ease-in-out_infinite]"
            />
          </svg>
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-xl font-semibold text-white">Feed Indexing...</p>
          <p className="text-xxs text-neutral-300">Please wait while we index the feed for this token.</p>
        </div>
      </div>
    </div>
  )
}

const postFilterOptions = [
  { label: "My Posts", key: "my_posts" as const },
  { label: "IP.World Creators", key: "ip_world_creators" as const },
]

const Feeds = ({
  ip,
  remix,
  feedFilters,
  hideInlineFilters = false,
}: {
  ip: Ip
  remix?: Remix
  feedFilters?: TokenFeedFiltersState
  hideInlineFilters?: boolean
}) => {
  const isMobile = useIsMobileView()
  const isLoggedIn = useIsLoggedIn()
  const [localSourceOption, setLocalSourceOption] = useState(sourceOptions[0].value)
  const [localMyPostsEnabled, setLocalMyPostsEnabled] = useState(false)
  const [localIpWorldCreatorsEnabled, setLocalIpWorldCreatorsEnabled] = useState(false)
  const sourceOption = feedFilters?.feedSourceOption ?? localSourceOption
  const setSourceOption = feedFilters?.setFeedSourceOption ?? setLocalSourceOption
  const myPostsEnabled = feedFilters?.feedMyPostsEnabled ?? localMyPostsEnabled
  const setMyPostsEnabled = feedFilters?.setFeedMyPostsEnabled ?? setLocalMyPostsEnabled
  const ipWorldCreatorsEnabled = feedFilters?.feedIpWorldCreatorsEnabled ?? localIpWorldCreatorsEnabled
  const setIpWorldCreatorsEnabled =
    feedFilters?.setFeedIpWorldCreatorsEnabled ?? setLocalIpWorldCreatorsEnabled
  const { feeds, isLoading, isFetching, hasMore, isEmpty, total, fetchNextPage } = useTokenFeeds(
    remix?.token_address ?? "",
    "created_at",
    "desc",
    sourceOption,
    myPostsEnabled ? "my_posts" : "featured",
    ipWorldCreatorsEnabled
  )

  // Also fetch overall total (all sources) to distinguish indexing vs truly empty
  const { total: allSourcesTotal } = useTokenFeeds(
    remix?.token_address ?? "",
    "created_at",
    "desc",
    "all",
    undefined,
    false
  )

  const isNewToken = remix?.created_at
    ? Date.now() - new Date(remix.created_at).getTime() < 15 * 60 * 1000
    : false
  const isIndexing = isNewToken && allSourcesTotal === 0

  const { ref: loaderRef, inView } = useInView({
    threshold: 0,
    rootMargin: "0px",
  })

  useEffect(() => {
    if (inView) fetchNextPage()
  }, [inView, fetchNextPage])

  return (
    <div className="flex w-full flex-1 gap-7 px-4 pb-4 sm:px-6 sm:pr-3 max-sm:px-0 max-sm:gap-0">
      <div className="min-w-0 flex-1 min-h-[500px]">
        <OnboardingPrompt />

        {!hideInlineFilters && !isMobile && (
          <div className="bg-background sticky top-35 z-10 flex items-center justify-between pt-2 pb-2">
            <div className="flex items-center gap-3">
              <div className="flex gap-1 rounded-[8px] border border-neutral-600 p-1">
                <MultiSwitch items={sourceOptions} activeValue={sourceOption} setActiveValue={setSourceOption} />
              </div>
            </div>
            {isLoggedIn && (
              <div className="flex items-center gap-2">
                {postFilterOptions.map((option) => {
                  const isActive =
                    option.key === "my_posts" ? myPostsEnabled : ipWorldCreatorsEnabled
                  const toggle =
                    option.key === "my_posts"
                      ? () => setMyPostsEnabled((v) => !v)
                      : () => setIpWorldCreatorsEnabled((v) => !v)
                  return (
                    <button
                      key={option.key}
                      onClick={toggle}
                      className={cn(
                        "h-8 rounded-[8px] px-2 py-1 text-[13px] font-medium transition-colors whitespace-nowrap",
                        isActive
                          ? "bg-white text-[#121212]"
                          : "bg-[#191919] text-[#797979] hover:text-neutral-200 hover:bg-neutral-500"
                      )}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
        <div className="relative z-2 flex flex-1 items-start justify-center overflow-x-hidden py-4 max-sm:px-4 max-sm:py-2">
          <div className="w-full max-w-full">
            <Masonry
              breakpointCols={{
                default: 5,
                1800: 4,
                1400: 3,
                1000: 2,
                640: 1,
              }}
              className="-ml-3 flex w-full max-w-full gap-1.5 max-sm:ml-0 max-sm:gap-0"
              columnClassName="flex flex-col gap-5 pl-3 min-w-0 max-w-[320px] max-sm:pl-0 max-sm:max-w-none"
            >
              {feeds.map((feed, key) =>
                feed.type === "x" ? (
                  <TwitterEmbed key={`twitter-${feed.id}-${key}`} {...feed} remix={remix} />
                ) : (
                  <TiktokEmbedCard key={`tiktok-${feed.id}-${key}`} {...feed} />
                )
              )}
            </Masonry>
            {isLoading || isFetching ? (
              <div className="flex justify-center py-6">
                <div className="flex h-40 cursor-pointer items-center">
                  <Spinner size={20} />
                </div>
              </div>
            ) : (
              hasMore && (
                <div ref={loaderRef} className="flex items-center justify-center py-6">
                  <div className="flex h-10 cursor-pointer items-center">
                    <span
                      className="text-neutral-20000 text-sm font-normal! hover:text-neutral-200"
                      onClick={() => fetchNextPage()}
                    ></span>
                  </div>
                </div>
              )
            )}
            {!isFetching && isEmpty && (
              myPostsEnabled ? (
                <div className="flex flex-col items-center h-40 justify-center gap-3 py-16 text-center">
                  <p className="text-base font-medium text-neutral-300">No feed found</p>
                  <p className="text-sm text-neutral-500">You haven&apos;t posted about this token yet.</p>
                </div>
              ) : isIndexing ? (
                <FeedsEmptyState symbol={remix?.symbol} tokenName={remix?.name} ipName={ip?.title} category={ip?.category} />
              ) : (
                <FeedsNoResults />
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Feeds
