"use client"

import { useEmbeddedWallets } from "./use-embedded-wallets"

/**
 * Account hook that always returns the Dynamic embedded EVM wallet address.
 * Falls back to primaryWallet only briefly while the embedded wallet is being set up.
 * `isReady` is true when the embedded wallet signer is available. Flows that
 * still depend on the active connector must call `ensureEmbeddedWallet()`
 * immediately before signing.
 */
export function useAccount() {
  const { evmAddress, primaryWallet, isReady } = useEmbeddedWallets()

  const fallbackEvm =
    primaryWallet?.address?.startsWith("0x") ? primaryWallet.address : null

  const address = (evmAddress ?? fallbackEvm ?? undefined) as `0x${string}` | undefined
  const isConnected = !!address

  return {
    address,
    isConnected,
    isReady,
    isConnecting: false,
    isReconnecting: false,
    isDisconnected: !isConnected,
    status: isConnected ? ("connected" as const) : ("disconnected" as const),
  }
}
