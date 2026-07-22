"use client"

import { useCallback, useMemo, useRef } from "react"
import { useDynamicContext, useSwitchWallet, useUserWallets } from "@dynamic-labs/sdk-react-core"
import { type Config, useConfig } from "wagmi"

const WALLET_PROVISION_TIMEOUT_MS = 8000
const WALLET_PROVISION_POLL_MS = 200
const WAGMI_SYNC_TIMEOUT_MS = 5000
const WAGMI_SYNC_POLL_MS = 50

function getWagmiActiveAddress(config: Config): string | undefined {
  if (!config.state.current) {
    return undefined
  }

  const connection = config.state.connections.get(config.state.current)
  return connection?.accounts?.[0]?.toLowerCase()
}

async function waitForWagmiSync(config: Config, targetAddress: string, timeoutMs: number) {
  const target = targetAddress.toLowerCase()
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    if (getWagmiActiveAddress(config) === target) {
      return true
    }

    await new Promise((resolve) => setTimeout(resolve, WAGMI_SYNC_POLL_MS))
  }

  return false
}

interface EnsureEmbeddedWalletOptions {
  requireWagmiSync?: boolean
}

/**
 * Ensures the Dynamic primary wallet is the embedded EVM wallet.
 *
 * Still needed for operations that go through wagmi's active connector
 * (e.g. signTypedData for Snapshot proposals) and for keeping the
 * primary wallet display correct.
 *
 * On-chain transactions (writeContract, sendTransaction) now bypass wagmi
 * entirely via useEmbeddedWriteContract / useEmbeddedSendTransaction,
 * so this hook is no longer on the critical path for those.
 */
export function useEnsureEmbeddedWallet() {
  const { primaryWallet, sdkHasLoaded } = useDynamicContext()
  const userWallets = useUserWallets()
  const switchWallet = useSwitchWallet()
  const wagmiConfig = useConfig()
  const switchingRef = useRef(false)
  const embeddedWallet = useMemo(
    () => userWallets.find((wallet) => wallet.connector?.isEmbeddedWallet && wallet.address?.startsWith("0x")),
    [userWallets]
  )

  const isEmbeddedWalletActive =
    !!primaryWallet?.connector?.isEmbeddedWallet &&
    primaryWallet?.address?.startsWith("0x")

  const ensureEmbeddedWallet = useCallback(async (options?: EnsureEmbeddedWalletOptions) => {
    const requireWagmiSync = options?.requireWagmiSync ?? false

    const switchToEmbeddedWallet = async (walletId: string, walletAddress: string) => {
      switchingRef.current = true
      try {
        await switchWallet(walletId)

        if (!requireWagmiSync) {
          return
        }

        const synced = await waitForWagmiSync(wagmiConfig, walletAddress, WAGMI_SYNC_TIMEOUT_MS)

        if (!synced) {
          console.warn("useEnsureEmbeddedWallet: wagmi did not sync to embedded wallet within timeout")
        }
      } finally {
        switchingRef.current = false
      }
    }

    if (isEmbeddedWalletActive) {
      const embeddedAddress = primaryWallet?.address?.toLowerCase()

      if (!requireWagmiSync) {
        return
      }

      if (embeddedAddress && getWagmiActiveAddress(wagmiConfig) === embeddedAddress) {
        return
      }

      if (embeddedAddress) {
        await waitForWagmiSync(wagmiConfig, embeddedAddress, WAGMI_SYNC_TIMEOUT_MS)
        return
      }
    }

    if (switchingRef.current) {
      if (!requireWagmiSync) {
        return
      }

      const embeddedAddress = embeddedWallet?.address
      if (embeddedAddress) {
        await waitForWagmiSync(wagmiConfig, embeddedAddress, WAGMI_SYNC_TIMEOUT_MS)
      }
      return
    }

    let evmWallet = embeddedWallet

    if (!evmWallet && sdkHasLoaded) {
      const deadline = Date.now() + WALLET_PROVISION_TIMEOUT_MS
      while (!evmWallet && Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, WALLET_PROVISION_POLL_MS))
        evmWallet = userWallets.find((wallet) => wallet.connector?.isEmbeddedWallet && wallet.address?.startsWith("0x"))
      }
    }

    if (!evmWallet) throw new Error("Embedded wallet not available")

    if (!requireWagmiSync) {
      if (!isEmbeddedWalletActive) {
        void switchToEmbeddedWallet(evmWallet.id, evmWallet.address)
      }
      return
    }

    await switchToEmbeddedWallet(evmWallet.id, evmWallet.address)
  }, [embeddedWallet, isEmbeddedWalletActive, primaryWallet?.address, sdkHasLoaded, switchWallet, userWallets, wagmiConfig])

  return {
    ensureEmbeddedWallet,
    isEmbeddedWalletActive,
  }
}
