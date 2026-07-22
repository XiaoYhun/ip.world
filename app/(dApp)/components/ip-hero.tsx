"use client"
import Image from "next/image"
import { useState, useEffect } from "react"

import { Explore } from "@/types/ip"
import { ArrowRightIcon, Info } from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import Link from "next/link"
import { motion } from "framer-motion"
import { Shape1, Shape2, Shape3 } from "./ip-hero-shapes"
import { MoneyBag } from "@/components/icons"
import CountUp from "@/components/ui/count-up"
import { useIsLoggedIn, useDynamicContext } from "@dynamic-labs/sdk-react-core"
import { getAPIRootUrl } from "@/lib/utils"

/* ─── Shared animation variants ─── */
const fadeUpVariant = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
}

const ipCardVariants = {
  initial: { opacity: 1 },
  visible: { opacity: 1 },
  hovered: { opacity: 1 },
}

const ipImageVariants = (rotateFrames: number[]) => ({
  initial: { scale: 0, opacity: 0 },
  visible: { scale: 1, opacity: 1, rotate: rotateFrames },
  hovered: { scale: 1.1, rotate: [0] },
})

const ipHoverTextVariants = (yOffset: number) => ({
  initial: { opacity: 0, y: yOffset },
  visible: { opacity: 0, y: yOffset },
  hovered: { opacity: 1, y: 0 },
})

const springTransition = {
  type: "spring" as const,
  stiffness: 200,
  damping: 7,
  mass: 0.5,
}

/* ─── Double Chevron Icon ─── */
function DoubleChevron({ direction }: { direction: "down" | "up" }) {
  const paths =
    direction === "down"
      ? ["M4 1L10 7L16 1", "M4 10L10 16L16 10"]
      : ["M4 8L10 2L16 8", "M4 17L10 11L16 17"]
  return (
    <svg width="20" height="19" viewBox="0 0 20 19" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d={paths[0]} stroke="#B3B3B3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d={paths[1]} stroke="#B3B3B3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ─── Floating IP Character Card ─── */
function FloatingIPCard({
  src,
  alt,
  name,
  price,
  delay,
  size,
  position,
  hoverOffset,
  rotateFrames,
  rotateDuration,
}: {
  src: string
  alt: string
  name: string
  price: string
  delay: number
  size: string
  position: string
  hoverOffset: string
  rotateFrames: number[]
  rotateDuration: number
}) {
  return (
    <motion.div
      initial="initial"
      animate="visible"
      whileHover="hovered"
      variants={ipCardVariants}
      transition={{ delay, when: "beforeChildren" }}
      className={`absolute z-10 hidden h-fit w-fit cursor-pointer sm:block ${position}`}
    >
      <motion.div
        variants={ipImageVariants(rotateFrames)}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 8,
          mass: 0.5,
          rotate: { duration: rotateDuration, repeat: Infinity, ease: "easeInOut" },
        }}
        className={`relative ${size}`}
      >
        <Image src={src} alt={alt} fill priority sizes="(max-width: 640px) 0px, (max-width: 768px) 5rem, (max-width: 1024px) 6rem, 8rem" />
      </motion.div>
      <motion.div
        className={`absolute ${hoverOffset}`}
        variants={{
          initial: { opacity: 0 },
          visible: { opacity: 0 },
          hovered: { opacity: 1, transition: { staggerChildren: 0.1 } },
        }}
      >
        <motion.div variants={ipHoverTextVariants(6)} transition={springTransition} className="font-archivo mb-1 text-sm font-semibold text-white">
          {name}
        </motion.div>
        <motion.div variants={ipHoverTextVariants(8)} transition={springTransition} className="font-archivo flex items-center gap-1 text-sm">
          <span className="text-purple-200"><MoneyBag /></span>
          <span>{price}</span>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

/*
  ─── Feature Pillar (CREATE / VERIFY / EARN) ───
  Fixed rem/px sizing — does NOT scale with viewport width.
  Steps at sm breakpoint for mobile vs desktop.
*/
function FeaturePillar({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="mb-1 flex size-12 items-center justify-center rounded-full border border-neutral-500 backdrop-blur-sm md:size-16 lg:size-20">
        <div className="size-5 md:size-7 lg:size-9">{icon}</div>
      </div>
      <div className="font-archivo text-base font-bold md:text-lg lg:text-xl">{title}</div>
      <div className="font-archivo max-w-[17rem] text-center text-xs font-medium text-neutral-200 sm:text-sm">{description}</div>
    </div>
  )
}

/* ─── SVG Icons ─── */
const CreateIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 36 36" fill="none">
    <path fillRule="evenodd" clipRule="evenodd" d="M12.7676 12.7676C15.1203 10.4148 14.8497 7.39423 12.5513 5.09583C10.9828 3.52665 9.46052 3.61034 7.82886 3.70005C5.94495 3.80363 3.91521 3.91521 1.5 1.5C1.5 1.5 1.51088 10.0313 3.99968 12.5214C5.13056 13.7153 6.6889 14.4117 8.33271 14.4579C9.97651 14.504 11.5715 13.8961 12.7676 12.7676ZM33.0597 2.93949C31.1588 1.03854 28.0101 1.03854 26.1091 2.93949L19.0773 9.97134L26.5243 16.4255L29.1727 13.7769L30.0392 14.6457C30.1536 14.7601 30.2444 14.8959 30.3063 15.0455C30.3683 15.1948 30.4001 15.3552 30.4001 15.5169C30.4001 15.6788 30.3683 15.839 30.3063 15.9885C30.2444 16.1379 30.153 16.2744 30.0385 16.3887L28.388 18.0405L30.6608 20.0103L32.1606 18.5093C32.5534 18.1164 32.8652 17.6501 33.0779 17.1368C33.2906 16.6233 33.4001 16.0728 33.4001 15.5169C33.4001 14.9611 33.2906 14.4106 33.0779 13.8971C32.8652 13.384 32.5527 12.9168 32.16 12.524L31.294 11.6556L33.0597 9.89001C34.9607 7.98903 34.9607 4.84047 33.0597 2.93949ZM16.4255 26.5243L9.30663 33.6431L6.89108 31.2276L3.62132 34.4973L1.5 32.376L4.76975 29.1062L2.35611 26.6925L9.97134 19.0773L16.4255 26.5243ZM10.6566 16.4326C12.0134 16.0759 13.2729 15.3842 14.3116 14.4041L14.3354 14.3817L14.3585 14.3586C15.4345 13.2825 16.1571 12.0319 16.4746 10.6931L32.5611 24.6346C33.7926 25.7019 34.5 27.2513 34.5 28.8809C34.5 31.9842 31.9842 34.5 28.8809 34.5C27.2513 34.5 25.7019 33.7924 24.6346 32.561L10.6566 16.4326Z" fill="white" />
  </svg>
)

const VerifyIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 36 36" fill="none">
    <g clipPath="url(#clip0_hero_verify)">
      <path fillRule="evenodd" clipRule="evenodd" d="M21.8603 1.86621C20.7057 1.13709 19.3676 0.750087 18.002 0.75C16.6362 0.75 15.2982 1.13714 14.1436 1.86621C13.3447 2.37081 12.6577 3.02742 12.1147 3.79101C11.1918 3.63546 10.2435 3.65496 9.32275 3.8628C7.9904 4.16364 6.77006 4.83646 5.8042 5.80224C4.83832 6.76814 4.16563 7.98839 3.86474 9.32081C3.65681 10.2417 3.63739 11.1897 3.79297 12.1128C3.02935 12.6557 2.3728 13.3427 1.86817 14.1416C1.13896 15.2964 0.751953 16.6343 0.751953 18C0.751953 19.3657 1.13896 20.7036 1.86817 21.8584C2.37265 22.657 3.02965 23.3428 3.79297 23.8857C3.63712 24.8092 3.65671 25.7578 3.86474 26.6791C4.16563 28.0116 4.83832 29.2318 5.8042 30.1977C6.77006 31.1636 7.9904 31.8363 9.32275 32.1372C10.2436 32.3451 11.1917 32.3631 12.1147 32.2076C12.6578 32.9715 13.3443 33.629 14.1436 34.1339C15.2982 34.8629 16.6362 35.25 18.002 35.25C19.3676 35.2499 20.7057 34.8629 21.8603 34.1339C22.6593 33.6291 23.3448 32.9712 23.8877 32.2076C24.8112 32.3634 25.7598 32.3453 26.6811 32.1372C28.0134 31.8363 29.2338 31.1636 30.1997 30.1977C31.1655 29.2318 31.8383 28.0116 32.1392 26.6791C32.3472 25.7572 32.3655 24.8084 32.2095 23.8844C32.9726 23.3412 33.63 22.6572 34.1343 21.8584C34.7721 20.8477 35.1477 19.6966 35.2314 18.5097L35.2505 18C35.2506 16.6344 34.8632 15.2964 34.1343 14.1416C33.6299 13.3426 32.9729 12.6574 32.2095 12.1143C32.3654 11.1907 32.3472 10.2422 32.1392 9.32081C31.8383 7.98846 31.1655 6.76812 30.1997 5.80224C29.2338 4.83645 28.0134 4.16371 26.6811 3.8628C25.7598 3.65479 24.8111 3.63525 23.8877 3.79101C23.3448 3.02773 22.6589 2.37069 21.8603 1.86621ZM17.5043 23.7006L25.988 15.2169L23.5885 12.8173L16.3045 20.1013L12.414 16.2109L10.0144 18.6104L15.1047 23.7006C15.7673 24.3632 16.8417 24.3632 17.5043 23.7006Z" fill="white" />
    </g>
    <defs><clipPath id="clip0_hero_verify"><rect width="36" height="36" fill="white" /></clipPath></defs>
  </svg>
)

const EarnIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 36 36" fill="none">
    <path fillRule="evenodd" clipRule="evenodd" d="M10.6953 0.760951C10.9616 0.290689 11.4602 0 12.0006 0H24.0005C24.541 0 25.0396 0.290689 25.3058 0.760951C25.5721 1.23122 25.5649 1.80835 25.2868 2.27175L21.8719 7.9633C23.3611 8.34742 24.668 8.96073 25.8097 9.76688C27.838 11.1989 29.2442 13.1677 30.2459 15.3001C32.0462 19.1329 32.6464 23.7618 33.1076 27.3207C33.1516 27.6591 33.1942 27.9877 33.2365 28.3051C33.497 30.2619 33.0394 32.1814 31.8892 33.6371C30.7225 35.1135 28.9288 36 26.7764 36H9.22437C7.07201 36 5.27835 35.1135 4.11165 33.6371C2.96141 32.1814 2.50385 30.2619 2.76443 28.3051C2.80668 27.9879 2.84927 27.6593 2.89313 27.321C3.35448 23.7621 3.95457 19.1328 5.75483 15.3001C6.75651 13.1677 8.16272 11.1989 10.1909 9.76689C11.3328 8.96064 12.6399 8.34729 14.1292 7.96317L10.7144 2.27175C10.4363 1.80835 10.4291 1.23122 10.6953 0.760951ZM15.0004 15C14.172 15 13.5004 15.6715 13.5004 16.5V21.75C13.5004 22.5784 14.172 23.25 15.0004 23.25H19.5004V25.5H13.5004V28.5H16.5004V30.75H19.5004V28.5H21.0004C21.8288 28.5 22.5004 27.8284 22.5004 27V21.75C22.5004 20.9216 21.8288 20.25 21.0004 20.25H16.5004V18H22.5004V15H19.5004V12.75H16.5004V15H15.0004Z" fill="white" />
  </svg>
)

/* ─── Expand/collapse animation config ─── */
const expandTransition = { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const }

/* ─── Main Component ─── */
// Token addresses for hero price stickers
const HERO_TOKENS = [
  { key: "zazu", address: "0xd1b2D3Df51c3E5a22b09993354B8717e3a7E4D3b", fallback: "$1.52M" },
  { key: "ippy", address: "0x543374350269CCe6651358769512875FAA4cCcFf", fallback: "$0.68M" },
  { key: "larry", address: "0x693c7AcF65e52C71bAFE555Bc22d69cB7f8a78a2", fallback: "$2.1M" },
] as const

function formatMcap(mc: number): string {
  if (mc >= 1_000_000) return `$${(mc / 1_000_000).toFixed(2)}M`
  if (mc >= 1_000) return `$${(mc / 1_000).toFixed(1)}K`
  return `$${mc.toFixed(0)}`
}

function useHeroPrices() {
  const [prices, setPrices] = useState({ zazu: "$1.52M", ippy: "$0.68M", larry: "$2.1M" })

  useEffect(() => {
    const base = getAPIRootUrl()

    Promise.all(
      HERO_TOKENS.map(({ address }) =>
        fetch(`${base}/token-metrics/${address}`)
          .then(r => r.ok ? r.json() : null)
          .catch(() => null)
      )
    ).then(results => {
      const updated: Record<string, string> = {}
      HERO_TOKENS.forEach((token, i) => {
        const mc = results[i]?.total_market_cap_usd
        if (mc && mc > 0) {
          updated[token.key] = formatMcap(mc)
        } else {
          updated[token.key] = token.fallback
        }
      })
      setPrices(updated as typeof prices)
    })
  }, [])

  return prices
}

export default function IPHero({ exploreData }: { exploreData: Explore }) {
  const isLoggedIn = useIsLoggedIn()
  const { setShowAuthFlow } = useDynamicContext()
  const [isExpanded, setIsExpanded] = useState(false)
  const heroPrices = useHeroPrices()

  /*
    Responsive layout principles:
    ──────────────────────────────
    • Text: fixed rem/px sizes, steps at Tailwind breakpoints (sm/md/lg/xl).
      Never scales with viewport width — no vw units on typography.
    • Containers/images: fluid width (%, aspect-ratio), height adapts.
    • Spacing: rem — scales with root font size, not viewport.
    • Viewport fit: flex column capped at 100dvh - 4rem on sm+.
      Hero card shrinks (flex-shrink) to keep learn-more visible.
      Learn-more card: shrink-0, always at intrinsic content height.
    • dvh = dynamic viewport height (handles mobile browser chrome).
    • Breakpoints used: sm(640px), md(768px), lg(1024px) — standard Tailwind.
  */
  return (
    <div className="relative flex flex-col sm:max-h-[calc(100dvh-4rem)]">
      {/*
        Hero Card — fixed height at each breakpoint (not aspect-ratio driven).
        Heights: sm=15rem, md=18rem, lg=22rem, xl=25rem.
        Sticker tiers: Regular (14→20→24), Large+ (16→24→28), Large (24→32→40).
      */}
      <div
        className="relative z-[3] flex aspect-[3/4] w-full shrink min-h-0 flex-col items-center justify-center overflow-hidden rounded-[20px] border-0 sm:aspect-auto sm:h-[15rem] sm:rounded-[2rem] sm:border sm:border-neutral-500 md:h-[18rem] lg:h-[22rem] xl:h-[25rem]"
        style={{
          backgroundImage: "repeating-conic-gradient(#111 0% 25%, #121212 0% 50%)",
          backgroundSize: "60px 60px",
          boxShadow: "0 18px 32px #0C0C0D",
        }}
      >
        {/* Animated background shapes */}
        <motion.div initial={{ x: "-130%", y: "-83%" }} animate={{ x: "-103%", y: "-48%" }} transition={{ type: "spring", stiffness: 100, damping: 20, mass: 2.5, delay: 0.3 }} className="absolute top-1/2 left-1/2 z-0 h-fit w-fit"><Shape1 /></motion.div>
        <motion.div initial={{ x: "80%", y: "-50%" }} animate={{ x: "50%", y: "-40%" }} transition={{ type: "spring", stiffness: 100, damping: 30, mass: 8, delay: 0.75 }} className="absolute top-1/2 left-1/2 z-0 h-fit w-fit"><Shape2 /></motion.div>
        <motion.div initial={{ x: "77%", y: "53%" }} animate={{ x: "47%", y: "-10%" }} transition={{ type: "spring", stiffness: 100, damping: 26, mass: 3, delay: 0.65 }} className="absolute top-1/2 left-1/2 z-1 h-fit w-fit"><Shape3 /></motion.div>

        {/* Floating IP character cards */}
        <FloatingIPCard src="/images/landing/ip-1.png" alt="Zazu" name="Zazu" price={heroPrices.zazu} delay={2} size="size-16 md:size-24 lg:size-28" position="top-[8%] left-[20%]" hoverOffset="top-0 -right-14" rotateFrames={[-2, 2, -3, 3, -2]} rotateDuration={10} />
        <FloatingIPCard src="/images/landing/ip-2.png" alt="IPPY" name="IPPY" price={heroPrices.ippy} delay={2.15} size="size-14 md:size-20 lg:size-24" position="top-[15%] right-[20%]" hoverOffset="top-2 -right-16" rotateFrames={[-2, 2, -3, 2, -5, -2]} rotateDuration={9} />
        <FloatingIPCard src="/images/landing/ip-3.png" alt="Evil Larry" name="Evil Larry" price={heroPrices.larry} delay={2.4} size="size-24 md:size-32 lg:size-40" position="bottom-[5%] left-[15%]" hoverOffset="top-8 -right-12" rotateFrames={[-2, 2, -3, 3, 2, -2]} rotateDuration={10} />

        {/*
          Center CTA content
          ───────────────────
          All text: fixed rem sizes, changes ONLY at breakpoints.
          No clamp(), no vw units — stepped sizing is the standard.
          Tight vertical spacing to minimize hero height.
        */}
        <motion.div initial="hidden" animate="visible" transition={{ staggerChildren: 0.2 }} className="z-3 flex flex-col items-center justify-center px-4">
          <motion.div variants={fadeUpVariant} transition={{ duration: 0.6 }} className="mb-1 flex items-center gap-1 text-xs font-medium text-neutral-300 uppercase sm:text-xs">
            Total Rewards
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex opacity-40 hover:opacity-100 transition-opacity cursor-help -mt-[3px]">
                  <Info size={12} className="text-current" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={6}>
                Total rewards paid to original creators, holders, UGC creators, and communities across all coins
              </TooltipContent>
            </Tooltip>
          </motion.div>
          <motion.div variants={fadeUpVariant} transition={{ duration: 0.6 }} className="mb-4 flex items-center gap-1 sm:mb-6">
            <span className="font-mono! text-base text-transparent sm:text-lg md:text-xl lg:text-2xl" style={{ background: "linear-gradient(270deg, rgba(255, 255, 255, 0.48) 0%, #FFF 98.75%)", backgroundClip: "text" }}>
              $<CountUp from={0} to={+(exploreData.total_user_rewards ?? 0).toFixed(2)} separator="," direction="up" duration={0.8} delay={0.5} className="count-up-text" />
            </span>
          </motion.div>
          <motion.div variants={fadeUpVariant} transition={{ duration: 0.6 }} className="font-archivo text-xl font-semibold text-transparent bg-clip-text sm:text-2xl md:text-4xl lg:text-7xl xl:text-8xl" style={{ backgroundImage: "linear-gradient(180deg, #FFF 27.14%, rgba(255, 255, 255, 0.48) 100%)" }}>
            Trade Culture
          </motion.div>
          <motion.div variants={fadeUpVariant} transition={{ duration: 0.6 }} className="font-archivo mb-5 text-xl font-semibold text-purple-200 sm:mb-8 sm:text-2xl md:text-4xl lg:text-7xl xl:text-8xl">
            Earn As It Grows.
          </motion.div>
          <motion.div variants={fadeUpVariant} transition={{ duration: 0.6 }} className="flex gap-3">
            <Link href="/coins" className="group flex cursor-pointer items-center gap-2 rounded-full bg-white px-4 py-2 text-xs text-neutral-800 sm:px-5 sm:py-2.5 sm:text-sm lg:px-6 lg:py-3 lg:text-base">
              <div>Explore</div> <ArrowRightIcon size={16} className="transition-all duration-200 group-hover:translate-x-1" />
            </Link>
            {isLoggedIn ? (
              <Link href="/create" className="group flex cursor-pointer items-center gap-2 rounded-full border border-neutral-200 px-4 py-2 text-xs text-neutral-200 transition-all duration-200 hover:border-white hover:text-white sm:px-5 sm:py-2.5 sm:text-sm lg:px-6 lg:py-3 lg:text-base">
                <div>Create</div>
              </Link>
            ) : (
              <button onClick={() => setShowAuthFlow(true)} className="group flex cursor-pointer items-center gap-2 rounded-full border border-neutral-200 px-4 py-2 text-xs text-neutral-200 transition-all duration-200 hover:border-white hover:text-white sm:px-5 sm:py-2.5 sm:text-sm lg:px-6 lg:py-3 lg:text-base">
                <div>Sign Up</div>
              </button>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* ── Learn More / Expandable Card — tucked behind hero ── */}
      <div
        className="relative z-[1] -mt-16 shrink-0 cursor-pointer overflow-hidden rounded-[20px] border-0 sm:border sm:border-neutral-500 sm:-mt-24 sm:rounded-[2rem]"
        style={{
          background: "#121212",
          boxShadow: "0 16px 32px -8px rgba(12, 12, 13, 0.4)",
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Grain noise texture */}
        <svg className="hidden">
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          </filter>
        </svg>
        <div className="pointer-events-none absolute inset-0 z-[1] opacity-[0.015]" style={{ filter: "url(#grain)" }} />
        {/* Grid pattern overlay — CSS version for crisp lines */}
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            backgroundImage: [
              "linear-gradient(rgba(255,255,255,0.0055) 2px, transparent 2px)",
              "linear-gradient(90deg, rgba(255,255,255,0.0055) 2px, transparent 2px)",
              "linear-gradient(rgba(255,255,255,0.0055) 2px, transparent 2px)",
              "linear-gradient(90deg, rgba(255,255,255,0.0055) 2px, transparent 2px)",
            ].join(", "),
            backgroundSize: "48px 48px, 48px 48px, 192px 192px, 192px 192px",
          }}
        />
        <div className="relative z-[2]">
          {/* Spacer hidden behind hero overlap */}
          <div className="h-16 sm:h-24" />

          {/* "Learn more" label — fades out when expanding, fades in when collapsing */}
          <motion.div
            initial={false}
            animate={{
              opacity: isExpanded ? 0 : 1,
              height: isExpanded ? 0 : "auto",
            }}
            transition={{
              height: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
              opacity: isExpanded
                ? { duration: 0.15, ease: "easeOut" }
                : { duration: 0.2, delay: 0.15, ease: "easeIn" },
            }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-center pt-5">
              <span className="font-archivo text-base font-medium uppercase" style={{ color: "#B3B3B3" }}>
                Learn more
              </span>
            </div>
          </motion.div>

          {/*
            Expanded content — sweeps down from behind hero overlap.
            Outer div clips height, inner div translates so content
            appears to slide out from underneath.
          */}
          <motion.div
            initial={false}
            animate={{ height: isExpanded ? "auto" : 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            <motion.div
              initial={false}
              animate={{ y: isExpanded ? 0 : "-100%" }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="flex w-full flex-col items-center justify-around gap-6 px-[5%] py-5 sm:flex-row sm:gap-0 sm:py-6">
                <FeaturePillar icon={CreateIcon} title="CREATE" description="Launch coins around your favorite Internet trends or creators" />
                <div className="hidden h-px w-16 bg-neutral-500 sm:block" />
                <FeaturePillar icon={VerifyIcon} title="UNLOCK" description="Graduate and verify coins to unlock community and creator rewards" />
                <div className="hidden h-px w-16 bg-neutral-500 sm:block" />
                <FeaturePillar icon={EarnIcon} title="EARN" description="Earn from referrals, holding coins, or making viral UGC content" />
              </div>
            </motion.div>
          </motion.div>

          {/* Chevron — always visible at bottom, rotates 180° during expand/collapse */}
          <div className="flex justify-center py-4">
            <motion.div
              initial={false}
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              <DoubleChevron direction="down" />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
