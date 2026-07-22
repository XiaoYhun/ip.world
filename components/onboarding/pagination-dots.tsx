"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface PaginationDotsProps {
  totalSteps: number
  currentStep: number
  onStepClick?: (step: number) => void
  className?: string
}

export function PaginationDots({ totalSteps, currentStep, onStepClick, className }: PaginationDotsProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: totalSteps }).map((_, index) => {
        const isActive = index === currentStep
        return (
          <motion.button
            key={index}
            type="button"
            onClick={() => onStepClick?.(index)}
            disabled={!onStepClick}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              isActive ? "bg-white" : "bg-white/15",
              onStepClick ? "cursor-pointer hover:bg-white/30" : "cursor-default"
            )}
            initial={false}
            animate={{
              width: isActive ? 40 : 8,
            }}
            transition={{
              duration: 0.3,
              delay: 0,
              ease: "easeInOut",
            }}
            aria-label={`Step ${index + 1} of ${totalSteps}`}
            aria-current={isActive ? "step" : undefined}
          />
        )
      })}
    </div>
  )
}
