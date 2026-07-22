import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { Ip } from "@/types/ip"

const TIERS = [
  { label: "Emerging", min: 0, max: 50, color: "text-neutral-400", bg: "bg-neutral-800 border-neutral-700" },
  { label: "Heating Up", min: 50, max: 75, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30" },
  { label: "Trending", min: 75, max: 90, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/30" },
  { label: "Viral", min: 90, max: 100, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/30" },
]

interface ViralityScoreProps {
  ip: Ip | undefined
  noBg?: boolean
  className?: string
}

const ViralityScore = ({ ip, noBg = false, className }: ViralityScoreProps) => {
  const score = ip?.viral_score

  const tier = useMemo(() => {
    if (score == null) return null
    return TIERS.find((t) => score >= t.min && score <= t.max) ?? null
  }, [score])

  if (!tier || score == null) return null

  if (noBg) {
    return (
      <span className={cn("font-mono text-xs font-medium", tier.color, className)}>
        {Math.round(score)}
      </span>
    )
  }

  return (
    <div
      className={cn(
        "flex w-fit items-center gap-1.5 rounded-[6px] border px-2 py-0.5 font-mono text-xs font-medium",
        tier.bg,
        tier.color,
        className
      )}
    >
      <span>{Math.round(score)}</span>
      <span className="uppercase">{tier.label}</span>
    </div>
  )
}

export default ViralityScore
