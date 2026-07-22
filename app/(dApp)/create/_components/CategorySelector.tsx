import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CATEGORIES } from "@/lib/constants"
import { VERIFICATION_CRITERIA } from "@/lib/verification-criteria"
import { ChevronDown } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface CategorySelectorProps {
  value?: string
  onChange?: (value: string) => void
}

export default function CategorySelector({ value, onChange }: CategorySelectorProps) {
  const triggerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(192)
  const [open, setOpen] = useState(false)
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)

  const selectedCategory = CATEGORIES.find((cat) => cat.key === value)

  useEffect(() => {
    const updateWidth = () => {
      if (triggerRef.current) {
        const newWidth = triggerRef.current.getBoundingClientRect().width
        setWidth(newWidth)
      }
    }

    updateWidth()

    window.addEventListener("resize", updateWidth)
    return () => window.removeEventListener("resize", updateWidth)
  }, [])

  const handleCategorySelect = (categoryKey: string) => {
    onChange?.(categoryKey)
    setOpen(false)
  }

  // Determine which category to display
  const categoryToDisplay = hoveredCategory || value || CATEGORIES[0].key
  const displayedCategory = CATEGORIES.find(cat => cat.key === categoryToDisplay)
  const criteria = VERIFICATION_CRITERIA[categoryToDisplay] || []

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <div
          ref={triggerRef}
          className="data-[state=open]:ring-1 ring-neutral-400 flex h-[41px] cursor-pointer items-center justify-between rounded-[12px] border bg-neutral-800 px-4 py-3 transition-all"
        >
          <div className={cn("flex items-center gap-2", selectedCategory ? "text-white" : "text-neutral-300")}>
            {selectedCategory?.icon && <selectedCategory.icon size={16} />}
            <span>{selectedCategory ? selectedCategory.label : "Category"}</span>
          </div>
          <ChevronDown size={18} className="text-neutral-300" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="bottom"
        align="center"
        sideOffset={8}
        alignOffset={2}
        className="w-full p-3"
        style={{ width: `${width}px`, boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.5)" }}
      >
        <div className="flex items-stretch gap-4">
          {/* Category list — fixed width */}
          <div className="flex w-[170px] shrink-0 flex-col gap-0.5">
            {CATEGORIES.map((category) => {
              const ICON = category.icon
              const isActive = (hoveredCategory || value) === category.key
              return (
                <div
                  key={category.key}
                  onClick={() => handleCategorySelect(category.key)}
                  onMouseEnter={() => setHoveredCategory(category.key)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  className="relative flex cursor-pointer items-center gap-2 rounded-[8px] px-2.5 py-2 text-[15px]"
                >
                  {isActive && (
                    <motion.div
                      layoutId="category-highlight"
                      className="absolute inset-0 rounded-[8px] bg-neutral-600"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                  <div className={cn("relative z-10 transition-colors duration-150", isActive ? "text-white" : "text-neutral-300")}>
                    {ICON && <ICON size={16} />}
                  </div>
                  <div className={cn("relative z-10 transition-colors duration-150", isActive ? "text-white font-medium" : "text-neutral-300")}>
                    {category.label}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="w-[0.5px] bg-neutral-500" />

          {/* Category detail — wider right panel */}
          <div className="flex w-[336px] flex-col pb-2">
            {/* Stacked Cards */}
            {displayedCategory?.images && displayedCategory.images.length > 0 && (
              <div className="relative mb-2 flex h-[165px] items-center justify-center">
                {displayedCategory.images.map((src, index) => (
                  <div
                    key={src}
                    className="absolute rounded-[24px] shadow-lg transition-transform"
                    style={{
                      transform: `translateX(${(index - 1) * 65}px) rotate(${(index - 1) * 8}deg) scale(${index === 1 ? 1.15 : 1})`,
                      width: "88px",
                      height: "88px",
                      zIndex: index === 1 ? 3 : index === 0 ? 2 : 1,
                    }}
                  >
                    <div className="relative size-[88px]">
                      <Image src={src} alt="" fill className="rounded-[12px] object-cover" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Category Description */}
            {displayedCategory && (
              <>
                <div className="space-y-1.5">
                  <p className="text-sm leading-relaxed text-neutral-200">
                    {displayedCategory.description}
                  </p>
                  {displayedCategory.examples && (
                    <p className="text-xs text-neutral-300">
                      {displayedCategory.examples}
                    </p>
                  )}
                </div>

                <div className="flex-1" />

                {/* Verification Requirements — pushed to bottom */}
                {criteria.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                      Verification Requirements
                    </h4>
                    <ul className="space-y-1 text-xs text-neutral-200">
                      {criteria.map((req, index) => (
                        <li key={index} className="flex gap-2">
                          <span className="mt-[3px] size-1.5 shrink-0 rounded-full bg-neutral-400" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
