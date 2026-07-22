import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger } from "@/components/ui/select"
import { useState } from "react"

const CONTACT_ROLE_OPTIONS = [
  {
    key: "original-creator",
    label: "Original Creator",
  },
  {
    key: "authorized-representative",
    label: "Authorized Representative",
  },
  {
    key: "team-member",
    label: "Team Member",
  },
  {
    key: "rights-holder",
    label: "Rights Holder",
  },
  {
    key: "affiliated-contributor",
    label: "Affiliated Contributor",
  },
  {
    key: "other",
    label: "Other",
  },
]
export default function ContactRoleSelect() {
  const [selected, setSelected] = useState<string>("")

  const onClick = (value: string) => {
    setSelected(value)
  }

  return (
    <Select value={selected} onValueChange={onClick}>
      <SelectTrigger
        className="flex h-[40px] w-full cursor-pointer items-center gap-0.5 rounded-[12px] border border-neutral-500 bg-neutral-700 px-3 py-3 text-sm font-medium text-white"
        style={{ boxShadow: "0 2px 12px 0 rgba(0, 0, 0, 0.20)" }}
      >
        <div className="flex items-center gap-1">
          {selected ? CONTACT_ROLE_OPTIONS.find((option) => option.key === selected)?.label : "Select Contact Role"}
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {CONTACT_ROLE_OPTIONS.map((option) => (
            <SelectItem value={option.key} key={option.key}>
              <div className="flex cursor-pointer items-center gap-1">{option.label}</div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
