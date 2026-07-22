import { Button } from "@/components/ui/button"
import { VERIFICATION_STEP } from "./steps"
import IntroScreen from "./screens/intro"
import IPRelationshipScreen from "./screens/relationship-to-ip"
import IPInformationReasoningScreen from "./screens/ip-information-reasoning"
import IPInformationLinkSupportScreen from "./screens/ip-information-link-support"
import RightsSocialsScreen from "./screens/rights-socials"
import TermsAndConditionsScreen from "./screens/terms-and-conditions"
import { Ip } from "@/types/ip"
import { useCallback, useMemo, useState } from "react"
import SubmitSuccessScreen from "./screens/submit-success"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { isAddress } from "viem"
import { useVerificationForm } from "./form-context"
import { useFormSubmission } from "./hooks/use-form-submission"
export default function RightContent({
  step,
  setStep,
  ip,
  onClose,
}: {
  step: VERIFICATION_STEP
  setStep: (step: VERIFICATION_STEP) => void
  ip: Ip
  onClose: () => void
}) {
  const form = useVerificationForm()
  const { submit, loading, error } = useFormSubmission()
  const [selectedRights, setSelectedRights] = useState<string[]>([])
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [eligibilityAttempted, setEligibilityAttempted] = useState(false)
  const [payoutAttempted, setPayoutAttempted] = useState(false)

  const toggleRight = useCallback(
    (key: string) => {
      setSelectedRights((prev) => {
        const newValue = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
        form.setValue("selected_rights", newValue)
        return newValue
      })
    },
    [form]
  )

  const toggleKey = useCallback(
    (key: string) => {
      setSelectedKeys((prev) => {
        const newValue = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
        form.setValue("verification_methods", newValue as ("social" | "ip-rights")[])
        return newValue
      })
    },
    [form]
  )

  const handleSubmit = useCallback(async () => {
    try {
      await submit(form.getValues(), ip.id)
      setStep(VERIFICATION_STEP.SUBMIT_SUCCESS)
    } catch (err) {
      console.error("Form submission error:", err)
    }
  }, [form, submit, setStep, ip.id])

  const STEPS = useMemo(
    () => ({
      [VERIFICATION_STEP.INTRO]: <IntroScreen ip={ip} />,
      [VERIFICATION_STEP.TOKEN_ELIGIBILITY]: <IPInformationReasoningScreen ip={ip} attempted={eligibilityAttempted} />,
      [VERIFICATION_STEP.IP_INFORMATION_LINK_SUPPORT]: <IPInformationLinkSupportScreen ip={ip} />,
      [VERIFICATION_STEP.RELATIONSHIP_TO_IP]: <IPRelationshipScreen ip={ip} payoutAttempted={payoutAttempted} />,
      [VERIFICATION_STEP.IP_RIGHTS]: (
        <RightsSocialsScreen
          ip={ip}
          selectedRights={selectedRights}
          onSelectRight={toggleRight}
          selectedKeys={selectedKeys}
          onSelectKey={toggleKey}
        />
      ),
      [VERIFICATION_STEP.TERMS_AND_CONDITIONS]: <TermsAndConditionsScreen />,
      [VERIFICATION_STEP.SUBMIT_SUCCESS]: <SubmitSuccessScreen />,
    }),
    [selectedRights, selectedKeys, ip, toggleRight, toggleKey, eligibilityAttempted, payoutAttempted]
  )

  const CurrentScreen = STEPS[step]

  return (
    <div className="flex h-full min-h-[640px] w-full flex-col justify-center gap-4 overflow-hidden">
      <motion.div className="flex w-[790px] flex-1 flex-col justify-center">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            {CurrentScreen}
          </motion.div>
        </AnimatePresence>
      </motion.div>
      {step === VERIFICATION_STEP.SUBMIT_SUCCESS ? (
        <div className="flex w-full justify-end self-end">
          <Button variant="outline" className="h-[50px] rounded-full px-6 py-4" onClick={onClose}>
            <div className="flex flex-nowrap items-center gap-2 text-base font-semibold">
              <span>Exit</span>
            </div>
          </Button>
        </div>
      ) : (
        <div className="flex w-full justify-between self-end">
          <Button
            variant="outline"
            className="h-[50px] rounded-full px-6 py-4"
            onClick={() => {
              setStep(step - 1)
            }}
            disabled={step === VERIFICATION_STEP.INTRO}
          >
            <div className="flex flex-nowrap items-center gap-2 text-base font-semibold">
              <ArrowLeft />
              <span>Back</span>
            </div>
          </Button>
          <Button
            variant="outline"
            className="h-[50px] rounded-full px-6 py-4"
            onClick={() => {
              if (step === VERIFICATION_STEP.TOKEN_ELIGIBILITY && !form.getValues("ip_description_reasoning")?.trim()) {
                setEligibilityAttempted(true)
                return
              }
              if (step === VERIFICATION_STEP.RELATIONSHIP_TO_IP && ip.type === "creator") {
                const selectedRole = form.getValues("identity_role") || "creator"
                if (selectedRole === "creator" && form.formState.errors.identity_referral_code) return
                const useMyAcct = form.getValues("identity_use_my_account") ?? true
                if (!useMyAcct) {
                  const addr = form.getValues("identity_fund_management_address")?.trim() || ""
                  if (!addr || !isAddress(addr)) {
                    setPayoutAttempted(true)
                    return
                  }
                }
              }
              if (step === VERIFICATION_STEP.TERMS_AND_CONDITIONS) {
                handleSubmit()
              } else {
                setStep(step + 1)
              }
            }}
            disabled={
              step === VERIFICATION_STEP.TERMS_AND_CONDITIONS &&
                (loading || !form.watch("terms_launchpad_agreed") || !form.watch("terms_pil_agreed"))
            }
          >
            <div className="flex flex-nowrap items-center gap-2 text-base font-semibold">
              {step === VERIFICATION_STEP.TERMS_AND_CONDITIONS ? (
                <>
                  {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : null}
                  <span>{loading ? "Submitting..." : "Submit"}</span>
                </>
              ) : (
                <>
                  <span>Next</span> <ArrowRight />
                </>
              )}
            </div>
          </Button>
        </div>
      )}
    </div>
  )
}
