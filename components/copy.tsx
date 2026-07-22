"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { showToast } from "./ui/custom-toast"

/* Animated check mark — draws on like animate-ui check #3 */
function AnimatedCheck({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 12.5L9.5 18L20 6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: 28,
          strokeDashoffset: 28,
          animation: "check-draw 0.35s ease-out forwards",
        }}
      />
      <style>{`@keyframes check-draw { to { stroke-dashoffset: 0; } }`}</style>
    </svg>
  )
}

const Copy = ({
  text,
  copy,
  size = 12,
  className,
  textClassName,
  copiedTextClassName,
  hideIcon = false,
  toastLabel,
  variant = "document",
  iconPosition = "right",
}: {
  text?: string
  copy?: string
  size?: number
  className?: string
  textClassName?: string
  copiedTextClassName?: string
  hideIcon?: boolean
  toastLabel?: string
  variant?: "document" | "overlap"
  iconPosition?: "left" | "right"
}) => {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(copy ?? text ?? "")
    setIsCopied(true)
    showToast({
      variant: "clipboard",
      title: "Copied to clipboard",
      description: toastLabel ? `Copied CA for ${toastLabel}` : "Successfully copied to clipboard",
    })
    setTimeout(() => {
      setIsCopied(false)
    }, 2000)
  }

  return (
    <span
      className={cn("flex cursor-pointer items-center gap-1 transition-all hover:text-white", className)}
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        handleCopy()
      }}
    >
      {text && iconPosition === "right" && <span className={cn(textClassName, isCopied && copiedTextClassName)}>{text}</span>}
      {hideIcon === false && (
        <span>
          {isCopied ? (
            <AnimatedCheck size={Math.round(size * 1.2)} className={cn("text-current")} />
          ) : variant === "overlap" ? (
            <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 12 12" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M5.08701 1.29338C4.75533 1.28316 4.427 1.28316 4.09533 1.29338C3.74045 1.3043 3.44391 1.02548 3.43299 0.670605C3.42207 0.315734 3.70089 0.019195 4.05576 0.00826825C4.4138 -0.00275608 4.76853 -0.00275608 5.12657 0.0082682C5.48145 0.0191949 5.76027 0.315734 5.74934 0.670605C5.73842 1.02548 5.44187 1.3043 5.08701 1.29338ZM6.37566 0.75431C6.41373 0.401316 6.73074 0.146016 7.08373 0.184082C7.14256 0.190425 7.20101 0.196909 7.25899 0.203451C7.94735 0.281125 8.52688 0.71778 8.80963 1.31543C8.96151 1.63636 8.82446 2.01963 8.50352 2.17148C8.18259 2.32332 7.79932 2.18625 7.64748 1.86533C7.5486 1.65635 7.34577 1.50711 7.11483 1.48106C7.05844 1.4747 7.00215 1.46846 6.94588 1.46239C6.59289 1.42432 6.33759 1.1073 6.37566 0.75431ZM2.80878 0.756005C2.84685 1.109 2.59155 1.42601 2.23855 1.46408C2.18228 1.47015 2.12599 1.47639 2.06961 1.48275C1.76162 1.5175 1.51107 1.76918 1.47788 2.07601C1.47189 2.13132 1.46603 2.18656 1.46033 2.2418C1.4239 2.59497 1.10808 2.85173 0.754912 2.81531C0.401745 2.77888 0.144976 2.46306 0.181401 2.10989C0.18736 2.05211 0.193458 1.9947 0.199624 1.93771C0.297779 1.03051 1.0213 0.307169 1.92544 0.205147C1.98342 0.198605 2.04187 0.192122 2.1007 0.185777C2.45369 0.147712 2.77071 0.403011 2.80878 0.756005ZM0.670554 3.43293C1.02543 3.44383 1.30427 3.74035 1.29337 4.09522C1.28316 4.42729 1.28316 4.75603 1.29337 5.08809C1.30427 5.44297 1.02543 5.73949 0.670554 5.75039C0.315681 5.76129 0.0191615 5.48245 0.00825833 5.12758C-0.00275278 4.76919 -0.00275278 4.41412 0.00825833 4.05573C0.0191615 3.70086 0.315681 3.42202 0.670554 3.43293ZM0.757377 6.37041C1.11054 6.33399 1.42637 6.59076 1.46279 6.94393C1.46778 6.99226 1.4729 7.04061 1.4781 7.08898L1.48035 7.10972C1.5055 7.34224 1.65639 7.54692 1.86873 7.64571C2.19063 7.79547 2.33018 8.17785 2.18042 8.49975C2.03065 8.82163 1.64828 8.96117 1.32638 8.81143C0.721351 8.52994 0.277513 7.94513 0.202088 7.24803C0.195921 7.19103 0.189825 7.13361 0.183866 7.07583C0.14744 6.72267 0.40421 6.40684 0.757377 6.37041ZM9.68906 3.14729C8.9886 3.06866 8.25417 3 7.5 3C6.74577 3 6.01185 3.06934 5.31177 3.14655L5.3096 3.14679C4.75524 3.21079 4.23891 3.46073 3.84482 3.85583C3.45072 4.25092 3.20211 4.76788 3.13951 5.3224L3.13923 5.32482C3.06452 6.02213 3 6.75165 3 7.5C3 8.24835 3.06453 8.97789 3.13924 9.67457L3.13951 9.67697C3.20211 10.2315 3.45072 10.7484 3.84482 11.1435C4.23891 11.5386 4.75524 11.7885 5.3096 11.8526L5.31094 11.8527C6.01142 11.9313 6.74583 12 7.5 12C8.25417 12 8.98791 11.9313 9.68897 11.8527L9.69043 11.8526C10.2447 11.7885 10.7611 11.5386 11.1552 11.1435C11.5493 10.7484 11.7979 10.2315 11.8605 9.67697L11.8608 9.67457C11.9355 8.97789 12 8.24901 12 7.5C12 6.751 11.9355 6.02149 11.8607 5.32539L11.8605 5.32305C11.7979 4.76853 11.5493 4.25157 11.1552 3.85647C10.7611 3.46138 10.2447 3.21145 9.69043 3.14745L9.68906 3.14729Z" fill="currentColor" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 10 10" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M6.14583 0.520874V3.12504V3.43754H6.45833H9.0625V9.47921H0.9375V0.520874H6.14583ZM6.77083 0.520874V2.81254H9.0625V2.78727L6.79612 0.520874H6.77083Z" fill="currentColor" />
            </svg>
          )}
        </span>
      )}
      {text && iconPosition === "left" && <span className={cn(textClassName, isCopied && copiedTextClassName)}>{text}</span>}
    </span>
  )
}

export default Copy
