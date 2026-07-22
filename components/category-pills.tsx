import { CATEGORIES } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { Ip } from "@/types/ip"

interface CategoryPillsProps {
  ip?: Ip | null
  className?: string
  iconSize?: number
}

const CategoryPills = ({ ip, className, iconSize = 12 }: CategoryPillsProps) => {
  if (!ip?.category) return null

  const cat = CATEGORIES.find((c) => c.key === ip.category)
  if (!cat) return null

  const Icon = cat.icon

  return (
    <div
      className={cn(
        "flex w-fit items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-xs shadow-sm",
        className
      )}
    >
      <Icon size={iconSize} />
      <span>{cat.label}</span>
    </div>
  )
}

export default CategoryPills
