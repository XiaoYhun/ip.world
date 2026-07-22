import { cn } from "@/lib/utils"
import IPIcon from "./ip-icon"
import { VERIFICATION_STEP } from "./steps"
import { motion } from "framer-motion"
import { CheckIcon } from "lucide-react"
import { Ip } from "@/types/ip"

const titleCase = (s: string) => s.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ")

const getSteps = (): { id: VERIFICATION_STEP; label: string; children?: { id: VERIFICATION_STEP; label: string }[] }[] => [
  {
    id: VERIFICATION_STEP.TOKEN_ELIGIBILITY,
    label: "Verification Eligibility",
  },
  {
    id: VERIFICATION_STEP.IP_INFORMATION_LINK_SUPPORT,
    label: "Supporting Information",
  },
  {
    id: VERIFICATION_STEP.RELATIONSHIP_TO_IP,
    label: "Verifier Details",
  },
  {
    id: VERIFICATION_STEP.IP_RIGHTS,
    label: "IP Rights",
  },
  {
    id: VERIFICATION_STEP.TERMS_AND_CONDITIONS,
    label: "Terms & Conditions",
  },
]

export default function LeftNavigateBar({
  step: currentStep,
  setStep,
  ip,
}: {
  step: VERIFICATION_STEP
  setStep: (step: VERIFICATION_STEP) => void
  ip?: Ip
}) {
  return (
    <div className="h-full w-full">
      <IPIcon />
      <div className="mt-6 mb-3 text-[24px] font-medium">IP Verification</div>
      <div className="mb-4 text-sm text-neutral-100">
        Verify as the {ip?.type === "creator" ? "creator" : "community"} behind<br />{ip ? titleCase(ip.title) : "this IP"} to start<br />earning {ip?.type === "creator" ? "creator" : "community"} rewards
      </div>
      <div className="flex flex-col gap-2">
        {getSteps().map((step, index) => {
          const isActive = step.id === currentStep || step.children?.some((child) => child.id === currentStep)
          const isCompleted =
            (step.id && step.id < currentStep) || step.children?.every((child) => child.id < currentStep)
          return (
            <div
              key={step.label + index}
              className={cn(
                "cursor-pointer rounded-[12px] p-2 transition-all",
                isActive ? "bg-neutral-700" : "hover:bg-neutral-700/500"
              )}
              onClick={() => {
                const stepId = step.id || step.children?.[0].id
                if (stepId) {
                  setStep(stepId)
                }
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "font-archivo flex size-6 shrink-0 items-center justify-center rounded-full border-1 border-white font-medium text-white",
                    isActive && !isCompleted && "bg-white text-black"
                  )}
                >
                  {isCompleted ? <CheckIcon className="size-4" /> : index + 1}
                </div>
                <div className={cn("text-neutral-100 hover:text-white")}>{step.label}</div>
              </div>
              {step.children && (
                <motion.div
                  variants={{ hidden: { opacity: 0, height: 0 }, visible: { opacity: 1, height: "auto" } }}
                  initial="hidden"
                  animate={isActive ? "visible" : "hidden"}
                  transition={{ duration: 0.1 }}
                  className="pl-8 text-[13px]"
                >
                  <div className="flex flex-col gap-2 pt-3">
                    {step.children.map((child, childIndex) => {
                      const isActive = child.id === currentStep
                      const isCompleted = child.id < currentStep
                      const color = isActive || isCompleted ? "white" : "#494949"
                      return (
                        <div
                          key={child.label + (childIndex as number).toString()}
                          className={cn(
                            "relative text-neutral-400 transition-all",
                            (isActive || isCompleted) && "text-white"
                          )}
                          onClick={(e) => {
                            e.stopPropagation()
                            setStep(child.id)
                          }}
                        >
                          {child.label}
                          <div
                            className={cn(
                              "absolute top-[4px] -left-6 z-1 size-[5px] rounded-full bg-neutral-400",
                              (isActive || isCompleted) && "bg-white"
                            )}
                          />
                          {childIndex !== 0 && (
                            <div
                              className={cn(
                                "absolute -top-[16px] -left-[22px] z-0 h-[20px] w-px rounded-full",
                                (isActive || isCompleted) && "border-white"
                              )}
                              style={{
                                backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent 1.5px, ${color} 1.5px, ${color} 3px)`,
                              }}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
