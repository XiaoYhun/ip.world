import * as React from "react"
import type { FieldError } from "react-hook-form"

import { cn, getErrorClassName } from "@/lib/utils"
import { detectSocialMediaType } from "@/lib/username-extractors"
import { Facebook, Instagram, Tiktok, Twitter, Youtube } from "@/components/icons"

interface OwnerLinkInputProps {
  value: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  inputRef: React.Ref<HTMLInputElement>
  error?: FieldError
}

const OwnerLinkInput = ({ value, onChange, inputRef, error }: OwnerLinkInputProps) => {
  const socialType = React.useMemo(() => {
    if (!value) return null
    const base = detectSocialMediaType(value)
    if (base) return base

    const v = value.trim().toLowerCase()
    if (v.includes("facebook.com") || v.includes("fb.com")) return "facebook"
    if (v.includes("instagram.com")) return "instagram"
    if (v.includes("youtube.com") || v.includes("youtu.be")) return "youtube"
    return null
  }, [value])

  let icon: React.ReactNode = null
  if (socialType === "twitter") icon = <Twitter size={14} />
  else if (socialType === "tiktok") icon = <Tiktok size={14} />
  else if (socialType === "facebook") icon = <Facebook size={14} />
  else if (socialType === "instagram") icon = <Instagram size={14} />
  else if (socialType === "youtube") icon = <Youtube size={14} />

  return (
    <div>
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white">
            {icon}
          </div>
        )}
        <input
          ref={inputRef}
          value={value}
          className={cn(
            "h-[41px] w-full min-w-0 flex-2 rounded-[12px] border bg-neutral-800 pr-4 py-2 outline-none placeholder:text-neutral-300",
            socialType ? "pl-10" : "pl-4",
            getErrorClassName(error)
          )}
          type="text"
          placeholder="IP Owner Social Link"
          onChange={onChange}
        />
      </div>
      {error?.message && <p className="mt-1 text-xs text-red-500">{error.message}</p>}
    </div>
  )
}

export default OwnerLinkInput

