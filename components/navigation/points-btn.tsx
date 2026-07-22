"use client"

import { Button } from "../ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"

const PointsBtn = () => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" className="flex items-center px-1 text-xs text-neutral-300" size="sm">
          0pts
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="font-normal">
        IP World Points: {Math.ceil((new Date("2025-04-03").getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}d
      </TooltipContent>
    </Tooltip>
  )
}

export default PointsBtn
