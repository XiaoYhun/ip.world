import { UseFormRegister, useWatch } from "react-hook-form"

import { Control, useFieldArray, Controller } from "react-hook-form"
import { Instagram, Tiktok, Twitter, Youtube } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { URL_REGEX } from "@/lib/constants"

import SocialLinkInput from "./SocialLinkInput"

export interface SocialLink {
  type: string
  url: string
}

const SOCIAL_LINKS = [
  { type: "twitter", icon: Twitter, placeholder: "Twitter" },
  { type: "tiktok", icon: Tiktok, placeholder: "TikTok" },
  { type: "instagram", icon: Instagram, placeholder: "Instagram" },
  { type: "youtube", icon: Youtube, placeholder: "YouTube" },
]
interface LinksProps {
  name: "socials" | "remix_socials"
  control: Control
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>
  disabled?: boolean
  isToken?: boolean
}

const Links = ({ name, control, register, disabled = false, isToken = false }: LinksProps) => {
  const value = useWatch({
    name,
    control,
  })

  const { fields, append, remove } = useFieldArray<any>({
    control,
    name,
  })

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 overflow-hidden overflow-x-auto">
        {fields.map((field: any, index) => {
          const social = SOCIAL_LINKS.find((social) => "type" in field && social.type === field.type)
          const Icon = social?.icon as React.ElementType

          return (
            <Controller
              key={field.id}
              name={`${name}.${index}.url`}
              control={control}
              rules={{
                validate: (v: string) => {
                  if (!v || !v.trim()) return true
                  return URL_REGEX.test(v.trim()) || "Enter a valid URL"
                },
              }}
              render={({ field: { onChange, value, onBlur, name, ref }, fieldState: { error } }) => (
                <SocialLinkInput
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  name={name}
                  ref={ref}
                  placeholder={social?.placeholder}
                  hasError={!!error}
                >
                  <Icon size={12} />
                </SocialLinkInput>
              )}
            />
          )
        })}
      </div>
    </div>
  )
}

export default Links
