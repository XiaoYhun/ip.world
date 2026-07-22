"use client"

import { createContext, ReactNode, useContext, useState } from "react"

export enum CreateFlowStep {
  SEARCH = 0,
  CREATE = 1,
}

// Define context type
interface CreateFlowContextType {
  step: CreateFlowStep
  setStep: (step: CreateFlowStep) => void
}

// Create the context
const CreateFlowContext = createContext<CreateFlowContextType | undefined>(undefined)

// Create provider
export function CreateFlowContextProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState<CreateFlowStep>(CreateFlowStep.SEARCH)

  return <CreateFlowContext.Provider value={{ step, setStep }}>{children}</CreateFlowContext.Provider>
}

// Hook to use context
export function useCreateFlowContext() {
  const context = useContext(CreateFlowContext)
  if (!context) {
    throw new Error("useCreateFlowContext must be used within a CreateFlowContextProvider")
  }
  return context
}
