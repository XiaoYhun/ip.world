import { cn } from "@/lib/utils"
import React, { JSX } from "react"

const BigNumberInput = ({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (value: string) => void
  className?: string
  suffix?: JSX.Element
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value

    // Allow only digits and optional decimal points
    if (/^\d*\.?\d*$/.test(inputValue)) {
      onChange(inputValue)
    }
  }

  return <input type="text" value={value} onChange={handleChange} className={cn("focus:!shadow-none", className)} />
}

export default BigNumberInput
