"use client"

import { useState, useEffect } from "react"
import { Copy, Check } from "lucide-react"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { Ip } from "@/types/ip"
import { Remix } from "@/types/remix"
import { cn } from "@/lib/utils"
import { Eye, Tiktok, Twitter } from "@/components/icons"
import { ChevronDown } from "lucide-react"
import { useIsMobileView } from "@/context/mobile-ui-context"
import { AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useProfile } from "@/hooks/use-profile"
import { buildTokenSocialRewardTags } from "@/lib/social-reward-tags"

const STORAGE_KEY = "ipworld_hide_how_it_works"

const CopyTag = ({ text, copyText, beforeContent, className }: { text: string, copyText?: string, beforeContent?: React.ReactNode, className?: string }) => {
  const [copied, setCopied] = useState(false)
  const fullText = copyText ?? text

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullText)
      setCopied(true)
      toast.success("Copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error("Failed to copy")
    }
  }

  return (
    <button
      type="button"
      title={fullText}
      onClick={handleCopy}
      className={`group inline-flex max-w-[min(100%,11rem)] min-w-0 items-center gap-1 rounded bg-neutral-500 p-1 font-mono text-xs transition-all hover:bg-neutral-600 rounded-[6px] ${className} text-neutral-100`}
    >
      {beforeContent ? <span className="flex shrink-0 items-center">{beforeContent}</span> : null}
      <span className="min-w-0 truncate text-center">{text}</span>
      <motion.span
        className="shrink-0"
        initial={false}
        animate={copied ? { scale: [1, 1.2, 1] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {copied ? (
          <Check size={12} className="text-green-400" />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path fillRule="evenodd" clipRule="evenodd" d="M5.08701 1.29338C4.75533 1.28316 4.427 1.28316 4.09533 1.29338C3.74045 1.3043 3.44391 1.02548 3.43299 0.670605C3.42207 0.315734 3.70089 0.019195 4.05576 0.00826825C4.4138 -0.00275608 4.76853 -0.00275608 5.12657 0.0082682C5.48145 0.0191949 5.76027 0.315734 5.74934 0.670605C5.73842 1.02548 5.44187 1.3043 5.08701 1.29338ZM6.37566 0.75431C6.41373 0.401316 6.73074 0.146016 7.08373 0.184082C7.14256 0.190425 7.20101 0.196909 7.25899 0.203451C7.94735 0.281125 8.52688 0.71778 8.80963 1.31543C8.96151 1.63636 8.82446 2.01963 8.50352 2.17148C8.18259 2.32332 7.79932 2.18625 7.64748 1.86533C7.5486 1.65635 7.34577 1.50711 7.11483 1.48106C7.05844 1.4747 7.00215 1.46846 6.94588 1.46239C6.59289 1.42432 6.33759 1.1073 6.37566 0.75431ZM2.80878 0.756005C2.84685 1.109 2.59155 1.42601 2.23855 1.46408C2.18228 1.47015 2.12599 1.47639 2.06961 1.48275C1.76162 1.5175 1.51107 1.76918 1.47788 2.07601C1.47189 2.13132 1.46603 2.18656 1.46033 2.2418C1.4239 2.59497 1.10808 2.85173 0.754912 2.81531C0.401745 2.77888 0.144976 2.46306 0.181401 2.10989C0.18736 2.05211 0.193458 1.9947 0.199624 1.93771C0.297779 1.03051 1.0213 0.307169 1.92544 0.205147C1.98342 0.198605 2.04187 0.192122 2.1007 0.185777C2.45369 0.147712 2.77071 0.403011 2.80878 0.756005ZM0.670554 3.43293C1.02543 3.44383 1.30427 3.74035 1.29337 4.09522C1.28316 4.42729 1.28316 4.75603 1.29337 5.08809C1.30427 5.44297 1.02543 5.73949 0.670554 5.75039C0.315681 5.76129 0.0191615 5.48245 0.00825833 5.12758C-0.00275278 4.76919 -0.00275278 4.41412 0.00825833 4.05573C0.0191615 3.70086 0.315681 3.42202 0.670554 3.43293ZM0.757377 6.37041C1.11054 6.33399 1.42637 6.59076 1.46279 6.94393C1.46778 6.99226 1.4729 7.04061 1.4781 7.08898L1.48035 7.10972C1.5055 7.34224 1.65639 7.54692 1.86873 7.64571C2.19063 7.79547 2.33018 8.17785 2.18042 8.49975C2.03065 8.82163 1.64828 8.96117 1.32638 8.81143C0.721351 8.52994 0.277513 7.94513 0.202088 7.24803C0.195921 7.19103 0.189825 7.13361 0.183866 7.07583C0.14744 6.72267 0.40421 6.40684 0.757377 6.37041ZM9.68906 3.14729C8.9886 3.06866 8.25417 3 7.5 3C6.74577 3 6.01185 3.06934 5.31177 3.14655L5.3096 3.14679C4.75524 3.21079 4.23891 3.46073 3.84482 3.85583C3.45072 4.25092 3.20211 4.76788 3.13951 5.3224L3.13923 5.32482C3.06452 6.02213 3 6.75165 3 7.5C3 8.24835 3.06453 8.97789 3.13924 9.67457L3.13951 9.67697C3.20211 10.2315 3.45072 10.7484 3.84482 11.1435C4.23891 11.5386 4.75524 11.7885 5.3096 11.8526L5.31094 11.8527C6.01142 11.9313 6.74583 12 7.5 12C8.25417 12 8.98791 11.9313 9.68897 11.8527L9.69043 11.8526C10.2447 11.7885 10.7611 11.5386 11.1552 11.1435C11.5493 10.7484 11.7979 10.2315 11.8605 9.67697L11.8608 9.67457C11.9355 8.97789 12 8.24901 12 7.5C12 6.751 11.9355 6.02149 11.8607 5.32539L11.8605 5.32305C11.7979 4.76853 11.5493 4.25157 11.1552 3.85647C10.7611 3.46138 10.2447 3.21145 9.69043 3.14745L9.68906 3.14729Z" fill="currentColor" />
          </svg>
        )}
      </motion.span>
    </button>
  )
}

interface HowItWorksProps {
  ip: Ip
  remix?: Remix
}

export default function HowItWorks({ ip, remix }: HowItWorksProps) {
  const [isHidden, setIsHidden] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(true)
  const { user } = useProfile()

  // Load hidden state from localStorage on mount
  useEffect(() => {
    const hidden = localStorage.getItem(STORAGE_KEY)
    if (hidden === "true") {
      setIsHidden(true)
    }
  }, [])

  const handleHide = () => {
    setIsHidden(true)
    localStorage.setItem(STORAGE_KEY, "true")
    toast.success("How It Works section hidden")
  }

  // Listen for show event from tab bar
  useEffect(() => {
    const handleShow = () => {
      setIsHidden(false)
      localStorage.removeItem(STORAGE_KEY)
    }
    window.addEventListener("show-how-it-works", handleShow)
    return () => window.removeEventListener("show-how-it-works", handleShow)
  }, [])

  // Dispatch hide/show state for tab bar to read
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("how-it-works-state", { detail: { isHidden } }))
  }, [isHidden])

  if (isHidden) {
    return null
  }

  const isMobile = useIsMobileView()
  const { tiktokTag, xTag } = buildTokenSocialRewardTags({
    tokenName: remix?.name,
    tokenSymbol: remix?.symbol,
    ipName: ip.title,
  })

  const stepsContent = (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 max-sm:gap-2">
      <div className="flex flex-col gap-2 p-1">
        <div>
          <div className="uppercase text-xs font-semibold mb-1 text-purple-300">Step 1</div>
          <div className="text-xl max-sm:text-base font-semibold text-neutral-100">Link your socials</div>
        </div>
        <p className="text-sm text-neutral-100">
          <Link href="/settings" className="underline text-purple-200 font-semibold hover:text-purple-300">Connect</Link> your X or TikTok to IP World
        </p>
      </div>
      <div className="flex flex-col gap-2 p-1">
        <div>
          <div className="uppercase text-xs font-semibold mb-1 text-purple-300">Step 2</div>
          <div className="text-xl max-sm:text-base font-semibold text-neutral-100">Refer Other Users</div>
        </div>
        <p className="text-sm text-neutral-100">
          Pin your reflink <CopyTag
            text="/reflink"
            copyText={user?.referral_code ? `https://ip.world/?ref=${user.referral_code}` : undefined}
            className="h-6"
          /> to bio
        </p>
      </div>
      <div className="flex flex-col gap-2 p-1">
        <div>
          <div className="uppercase text-xs font-semibold mb-1 text-purple-300">Step 3</div>
          <div className="text-xl max-sm:text-base font-semibold text-neutral-100">Earn Rewards</div>
        </div>
        <p className="text-sm text-neutral-100">
          Tag <CopyTag beforeContent={<Tiktok size={12} />} text={tiktokTag} className="h-6" /> {xTag ? <>or <CopyTag beforeContent={<Twitter size={12} />} text={xTag} className="h-6" /> </> : null}
          on your post
        </p>
      </div>
    </div>
  )

  // Mobile: collapsed by default, tap to expand
  if (isMobile) {
    return (
      <div className="rounded-[14px] bg-neutral-800/50 border border-neutral-700 overflow-hidden">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex w-full items-center justify-between px-3.5 py-3"
        >
          <span className="text-sm font-semibold text-[#C297FF]">How it works</span>
          <ChevronDown
            size={16}
            className={cn("text-neutral-400 transition-transform duration-200", !isCollapsed && "rotate-180")}
          />
        </button>
        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1, transition: { duration: 0.2 } }}
              exit={{ height: 0, opacity: 0, transition: { duration: 0.15 } }}
              className="overflow-hidden"
            >
              <div className="px-3.5 pb-3">
                {stepsContent}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // Desktop: full layout
  return (
    <div className="relative z-0 mt-4 rounded-[20px] p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="mb-4 inline-block rounded-[6px] border bg-purple/20 border-purple-accent/50 px-2 py-1.5">
          <span className="text-xs font-medium uppercase tracking-wider text-[#C297FF] font-mono">How it works</span>
        </div>
        <div
          onClick={handleHide}
          className="flex items-center gap-1 text-xs text-neutral-400 font-medium cursor-pointer hover:text-neutral-200 transition-colors"
        >
          <Eye size={14} />
          Hide
        </div>
      </div>
      {stepsContent}
    </div>
  )
}
