"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface ReferralLinkCopyProps {
  referralCode?: string
  className?: string
  showLabel?: boolean
  labelText?: string
}

export default function ReferralLinkCopy({
  referralCode,
  className,
  showLabel = false,
  labelText = "Referral Link",
}: ReferralLinkCopyProps) {
  const [isCopied, setIsCopied] = useState(false)

  if (!referralCode) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://ip.world/?ref=${referralCode}`)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {showLabel && <label className="text-xs font-semibold text-neutral-300">{labelText}</label>}
      <div className="flex items-center gap-2 rounded-[10px] border bg-neutral-600/70 px-3 py-3 backdrop-blur-sm">
        <span className="flex-1 text-sm text-neutral-300 truncate text-ellipsis ">
          ip.world/?ref=<span className="text-white">{referralCode}</span>
        </span>
        <span
          className="flex cursor-pointer items-center transition-all text-neutral-200 hover:text-white"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            handleCopy()
          }}
        >
          {isCopied ? (
            <Check size={12} className="text-green" />
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M2 1.25H9.875V9.125H11.125V0H2V1.25ZM0 2.125H9V11.125H0V2.125ZM7 6H5.125V4.125H3.875V6H2V7.25H3.875V9.125H5.125V7.25H7V6Z" fill="currentColor" />
            </svg>
          )}
        </span>
      </div>
    </div>
  )
}
