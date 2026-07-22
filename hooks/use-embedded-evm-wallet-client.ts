"use client"

import { useCallback, useEffect, useMemo } from "react"
import { useUserWallets } from "@dynamic-labs/sdk-react-core"
import type { WalletClient } from "viem"

type EmbeddedEvmWallet = {
  id: string
  address?: string
  connector?: {
    isEmbeddedWallet?: boolean
  }
  getWalletClient: () => Promise<WalletClient | null>
}

let cachedWalletKey: string | undefined
let cachedWalletClient: WalletClient | undefined
let cachedWalletClientPromise: Promise<WalletClient> | undefined

function getWalletKey(wallet: EmbeddedEvmWallet) {
  return `${wallet.id}:${wallet.address?.toLowerCase() ?? ""}`
}

/** Clears cached viem wallet client so the next resolve picks up updated chain/RPC (e.g. after Story RPC override). */
export function clearEmbeddedWalletClientCache() {
  cachedWalletKey = undefined
  cachedWalletClient = undefined
  cachedWalletClientPromise = undefined
}

export function useEmbeddedEvmWalletClient() {
  const userWallets = useUserWallets()

  const embeddedWallet = useMemo(
    () =>
      userWallets.find((wallet) => wallet.connector?.isEmbeddedWallet && wallet.address?.startsWith("0x")) as
        | EmbeddedEvmWallet
        | undefined,
    [userWallets]
  )
  const embeddedWalletAddress = embeddedWallet?.address

  useEffect(() => {
    if (!embeddedWallet) {
      clearEmbeddedWalletClientCache()
      return
    }

    if (cachedWalletKey && cachedWalletKey !== getWalletKey(embeddedWallet)) {
      clearEmbeddedWalletClientCache()
    }
  }, [embeddedWallet])

  const getEmbeddedWalletClient = useCallback(async () => {
    if (!embeddedWallet) {
      throw new Error("Embedded EVM wallet not found")
    }

    const walletKey = getWalletKey(embeddedWallet)

    if (cachedWalletClient && cachedWalletKey === walletKey) {
      return cachedWalletClient
    }

    if (cachedWalletClientPromise && cachedWalletKey === walletKey) {
      return cachedWalletClientPromise
    }

    cachedWalletKey = walletKey
    cachedWalletClientPromise = embeddedWallet.getWalletClient().then((client) => {
      if (!client) {
        throw new Error("Embedded wallet client not available")
      }

      cachedWalletClient = client
      return client
    }).finally(() => {
      if (cachedWalletKey === walletKey) {
        cachedWalletClientPromise = undefined
      }
    })

    return cachedWalletClientPromise
  }, [embeddedWallet])

  const warmEmbeddedWalletClient = useCallback(() => {
    void getEmbeddedWalletClient().catch(() => {})
  }, [getEmbeddedWalletClient])

  return {
    embeddedWalletAddress,
    getEmbeddedWalletClient,
    warmEmbeddedWalletClient,
  }
}
