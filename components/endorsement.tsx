"use client"

import { cn } from "@/lib/utils"
import { StarChecked, StarUnchecked } from "./icons"

const Endorsement = ({
  value,
  onChange,
  size = 20,
  className,
}: {
  value: boolean
  onChange: (value: boolean) => void
  size?: number
  className?: string
}) => {
  return (
    <div
      onClick={(event: React.MouseEvent<HTMLDivElement>) => {
        event.stopPropagation()
        onChange(!value)
      }}
      className={cn("cursor-pointer text-white", className)}
    >
      {value ? <StarChecked size={size} /> : <StarUnchecked size={size} />}
    </div>
  )
}

export default Endorsement
