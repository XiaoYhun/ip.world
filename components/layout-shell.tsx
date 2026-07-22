"use client"

import { ReactNode } from "react"
import Navbar from "@/components/navigation/navbar"
import MobileNavbar from "@/components/navigation/mobile-navbar"
import MarqueeWrapper from "@/components/navigation/MarqueeWrapper"
import AppSidebar from "@/components/sidebar/app-sidebar"
import Footer from "@/components/ui/footer"
import { OnboardingDialog } from "@/components/onboarding/onboarding-dialog"
import { OnboardingTrigger } from "@/components/onboarding/onboarding-trigger"
import { Remix } from "@/types/remix"

type LayoutShellProps = {
  children: ReactNode
  trendingTokens: Remix[]
}

export function LayoutShell({ children, trendingTokens }: LayoutShellProps) {
  return (
    <>
      <div className="flex min-h-screen flex-col md:flex-row">
        <AppSidebar />
        <div className="relative flex w-full min-w-0 flex-1 flex-col md:w-[calc(100vw-57px)]">
          <Navbar />
          <MobileNavbar />

          <div className="flex flex-1 flex-col pt-[56px] pb-10 sm:pt-0">
            <MarqueeWrapper trendingTokens={trendingTokens} />
            {children}
          </div>
          <Footer />
        </div>
      </div>

      <OnboardingTrigger />
      <OnboardingDialog />
    </>
  )
}
