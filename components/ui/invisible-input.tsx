import { useState } from "react"
import { cn } from "@/lib/utils"

const InvisibleInput = ({
  leftComponent,
  rightComponent,
  inputType = "text",
  placeholder = "",
  className = "",
  focusClassName = "",
  hoverClassName = "",
  inputClassName = "",
  ...props
}: {
  leftComponent?: React.ReactNode
  rightComponent?: React.ReactNode
  inputType?: string
  placeholder?: string
  className?: string
  focusClassName?: string
  hoverClassName?: string
  inputClassName?: string
} & React.InputHTMLAttributes<HTMLInputElement>) => {
  const [isFocused, setIsFocused] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={cn(
        "hover:bg-input/30 flex items-center gap-2 rounded-[10px] border border-[#00000000] transition-all duration-200 hover:border-[#44444D]",
        className,
        isFocused && "bg-input/30 border-[#44444D]" + focusClassName,
        isHovered && hoverClassName
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {leftComponent}
      <input
        type={inputType}
        className={`${inputClassName} m-3 ml-0 w-full outline-none`}
        placeholder={placeholder}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
      {rightComponent}
    </div>
  )
}

export default InvisibleInput
