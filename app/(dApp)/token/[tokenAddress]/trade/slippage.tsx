"use client"

import { useState } from "react"

import { formatNumber } from "@/lib/number"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const defaultValue = 5
const Slippage = ({
  value,
  onChange,
  isMobile = false,
}: {
  value: number
  onChange: (value: number) => void
  isMobile?: boolean
}) => {
  const [selectAuto, setSelectAuto] = useState<boolean>(true)
  const [openInput, setOpenInput] = useState<boolean>(false)
  const [inputValue, setInputValue] = useState<string>("")

  return (
    <div className="flex h-[30px] w-full items-center">
      <div className="flex w-full items-center gap-1">
        <div className="text-sm font-medium text-nowrap text-neutral-200">Max Slippage</div>
        <div className="relative flex items-center gap-1 rounded-full border border-neutral-400 bg-neutral-700 p-1 text-xs font-semibold">
          <div
            onClick={() => {
              onChange(defaultValue)
              setSelectAuto(true)
            }}
            className={cn(
              "cursor-pointer rounded-full p-1.5 !leading-[9px]",
              selectAuto && "bg-purple-200 text-purple-600"
            )}
          >
            Auto
          </div>
          <DropdownMenu
            open={openInput}
            onOpenChange={(open) => {
              {
                setOpenInput(open)
                setSelectAuto(false)
                if (open) {
                  // Initialize input value when opening
                  setInputValue(String(Math.round(value * 100 * 1e10) / 1e10))
                }
              }
            }}
          >
            <DropdownMenuTrigger>
              <div
                className={cn(
                  "relative min-w-[40px] cursor-pointer rounded-full p-1.5 text-center font-mono !leading-[9px]",
                  !selectAuto && "bg-neutral-500 text-white"
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  setSelectAuto(false)
                }}
              >
                {formatNumber(value * 100, 2)}%
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              alignOffset={10}
              className="w-fit border-none bg-transparent shadow-2xl"
              side="right"
              align="center"
            >
              <div className="flex items-stretch gap-4">
                <input
                  className="h-[24px] w-[60px] rounded-[8px] border-2 border-neutral-300 bg-neutral-950 px-2 py-3 text-center text-xs shadow-md placeholder:text-neutral-400"
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    const newValue = e.target.value
                    // Only allow digits (0-9), period (.), comma (,) or empty string
                    if (newValue === "" || /^[\d.,]*$/.test(newValue)) {
                      setInputValue(newValue)
                      const numValue = Number(newValue.replace(/,/g, ""))
                      if (!isNaN(numValue)) {
                        if (numValue > 100) {
                          onChange(100 / 100)
                        } else {
                          onChange(numValue / 100)
                        }
                      }
                    }
                  }}
                  onBlur={() => {
                    // Ensure valid number on blur
                    const numValue = Number(inputValue.replace(/,/g, ""))
                    if (!isNaN(numValue)) {
                      setInputValue(String(Math.round(numValue * 1e10) / 1e10))
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === "Escape") {
                      setOpenInput(false)
                    }
                  }}
                  autoFocus
                />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* <Input
              value={customValue}
              onChange={(e) => {
                const value = e.target.value
                // Only allow digits (0-9) or empty string
                if (value === "" || /^\d*$/.test(value)) {
                  setCustomValue(Number(value))
                }
              }}
              suffixInside
              suffixEl={<span className="text-xs">%</span>}
              wrapperclassname="bg-neutral-600 w-[5.625rem] h-6"
              className={`h-6 ${customValue === 5 ? "text-neutral-400" : "text-brand"}`}
            /> */}
        </div>
      </div>
    </div>
  )
}

export default Slippage
