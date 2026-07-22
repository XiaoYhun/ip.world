import { formatNumber } from "@/lib/number"
import { cn } from "@/lib/utils"

export default function PercentageNumber({ value, className }: { value?: number; className?: string }) {
  if (!value && value !== 0) return null

  return (
    <span className={cn(value >= 0 ? "text-green-neon" : "text-red", "hidden sm:block", className)}>
      {value > 0 ? "+" : ""}
      {formatNumber(value || 0, 2)}%
    </span>
  )
}
