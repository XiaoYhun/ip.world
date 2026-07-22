"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Grid, List } from "./icons"
import { cn } from "@/lib/utils"

export function ViewToggle() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentView = searchParams.get("view") || "grid"

  const handleViewChange = (view: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("view", view)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="ms-auto flex flex-row items-center gap-1">
      <div
        className={cn(
          "hover:bg-neutral-2000 flex h-8 w-8 cursor-pointer items-center justify-center rounded-[8px] border",
          currentView === "grid" ? "border-border text-white" : "text-neutral-400 border-transparent"
        )}
        onClick={() => handleViewChange("grid")}
      >
        <Grid />
      </div>
      <div
        className={cn(
          "hover:bg-neutral-2000 flex h-8 w-8 cursor-pointer items-center justify-center rounded-[8px] border",
          currentView === "list" ? "border-border text-white" : "text-neutral-400 border-transparent"
        )}
        onClick={() => handleViewChange("list")}
      >
        <List />
      </div>
    </div>
  )
}
