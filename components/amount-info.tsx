import useDock from "@/hooks/use-dock"
import { cn } from "@/lib/utils"
import { Skeleton } from "./ui/skeleton"
import VisualizedDelta from "./visualized-delta"

const AmountInfoV2 = ({
  label,
  value,
  position = "end",
  isLoading = false,
}: {
  label: string
  value: string
  position?: "end" | "center" | "start"
  isLoading?: boolean
}) => {
  const { isDocked } = useDock()
  return (
    <div
      className={cn("flex min-w-[4.8125rem] flex-col", isDocked ? "gap-0.5" : "gap-2.5", {
        "items-center": position === "center",
        "items-start": position === "start",
        "items-end": position === "end",
      })}
    >
      <p className="text-xs text-neutral-300">{label}</p>
      <p className="text-md">
        {isLoading ? <Skeleton className="h-4 w-12" /> : <VisualizedDelta dollar>{value}</VisualizedDelta>}
      </p>
    </div>
  )
}

export default AmountInfoV2
