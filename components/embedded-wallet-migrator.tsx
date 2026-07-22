"use client"

import { useEffect } from "react"
import { useDynamicContext } from "@dynamic-labs/sdk-react-core"
import { useEmbeddedWallets } from "@/hooks/use-embedded-wallets"
import { useEnsureEmbeddedWallet } from "@/hooks/use-ensure-embedded-wallet"

const MAX_RETRIES = 10
const BASE_DELAY_MS = 400
const MAX_BACKOFF_EXPONENT = 4

export function EmbeddedWalletMigrator() {
  const { user } = useDynamicContext()
  const { evmWallet, isEmbeddedPrimaryWallet, isWagmiSyncedToEmbeddedWallet } = useEmbeddedWallets()
  const { ensureEmbeddedWallet } = useEnsureEmbeddedWallet()

  useEffect(() => {
    if (!user) {
      return
    }

    if (!evmWallet) return
    if (isEmbeddedPrimaryWallet && isWagmiSyncedToEmbeddedWallet) return

    let cancelled = false

    let attempt = 0
    const trySwitch = async () => {
      while (attempt < MAX_RETRIES && !cancelled) {
        try {
          await ensureEmbeddedWallet({ requireWagmiSync: true })
          return
        } catch {
          attempt += 1
          if (attempt < MAX_RETRIES && !cancelled) {
            await new Promise((r) =>
              setTimeout(r, BASE_DELAY_MS * Math.pow(2, Math.min(attempt, MAX_BACKOFF_EXPONENT)))
            )
          }
        }
      }
      if (!cancelled) {
        console.error("EmbeddedWalletMigrator: exhausted retries switching to embedded wallet")
      }
    }

    void trySwitch()

    return () => {
      cancelled = true
    }
  }, [ensureEmbeddedWallet, evmWallet, isEmbeddedPrimaryWallet, isWagmiSyncedToEmbeddedWallet, user])

  return null
}
