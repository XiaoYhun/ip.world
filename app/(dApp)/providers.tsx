"use client"

import { Sheet } from "@/components/ui/sheet"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { MobileUIProvider } from "@/context/mobile-ui-context"
import { PaymentCurrencyProvider } from "@/context/payment-currency-context"
import { BalanceInflowWatcher } from "@/components/balance-inflow-watcher"
import { PortfolioProvider, usePortfolio } from "@/context/portfolio-context"
import { SearchDialogProvider } from "@/context/search-dialog-context"
import { SidebarProvider } from "@/context/sidebar-context"
import { TokenMetricsProvider } from "@/context/token-metrics-context"
import PerformanceTracker from "@/components/performance-tracker"
import Portfolio from "@/components/portfolio/portfolio"
import Providers from "@/components/providers"

function PortfolioSheet({ children }: { children: React.ReactNode }) {
  const { isOpen, setOpen } = usePortfolio()
  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      {children}
      <Portfolio />
    </Sheet>
  )
}

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <TokenMetricsProvider>
        <PaymentCurrencyProvider>
          <BalanceInflowWatcher />
          <PortfolioProvider>
            <TooltipProvider>
              <SearchDialogProvider>
                <MobileUIProvider>
                  <PortfolioSheet>
                    <SidebarProvider>
                      {children}
                      <Toaster richColors />
                      <PerformanceTracker />
                    </SidebarProvider>
                  </PortfolioSheet>
                </MobileUIProvider>
              </SearchDialogProvider>
            </TooltipProvider>
          </PortfolioProvider>
        </PaymentCurrencyProvider>
      </TokenMetricsProvider>
    </Providers>
  )
}
