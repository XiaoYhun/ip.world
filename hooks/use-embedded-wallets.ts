"use client"

import { useMemo } from "react"
import { useDynamicContext, useIsLoggedIn, useUserWallets } from "@dynamic-labs/sdk-react-core"
import { useAccount as useWagmiAccount } from "wagmi"

/**
 * Central hook for accessing both embedded wallets (EVM + Solana).
 *
 * The EVM embedded wallet is used for all Story chain operations and is
 * the canonical user identity. The Solana embedded wallet is used only as
 * a funding source for cross-chain swaps via Relay.
 */
export function useEmbeddedWallets() {
  const { primaryWallet, sdkHasLoaded } = useDynamicContext()
  const isLoggedIn = useIsLoggedIn()
  const userWallets = useUserWallets()
  const { address: wagmiAddress } = useWagmiAccount()

  const evmWallet = useMemo(
    () => userWallets.find((w) => w.connector?.isEmbeddedWallet && w.address?.startsWith("0x")),
    [userWallets]
  )

  const solanaWallet = useMemo(
    () => userWallets.find((w) => w.connector?.isEmbeddedWallet && !w.address?.startsWith("0x")),
    [userWallets]
  )

  const evmAddress = (evmWallet?.address ?? undefined) as `0x${string}` | undefined
  const solanaAddress = solanaWallet?.address ?? undefined

  const isEmbeddedPrimaryWallet =
    !!primaryWallet?.connector?.isEmbeddedWallet &&
    primaryWallet?.address?.startsWith("0x") &&
    primaryWallet.address.toLowerCase() === evmAddress?.toLowerCase()

  const isWagmiSyncedToEmbeddedWallet = !!evmAddress && wagmiAddress === evmAddress.toLowerCase()

  // Transaction flows can sign directly with the embedded wallet client, so the
  // UI should become actionable as soon as the embedded EVM wallet exists.
  // `ensureEmbeddedWallet` still upgrades Dynamic + wagmi state before any flow
  // that depends on the active connector.
  const isReady =
    sdkHasLoaded &&
    (!isLoggedIn || !!evmWallet)

  return {
    evmWallet,
    evmAddress,
    solanaWallet,
    solanaAddress,
    isReady,
    isEmbeddedPrimaryWallet,
    isWagmiSyncedToEmbeddedWallet,
    sdkHasLoaded,
    isLoggedIn,
    primaryWallet,
  }
}
