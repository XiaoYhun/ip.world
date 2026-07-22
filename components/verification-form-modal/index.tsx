import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Ip } from "@/types/ip"
import { ReactNode, useState } from "react"
import LeftNavigateBar from "./left-navigate-bar"
import RightContent from "./right-content"
import { VERIFICATION_STEP } from "./steps"
import { VerificationFormProvider } from "./form-context"

export default function VerificationFormModal({ trigger, ip }: { trigger: ReactNode; ip: Ip }) {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(VERIFICATION_STEP.INTRO)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="bg-panel! flex w-full! min-w-fit gap-4 rounded-[24px] border-neutral-600 p-6">
        <VisuallyHidden><DialogTitle>IP Verification</DialogTitle></VisuallyHidden>
        <VerificationFormProvider>
          <div className="w-[250px]">
            <LeftNavigateBar step={step} setStep={setStep} ip={ip} />
          </div>
          <div className="mt-7 flex-1">
            <RightContent step={step} setStep={setStep} ip={ip} onClose={() => setIsOpen(false)} />
          </div>
        </VerificationFormProvider>
      </DialogContent>
    </Dialog>
  )
}
