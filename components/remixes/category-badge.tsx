import { CATEGORIES } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const CategoryBadge = ({ category, size = 14, className }: { category?: string; size?: number; className?: string }) => {
  if (!category) return null
  const cat = CATEGORIES.find((c) => c.key === category)
  if (!cat?.icon) return null
  const Icon = cat.icon

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn("flex items-center justify-center rounded-[6px] bg-black/70 backdrop-blur-sm p-1", className)}>
          <Icon size={size} />
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {cat.label}
      </TooltipContent>
    </Tooltip>
  )
}

export default CategoryBadge
