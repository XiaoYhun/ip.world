"use client"

import { useEffect, useRef, useState } from "react"
import { useIsLoggedIn } from "@dynamic-labs/sdk-react-core"
import { MessageSquare } from "lucide-react"
import { useSidebar } from "@/context/sidebar-context"
import { cn } from "@/lib/utils"
import { useBetaFeedback } from "@/hooks/use-beta-feedback"
import { SIDEBAR_TOP_ITEMS } from "./constants"
import FeedbackModal from "../modals/feedback-modal"
import IpLogo from "./ip-logo"
import Ips from "./ips"
import SidebarNavItem from "./sidebar-nav-item"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"

const AppSidebar = () => {
  const topItems = SIDEBAR_TOP_ITEMS
  const { isExpanded, setIsExpanded, closeDropdown } = useSidebar()
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const isLoggedIn = useIsLoggedIn()
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const { submitFeedback, submitBugReport } = useBetaFeedback()

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="transition-width hidden min-w-[57px] md:block">
      <aside className="group z-sidebar fixed inset-y-0 left-0 h-full">
        <nav
          className={cn(
            "transition-width ease-out-quint group bg-panel flex h-full flex-col border-r duration-300",
            isExpanded ? "w-[216px]" : "w-[57px]"
          )}
          aria-label="Main"
        // onMouseEnter={() => {
        //   if (timeoutRef.current) {
        //     clearTimeout(timeoutRef.current)
        //   }
        //   setIsExpanded(true)
        // }}
        // onMouseLeave={(e) => {
        //   // Close dropdown and collapse when hovering outside, but not when moving to dropdown content
        //   const relatedTarget = e.relatedTarget as HTMLElement | null
        //   if (
        //     relatedTarget &&
        //     relatedTarget.closest &&
        //     !relatedTarget.closest("[data-radix-dropdown-menu-content]")
        //   ) {
        //     closeDropdown()
        //     timeoutRef.current = setTimeout(() => setIsExpanded(false), 100)
        //   }
        // }}
        >
          <div className="flex flex-col gap-2 px-2.5 py-5 pb-5">
            <IpLogo />
            {topItems.map((item) => (
              <SidebarNavItem key={`sidebar-nav-${item.label}`} item={item} />
            ))}
          </div>

          {/* <Ips /> */}

          {/* Feedback button */}
          {isLoggedIn && (
            <div className="mt-auto px-2.5 pb-5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setFeedbackOpen(true)}
                    className={cn(
                      "ease-out-quint flex h-9 w-full cursor-pointer flex-nowrap items-center gap-2 rounded-[6px] p-[6px] no-underline transition-colors duration-200 hover:bg-neutral-600 bg-transparent"
                    )}
                  >
                    <div className="flex items-center justify-center">
                      <div className="flex h-6 w-6 items-center justify-center">
                        <MessageSquare size={20} />
                      </div>
                    </div>
                    <div className="order-2 flex flex-auto flex-col items-start justify-center self-stretch overflow-hidden">
                      <span
                        className={cn(
                          "font-inherit text-md leading-normal whitespace-nowrap transition-opacity",
                          isExpanded ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        )}
                      >
                        Feedback
                      </span>
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" align="center" sideOffset={10}>
                  Feedback
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </nav>
      </aside>

      <div
        className={cn(
          "ease-out-quint data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 animate-out fade-out-0 ease-out-quint fixed inset-0 z-[20] transition-all duration-300",
          isExpanded ? "bg-overlay pointer-events-auto opacity-100" : "pointer-events-none bg-transparent opacity-0"
        )}
        onMouseEnter={() => {
          if (isExpanded) {
            closeDropdown()
            setIsExpanded(false)
          }
        }}
      ></div>

      <FeedbackModal
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        onSubmitFeedback={submitFeedback}
        onSubmitBugReport={submitBugReport}
      />
    </div>
  )
}

export default AppSidebar
