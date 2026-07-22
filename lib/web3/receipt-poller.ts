import type { Hash, TransactionReceipt, PublicClient } from "viem"
import { rpcManager } from "./rpc-manager"

export class ReceiptTimeoutError extends Error {
  constructor(
    public readonly hash: Hash,
    public readonly timeoutMs: number,
  ) {
    super(`Receipt not found for ${hash} after ${timeoutMs}ms`)
    this.name = "ReceiptTimeoutError"
  }
}

export interface ReceiptPollerOptions {
  pollingIntervalMs?: number
  timeoutMs?: number
  confirmations?: number
  /** Delay before the first poll — avoids wasted calls before a block can be mined */
  initialDelayMs?: number
}

const DEFAULTS = {
  pollingIntervalMs: 200,
  timeoutMs: 60_000,
  confirmations: 1,
} as const

const PREFIX = "[receipt-poller]"

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function tryGetReceipt(
  client: PublicClient,
  hash: Hash,
): Promise<TransactionReceipt | null> {
  try {
    const receipt = await client.getTransactionReceipt({ hash })
    rpcManager.recordSuccess(client)
    return receipt
  } catch {
    rpcManager.recordFailure(client)
    return null
  }
}

/**
 * Poll for a transaction receipt across primary and fallback RPCs.
 * Returns as soon as the receipt is found with enough confirmations.
 * Throws ReceiptTimeoutError if the timeout expires.
 */
export async function pollForReceipt(
  hash: Hash,
  options?: ReceiptPollerOptions,
): Promise<TransactionReceipt> {
  const interval = options?.pollingIntervalMs ?? DEFAULTS.pollingIntervalMs
  const timeout = options?.timeoutMs ?? DEFAULTS.timeoutMs
  const confirmations = options?.confirmations ?? DEFAULTS.confirmations
  const initialDelay = options?.initialDelayMs ?? 0
  const deadline = Date.now() + timeout

  if (initialDelay > 0) {
    await sleep(Math.min(initialDelay, timeout))
  }

  let pollCount = 0

  while (Date.now() < deadline) {
    pollCount++
    const primary = rpcManager.getPrimaryClient()
    const receipt = await tryGetReceipt(primary, hash)

    if (receipt) {
      console.log(PREFIX, `Receipt found on ${rpcManager.getLabel(primary)} (poll #${pollCount}, block=${receipt.blockNumber})`)
      if (confirmations <= 1) return receipt

      const currentBlock = await primary
        .getBlockNumber()
        .catch(() => null)
      if (
        currentBlock !== null &&
        currentBlock - receipt.blockNumber + BigInt(1) >= BigInt(confirmations)
      ) {
        return receipt
      }
    }

    if (!receipt) {
      const fallback = rpcManager.getFallbackClient()
      if (fallback) {
        const fallbackReceipt = await tryGetReceipt(fallback, hash)
        if (fallbackReceipt) {
          console.log(PREFIX, `Receipt found on ${rpcManager.getLabel(fallback)} (poll #${pollCount}, block=${fallbackReceipt.blockNumber})`)
          if (confirmations <= 1) return fallbackReceipt

          const currentBlock = await fallback
            .getBlockNumber()
            .catch(() => null)
          if (
            currentBlock !== null &&
            currentBlock - fallbackReceipt.blockNumber + BigInt(1) >=
              BigInt(confirmations)
          ) {
            return fallbackReceipt
          }
        }
      }
    }

    const remaining = deadline - Date.now()
    if (remaining <= 0) break
    await sleep(Math.min(interval, remaining))
  }

  console.warn(PREFIX, `Timeout after ${pollCount} polls (${timeout}ms) for ${hash}`)
  throw new ReceiptTimeoutError(hash, timeout)
}
