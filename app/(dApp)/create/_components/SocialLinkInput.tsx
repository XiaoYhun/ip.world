import { forwardRef } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const SocialLinkInput = forwardRef<
  HTMLInputElement,
  { children?: React.ReactNode; hasError?: boolean } & React.InputHTMLAttributes<HTMLInputElement>
>(({ children, hasError, ...props }, ref) => {
  const hasValue = typeof props.value === "string" && props.value?.trim() !== ""

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="focus-visible:border-border focus-visible:!ring-0">
        <Button
          variant="secondary"
          className={cn(
            "bg-panel h-[38px] w-[36px] rounded-[8px] border transition-all",
            hasValue && !hasError && "bg-white text-black",
            hasError && "border-red-500 bg-red-500/10 text-red-400"
          )}
        >
          {children}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="border-none bg-transparent"
        side="bottom"
        align="center"
        sideOffset={8}
        alignOffset={2}
      >
        <div className="flex flex-col gap-1">
          <input
            ref={ref}
            className={cn(
              "h-[36px] rounded-[8px] border bg-neutral-800 px-2 py-3 text-sm shadow-md placeholder:text-neutral-400",
              hasError && "border-red-500"
            )}
            type="text"
            {...props}
          />
          {hasError && <span className="px-1 text-xs text-red-400">Enter a valid URL</span>}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})

SocialLinkInput.displayName = "SocialLinkInput"

export default SocialLinkInput
