import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarsProps {
  rating: number
  max?: number
  size?: number
  className?: string
}

export const Stars = ({ rating, max = 5, size = 12, className }: StarsProps) => {
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: max }, (_, i) => {
        const filled = rating >= i + 1
        const partial = !filled && rating > i
        const fill = partial ? Math.round((rating - i) * 100) : filled ? 100 : 0

        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} className="text-neutral-700" fill="currentColor" />
            {fill > 0 && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill}%` }}
              >
                <Star size={size} className="text-yellow-400" fill="currentColor" />
              </span>
            )}
          </span>
        )
      })}
    </div>
  )
}
