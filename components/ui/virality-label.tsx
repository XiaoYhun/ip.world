import { cn } from "@/lib/utils"
import { useMemo } from "react"

const LABELS = [
  { label: "Emerging", valueStart: 0, valueEnd: 50 },
  { label: "Heating up", valueStart: 50, valueEnd: 75 },
  { label: "Trending", valueStart: 75, valueEnd: 90 },
  { label: "Viral", valueStart: 90, valueEnd: 100 },
]

export function ViralityLabel({ viralScore, className }: { viralScore?: number; className?: string }) {
  const label = useMemo(() => {
    return LABELS.find((label) => !!viralScore && viralScore >= label.valueStart && viralScore <= label.valueEnd)?.label
  }, [viralScore])

  if (!viralScore) return null

  return (
    <div
      className={cn(
        "flex w-fit items-center gap-2 rounded-[6px] border border-[#944AFF80] bg-[#AD74FE33] px-2 py-1 font-mono text-xs font-medium text-[#C297FF] uppercase",
        className
      )}
    >
      {label}
    </div>
  )
}
