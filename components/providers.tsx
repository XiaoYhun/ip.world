"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Suspense, useEffect, useState } from "react"
import { env } from "@/config"

import { Web3Stack } from "./web3-stack"

interface ProvidersProps {
  children: React.ReactNode
  referralCode?: string
}

interface Wallet {
  key: string
  name: string
  isInstalledOnBrowser: boolean
  walletConnector: unknown
  chainGroup?: string
  group?: string
  injectedConfig?: Record<string, unknown>[]
  walletGroup?: string
}

export default function Providers({ children }: ProvidersProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const environmentId = env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false, // Don't refetch on window focus to reduce requests
        refetchOnMount: true,
        refetchOnReconnect: true,
        refetchInterval: false, // Disable automatic refetching by default
        staleTime: 1000 * 60 * 2, // 2 minutes - data considered fresh
        gcTime: 1000 * 60 * 10, // 10 minutes - cache time

        // Enhanced retry configuration to prevent error caching
        retry: (failureCount, error) => {
          // Don't retry on final attempt
          if (failureCount >= 3) return false

          const errorMessage = error?.message?.toLowerCase() || ""

          // Don't retry on specific 4xx client errors (except timeout and rate limit)
          if (
            errorMessage.includes("400") ||
            errorMessage.includes("401") ||
            errorMessage.includes("403") ||
            errorMessage.includes("404") ||
            errorMessage.includes("410")
          ) {
            return false
          }

          // DO retry on timeout, rate limit, and server errors
          if (
            errorMessage.includes("408") || // Request timeout
            errorMessage.includes("429") || // Rate limit
            errorMessage.includes("5") || // 5xx server errors
            errorMessage.includes("timeout") ||
            errorMessage.includes("network") ||
            errorMessage.includes("fetch")
          ) {
            return true
          }

          // Default to retry once for unknown errors
          return failureCount < 1
        },
        retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 6000), // Max 6s delay
      },
    },
  })

  // Custom wallet filter: Rabby, OKX, Bitget, MetaMask, Coinbase, then others
  const customWalletFilter = (wallets: Wallet[]) => {
    const filtered = wallets.filter((wallet: Wallet) => {
      if (wallet.chainGroup === "solana") return true
      return !wallet.key.toLowerCase().includes("phantomevm")
    })

    const priorities: Record<string, number> = {
      rabby: 2,
      bitget: 3,
      okx: 4,
      metamask: 1,
      coinbase: 5,
    }

    return filtered.sort((a: Wallet, b: Wallet) => {
      const getWalletPriority = (wallet: Wallet): number => {
        const key = wallet.key.toLowerCase()

        for (const [walletName, priority] of Object.entries(priorities)) {
          if (key.includes(walletName)) return priority
        }

        return 100
      }

      return getWalletPriority(a) - getWalletPriority(b)
    })
  }

  if (!isClient) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-black" />
      </QueryClientProvider>
    )
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <Web3Stack environmentId={environmentId || ""} queryClient={queryClient} customWalletFilter={customWalletFilter}>
        {children}
      </Web3Stack>
    </Suspense>
  )
}
