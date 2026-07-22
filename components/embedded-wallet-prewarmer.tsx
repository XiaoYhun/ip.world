"use client"

import { useEffect } from "react"
import { useEmbeddedEvmWalletClient } from "@/hooks/use-embedded-evm-wallet-client"

export function EmbeddedWalletPrewarmer() {
  const { embeddedWalletAddress, warmEmbeddedWalletClient } = useEmbeddedEvmWalletClient()

  useEffect(() => {
    if (!embeddedWalletAddress) {
      return
    }

    warmEmbeddedWalletClient()
  }, [embeddedWalletAddress, warmEmbeddedWalletClient])

  return null
}
