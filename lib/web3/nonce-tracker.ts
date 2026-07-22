import type { Address, PublicClient } from "viem"
import { rpcManager } from "./rpc-manager"

interface NonceState {
  /** Next nonce to assign (may be ahead of confirmed) */
  pending: number
  /** Highest confirmed nonce + 1 */
  confirmed: number
  /** Whether we've synced from chain at least once */
  initialized: boolean
}

class NonceTracker {
  private state = new Map<string, NonceState>()

  private key(address: Address): string {
    return address.toLowerCase()
  }

  /**
   * Sync the nonce for an address from chain. Uses the healthiest RPC.
   * Called automatically on first use, or manually after a nonce error.
   */
  async sync(address: Address, client?: PublicClient): Promise<void> {
    const rpc = client ?? rpcManager.getHealthyClient()
    const onChainNonce = await rpc.getTransactionCount({
      address,
      blockTag: "pending",
    })
    const k = this.key(address)
    const existing = this.state.get(k)

    if (existing && existing.pending > onChainNonce) {
      // We have pending txs the chain hasn't seen yet — keep our higher pending count
      existing.confirmed = onChainNonce
      existing.initialized = true
    } else {
      this.state.set(k, {
        pending: onChainNonce,
        confirmed: onChainNonce,
        initialized: true,
      })
    }
  }

  /**
   * Get the next nonce for an address and increment the pending counter.
   * Initializes from chain on first call per address.
   */
  async nextNonce(address: Address): Promise<number> {
    const k = this.key(address)
    let entry = this.state.get(k)

    if (!entry || !entry.initialized) {
      await this.sync(address)
      entry = this.state.get(k)!
    }

    const nonce = entry.pending
    entry.pending = nonce + 1
    return nonce
  }

  /**
   * Mark a nonce as confirmed. Advances the confirmed watermark
   * if this is the next expected confirmation.
   */
  confirm(address: Address, nonce: number): void {
    const k = this.key(address)
    const entry = this.state.get(k)
    if (!entry) return

    if (nonce >= entry.confirmed) {
      entry.confirmed = nonce + 1
    }
  }

  /**
   * Release a nonce that was never broadcast (e.g., signing failed).
   * Only safe if it's the most recently allocated nonce.
   */
  release(address: Address, nonce: number): void {
    const k = this.key(address)
    const entry = this.state.get(k)
    if (!entry) return

    if (entry.pending === nonce + 1) {
      entry.pending = nonce
    }
  }

  /**
   * Reset nonce state for an address, forcing re-sync from chain on next use.
   */
  async reset(address: Address): Promise<void> {
    this.state.delete(this.key(address))
    await this.sync(address)
  }

  /** Visible for debugging / monitoring */
  getState(address: Address): NonceState | undefined {
    return this.state.get(this.key(address))
  }
}

export const nonceTracker = new NonceTracker()
