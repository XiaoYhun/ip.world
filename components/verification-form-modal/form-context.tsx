import { createContext, useContext, ReactNode } from "react"
import { useForm, UseFormReturn } from "react-hook-form"
import { VerificationFormData, DEFAULT_FORM_VALUES } from "./form-types"

interface VerificationFormContextType {
  form: UseFormReturn<VerificationFormData>
}

const VerificationFormContext = createContext<VerificationFormContextType | null>(null)

export function VerificationFormProvider({ children }: { children: ReactNode }) {
  const form = useForm<VerificationFormData>({
    defaultValues: DEFAULT_FORM_VALUES as VerificationFormData,
    mode: "onChange",
  })

  return (
    <VerificationFormContext.Provider value={{ form }}>
      {children}
    </VerificationFormContext.Provider>
  )
}

export function useVerificationForm() {
  const context = useContext(VerificationFormContext)
  if (!context) {
    throw new Error("useVerificationForm must be used within VerificationFormProvider")
  }
  return context.form
}
