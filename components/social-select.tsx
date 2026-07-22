"use client"

import { useEffect } from "react"
// import Instagram from "./icons/instagram"
import { detectSocialMediaType } from "@/lib/username-extractors"
// import Website from "./icons/website"
import { SOCIAL_TYPE } from "./socials"
import { Input } from "./ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger } from "./ui/select"
import { Tiktok, Twitter } from "./icons"

const SocialSelect = ({
  type,
  onTypeChange,
  value,
  onValueChange,
}: {
  type: SOCIAL_TYPE
  onTypeChange: (value: SOCIAL_TYPE) => void
  value: string
  onValueChange: (value: string) => void
}) => {
  const socials = [
    {
      type: SOCIAL_TYPE.TWITTER,
      label: "Twitter",
      icon: <Twitter size={14} />,
    },
    // {
    //   type: SOCIAL_TYPE.INSTAGRAM,
    //   label: "Instagram",
    //   icon: <Instagram size={14} />,
    // },
    // {
    //   type: SOCIAL_TYPE.WEBSITE,
    //   label: "Website",
    //   icon: <Website size={14} />,
    // },
    {
      type: SOCIAL_TYPE.TIKTOK,
      label: "Tiktok",
      icon: <Tiktok size={14} />,
    },
  ]

  // Auto-detect social media type but keep URL in input field
  useEffect(() => {
    if (value) {
      const detectedType = detectSocialMediaType(value)
      if (detectedType) {
        // Update the social type but keep the URL in the input field
        onTypeChange(detectedType as SOCIAL_TYPE)
      }
    }
  }, [value, onTypeChange])

  return (
    <div className="flex w-full items-start gap-2">
      <Select value={type} onValueChange={onTypeChange}>
        <SelectTrigger className="flex-items-center z-10 h-full w-fit min-w-8 cursor-pointer justify-center gap-0.5 px-2 text-white">
          <div className="flex items-center gap-1">{socials.find((social) => social.type === type)?.icon}</div>
        </SelectTrigger>
        <SelectContent className="border border-neutral-300">
          <SelectGroup>
            {socials.map((social) => (
              <SelectItem value={social.type} key={social.type}>
                <div className="flex cursor-pointer items-center gap-1">
                  {social.icon}
                  {social.label}
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Input
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className="w-full"
        wrapperclassname="w-full"
        placeholder="social"
      />
    </div>
  )
}

export default SocialSelect
