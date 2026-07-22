"use client"

import { createContext, ReactNode, useCallback, useContext, useState } from "react"
import { type PaymentCurrency } from "@/config/relay-chains"

const STORAGE_KEY = "ip.world:payment-currency"
const VALID_CURRENCIES: PaymentCurrency[] = ["IP", "SOL", "USDC"]

function readPersistedCurrency(): PaymentCurrency {
  if (typeof window === "undefined") return "IP"
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && VALID_CURRENCIES.includes(stored as PaymentCurrency)) {
      return stored as PaymentCurrency
    }
  } catch { /* SSR or storage unavailable */ }
  return "IP"
}

interface PaymentCurrencyContextType {
  paymentCurrency: PaymentCurrency
  setPaymentCurrency: (currency: PaymentCurrency) => void
}

const PaymentCurrencyContext = createContext<PaymentCurrencyContextType | undefined>(undefined)

export function PaymentCurrencyProvider({ children }: { children: ReactNode }) {
  const [paymentCurrency, setPaymentCurrencyState] = useState<PaymentCurrency>(readPersistedCurrency)

  const setPaymentCurrency = useCallback((currency: PaymentCurrency) => {
    setPaymentCurrencyState(currency)
    try { localStorage.setItem(STORAGE_KEY, currency) } catch { /* noop */ }
  }, [])

  return (
    <PaymentCurrencyContext.Provider value={{ paymentCurrency, setPaymentCurrency }}>
      {children}
    </PaymentCurrencyContext.Provider>
  )
}

export function usePaymentCurrency() {
  const context = useContext(PaymentCurrencyContext)
  if (context === undefined) {
    throw new Error("usePaymentCurrency must be used within a PaymentCurrencyProvider")
  }
  return context
}
