"use client"

import { useEffect, useRef } from "react"
import { useDynamicContext, useDynamicWaas, ChainEnum, useUserWallets } from "@dynamic-labs/sdk-react-core"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

/**
 * Ensures every authenticated user has Dynamic WaaS (MPC) embedded wallets
 * for both EVM (Story) and Solana chains.
 *
 * Flow on each login:
 *  1. Look at `useUserWallets()` (source of truth for verified credentials).
 *  2. If EVM and Solana embedded wallets are both present, we're done.
 *  3. Otherwise call `createWalletAccount` for the missing chain(s) and poll
 *     `useUserWallets()` until the new wallet appears (or timeout).
 *  4. Repeat up to MAX_ATTEMPTS times with exponential backoff between
 *     attempts. On final failure, log the user out and surface a toast
 *     asking them to log back in.
 *
 * We poll `useUserWallets()` (not just the `createWalletAccount` promise)
 * because Dynamic's SDK propagates the new verified credential asynchronously
 * after the provisioning call resolves. The Dynamic team asked us to remove
 * the previous `onSignIn` manual creation, so this polling + retry loop is
 * the defensive path for the cases where the automatic provisioning doesn't
 * complete before the user starts using the app.
 */

const MAX_ATTEMPTS = 5
const WAIT_FOR_WALLETS_MS = 2000
const POLL_INTERVAL_MS = 250
const BASE_BACKOFF_MS = 500

type WalletLike = ReturnType<typeof useUserWallets>[number]

function hasEvmEmbedded(wallets: WalletLike[]): boolean {
  return wallets.some((w) => w.connector?.isEmbeddedWallet && w.address?.startsWith("0x") === true)
}

function hasSolEmbedded(wallets: WalletLike[]): boolean {
  return wallets.some(
    (w) => w.connector?.isEmbeddedWallet && !!w.address && !w.address.startsWith("0x")
  )
}

function computeMissingChains(wallets: WalletLike[]): ChainEnum[] {
  const missing: ChainEnum[] = []
  if (!hasEvmEmbedded(wallets)) missing.push(ChainEnum.Evm)
  if (!hasSolEmbedded(wallets)) missing.push(ChainEnum.Sol)
  return missing
}

export function EmbeddedWalletProvisioner() {
  const { user, handleLogOut } = useDynamicContext()
  const { createWalletAccount } = useDynamicWaas()
  const userWallets = useUserWallets()
  const queryClient = useQueryClient()

  // Live reference to the latest wallet list so the async loop can re-check
  // without being captured in a stale closure.
  const walletsRef = useRef(userWallets)
  walletsRef.current = userWallets

  const runningRef = useRef(false)
  const doneRef = useRef(false)

  useEffect(() => {
    if (!user) {
      runningRef.current = false
      doneRef.current = false
      return
    }

    if (doneRef.current || runningRef.current) return

    if (computeMissingChains(walletsRef.current).length === 0) {
      doneRef.current = true
      return
    }

    runningRef.current = true
    let cancelled = false

    const pollForMissingResolved = async () => {
      const deadline = Date.now() + WAIT_FOR_WALLETS_MS
      while (Date.now() < deadline && !cancelled) {
        if (computeMissingChains(walletsRef.current).length === 0) return true
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
      }
      return computeMissingChains(walletsRef.current).length === 0
    }

    const run = async () => {
      try {
        for (let attempt = 1; attempt <= MAX_ATTEMPTS && !cancelled; attempt++) {
          const chains = computeMissingChains(walletsRef.current)
          if (chains.length === 0) {
            doneRef.current = true
            return
          }

          try {
            await createWalletAccount(chains)
          } catch (err) {
            console.error(`[EmbeddedWalletProvisioner] createWalletAccount attempt ${attempt} failed:`, err)
          }

          // Drop downstream caches that depend on wallet presence while we
          // wait for the SDK to surface the new verified credential.
          queryClient.invalidateQueries({ queryKey: ["user"] })

          const resolved = await pollForMissingResolved()
          if (resolved) {
            doneRef.current = true
            return
          }

          if (attempt < MAX_ATTEMPTS && !cancelled) {
            await new Promise((r) => setTimeout(r, BASE_BACKOFF_MS * Math.pow(2, attempt - 1)))
          }
        }

        if (cancelled) return

        if (computeMissingChains(walletsRef.current).length > 0) {
          console.error("[EmbeddedWalletProvisioner] exhausted retries; logging user out")
          toast.error("We couldn't finish setting up your wallet. Please log in again.")
          try {
            await handleLogOut()
          } catch (err) {
            console.error("[EmbeddedWalletProvisioner] handleLogOut failed:", err)
          }
        } else {
          doneRef.current = true
        }
      } finally {
        runningRef.current = false
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [user, createWalletAccount, handleLogOut, queryClient])

  return null
}
