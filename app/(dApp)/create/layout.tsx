"use client"
import React from "react"
import { CreateFlowContextProvider } from "./_context/create-flow-context"

const CreateLayout = ({ children }: { children: React.ReactNode }) => {
  return <CreateFlowContextProvider>{children}</CreateFlowContextProvider>
}

export default CreateLayout
