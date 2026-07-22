import {
  type Abi,
  type Address,
  type Hash,
  type TransactionReceipt,
  type WalletClient,
  serializeTransaction,
} from "viem"
import { rpcManager } from "./rpc-manager"
import { pollForReceipt, ReceiptTimeoutError } from "./receipt-poller"
import { deadLetterQueue } from "./dead-letter-queue"
import { extractTransactionErrorMessages } from "./transaction-errors"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PipelineOptions {
  maxRetries?: number
  retryBaseDelayMs?: number
  retryMaxDelayMs?: number
  receiptTimeoutMs?: number
  receiptPollIntervalMs?: number
  maxResubmits?: number
}

export interface SubmitContractTxParams {
  walletClient: WalletClient
  address: Address
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abi: any
  functionName: string
  args?: unknown[]
  value?: bigint
  gas?: bigint
}

export interface SubmitRawTxParams {
  walletClient: WalletClient
  to: Address
  data?: `0x${string}`
  value?: bigint
  gas?: bigint
}

export interface PipelineResult {
  receipt: TransactionReceipt
  hash: Hash
}

export interface OptimisticPipelineResult {
  hash: Hash
  receiptPromise: Promise<TransactionReceipt>
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULTS: Required<PipelineOptions> = {
  maxRetries: 3,
  retryBaseDelayMs: 2_000,
  retryMaxDelayMs: 10_000,
  receiptTimeoutMs: 12_000,
  receiptPollIntervalMs: 200,
  maxResubmits: 2,
}

// ---------------------------------------------------------------------------
// Error classification
// ---------------------------------------------------------------------------

function isUserRejection(error: unknown): boolean {
  const msgs = extractTransactionErrorMessages(error)
  const norm = msgs.join(" | ").toLowerCase()
  return (
    norm.includes("user rejected") ||
    norm.includes("user denied") ||
    norm.includes("rejected the request") ||
    norm.includes("request rejected") ||
    norm.includes("4001")
  )
}

function isDeterministicFailure(error: unknown): boolean {
  const msgs = extractTransactionErrorMessages(error)
  const norm = msgs.join(" | ").toLowerCase()
  return (
    norm.includes("insufficient funds") ||
    norm.includes("insufficient balance") ||
    norm.includes("transfer amount exceeds balance") ||
    norm.includes("exceeds balance") ||
    norm.includes("execution reverted")
  )
}

function isAlreadyKnown(error: unknown): boolean {
  const msgs = extractTransactionErrorMessages(error)
  const norm = msgs.join(" | ").toLowerCase()
  return norm.includes("already known") || norm.includes("already imported")
}

function isNonceTooLow(error: unknown): boolean {
  const msgs = extractTransactionErrorMessages(error)
  const norm = msgs.join(" | ").toLowerCase()
  return norm.includes("nonce too low") || norm.includes("nonce has already been used")
}

function shouldNotRetry(error: unknown): boolean {
  return isUserRejection(error) || isDeterministicFailure(error)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function retryDelay(attempt: number, base: number, max: number): number {
  const exponential = base * Math.pow(2, attempt)
  const jitter = Math.random() * 1_000
  return Math.min(exponential + jitter, max)
}

const PREFIX = "[tx-pipeline]"

// ---------------------------------------------------------------------------
// Fallback re-broadcast: fetch signed tx from any RPC, re-send on fallback
// ---------------------------------------------------------------------------

/**
 * Fetch a pending/mined transaction, serialize it with its signature,
 * and re-broadcast on the fallback RPC. Returns the hash on success.
 */
async function rebroadcastOnFallback(hash: Hash): Promise<Hash | null> {
  const fallback = rpcManager.getFallbackClient()
  if (!fallback) {
    console.warn(PREFIX, "No fallback RPC configured, skipping re-broadcast")
    return null
  }

  console.log(PREFIX, `Re-broadcasting ${hash} on ${rpcManager.getLabel(fallback)}`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tx: any
  let fetchedFrom = "unknown"
  for (const client of rpcManager.getClientsInPriorityOrder()) {
    try {
      tx = await client.getTransaction({ hash })
      if (tx) {
        fetchedFrom = rpcManager.getLabel(client)
        break
      }
    } catch {
      // try next
    }
  }
  if (!tx || !tx.r || !tx.s) {
    console.warn(PREFIX, `Could not fetch signed tx ${hash} from any RPC`)
    return null
  }
  console.log(PREFIX, `Fetched signed tx from ${fetchedFrom} RPC (nonce=${tx.nonce}, type=${tx.type})`)

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let serialized: `0x${string}`

    // Build a signature that satisfies viem's Signature union type:
    // either { r, s, v } or { r, s, yParity }
    const r = tx.r as `0x${string}`
    const s = tx.s as `0x${string}`
    const sig =
      tx.yParity !== undefined && tx.yParity !== null
        ? { r, s, yParity: tx.yParity as number }
        : { r, s, v: BigInt(tx.v) }

    if (tx.type === "eip1559" || tx.maxFeePerGas !== undefined) {
      serialized = serializeTransaction(
        {
          type: "eip1559",
          to: tx.to,
          nonce: tx.nonce,
          gas: tx.gas,
          maxFeePerGas: tx.maxFeePerGas,
          maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
          value: tx.value,
          data: tx.input,
          chainId: tx.chainId,
          accessList: tx.accessList ?? [],
        },
        sig,
      )
    } else if (tx.type === "eip2930" || tx.accessList) {
      serialized = serializeTransaction(
        {
          type: "eip2930",
          to: tx.to,
          nonce: tx.nonce,
          gas: tx.gas,
          gasPrice: tx.gasPrice,
          value: tx.value,
          data: tx.input,
          chainId: tx.chainId,
          accessList: tx.accessList ?? [],
        },
        sig,
      )
    } else {
      serialized = serializeTransaction(
        {
          type: "legacy",
          to: tx.to,
          nonce: tx.nonce,
          gas: tx.gas,
          gasPrice: tx.gasPrice,
          value: tx.value,
          data: tx.input,
        },
        sig,
      )
    }

    const newHash = await fallback.sendRawTransaction({
      serializedTransaction: serialized,
    })
    rpcManager.recordSuccess(fallback)
    console.log(PREFIX, `Fallback RPC accepted tx → ${newHash}`)
    return newHash
  } catch (err) {
    rpcManager.recordFailure(fallback)
    if (isAlreadyKnown(err) || isNonceTooLow(err)) {
      console.log(PREFIX, `Fallback RPC: tx already in network (${isAlreadyKnown(err) ? "already known" : "nonce too low"})`)
      return hash
    }
    console.error(PREFIX, "Fallback re-broadcast failed:", err instanceof Error ? err.message : err)
    return null
  }
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

class TransactionPipeline {
  /**
   * Submit a contract call: send via wallet → poll receipt → re-broadcast
   * on fallback RPC if receipt not found → DLQ on total failure.
   */
  async submitContractCall(
    params: SubmitContractTxParams,
    opts?: PipelineOptions,
  ): Promise<PipelineResult> {
    const { walletClient, address, abi, functionName, args, value, gas } =
      params
    const account = walletClient.account
    if (!account) throw new Error("WalletClient has no account")

    const sendFn = (nonce?: number) =>
      walletClient.writeContract({
        address,
        abi: abi as Abi,
        functionName,
        args: args as readonly unknown[],
        value,
        gas,
        ...(nonce !== undefined ? { nonce } : {}),
        chain: walletClient.chain,
        account: account,
      })

    return this.execute(
      {
        sendFn,
        from: account.address,
        to: address,
        label: functionName,
      },
      opts,
    )
  }

  async submitContractCallOptimistic(
    params: SubmitContractTxParams,
    opts?: PipelineOptions,
  ): Promise<OptimisticPipelineResult> {
    const { walletClient, address, abi, functionName, args, value, gas } =
      params
    const account = walletClient.account
    if (!account) throw new Error("WalletClient has no account")

    const config = { ...DEFAULTS, ...opts }

    const hash = await walletClient.writeContract({
      address,
      abi: abi as Abi,
      functionName,
      args: args as readonly unknown[],
      value,
      gas,
      chain: walletClient.chain,
      account: account,
    })

    console.log(PREFIX, `[optimistic] Hash obtained → ${hash}, polling receipt in background`)

    const receiptPromise = pollForReceipt(hash, {
      timeoutMs: config.receiptTimeoutMs,
      pollingIntervalMs: config.receiptPollIntervalMs,
      initialDelayMs: 1_000,
    }).catch(async (err) => {
      if (err instanceof ReceiptTimeoutError) {
        const fallbackHash = await rebroadcastOnFallback(hash)
        if (fallbackHash) {
          return pollForReceipt(fallbackHash, {
            timeoutMs: config.receiptTimeoutMs,
            pollingIntervalMs: config.receiptPollIntervalMs,
          })
        }
      }
      throw err
    })

    return { hash, receiptPromise }
  }

  async submitRawTransaction(
    params: SubmitRawTxParams,
    opts?: PipelineOptions,
  ): Promise<PipelineResult> {
    const { walletClient, to, data, value, gas } = params
    const account = walletClient.account
    if (!account) throw new Error("WalletClient has no account")

    const sendFn = (nonce?: number) =>
      walletClient.sendTransaction({
        to,
        data,
        value,
        gas,
        ...(nonce !== undefined ? { nonce } : {}),
        chain: walletClient.chain,
        account: account,
      })

    return this.execute(
      {
        sendFn,
        from: account.address,
        to,
        label: "sendTransaction",
      },
      opts,
    )
  }

  // -------------------------------------------------------------------------
  // Core execution loop
  // -------------------------------------------------------------------------

  private async execute(
    tx: {
      sendFn: (nonce?: number) => Promise<Hash>
      from: Address
      to: Address
      label: string
    },
    opts?: PipelineOptions,
  ): Promise<PipelineResult> {
    const config = { ...DEFAULTS, ...opts }

    let lastHash: Hash | undefined
    let lastError: unknown
    let knownNonce: number | undefined

    console.log(PREFIX, `Starting pipeline for ${tx.label} (from=${tx.from.slice(0, 10)}… to=${tx.to.slice(0, 10)}…)`)

    for (let cycle = 0; cycle <= config.maxResubmits; cycle++) {
      const nonceForThisCycle = cycle === 0 ? undefined : knownNonce
      console.log(PREFIX, `Cycle ${cycle}/${config.maxResubmits}${nonceForThisCycle !== undefined ? ` (nonce=${nonceForThisCycle})` : " (wallet-managed nonce)"}`)

      const sendResult = await this.sendWithRetry(
        tx.sendFn,
        nonceForThisCycle,
        config,
      )

      if (sendResult.hash) {
        lastHash = sendResult.hash
        rpcManager.recordSuccess(rpcManager.getPrimaryClient())
        console.log(PREFIX, `Wallet sent tx → ${lastHash} (via wallet RPC)`)

        console.log(PREFIX, `Polling for receipt on primary + fallback RPCs (timeout=${config.receiptTimeoutMs}ms)`)
        try {
          const receipt = await pollForReceipt(lastHash, {
            timeoutMs: config.receiptTimeoutMs,
            pollingIntervalMs: config.receiptPollIntervalMs,
          })
          console.log(PREFIX, `Receipt confirmed ✓ block=${receipt.blockNumber} status=${receipt.status}`)
          return { receipt, hash: lastHash }
        } catch (err) {
          if (!(err instanceof ReceiptTimeoutError)) {
            lastError = err
            console.error(PREFIX, "Receipt poll error (non-timeout):", err instanceof Error ? err.message : err)
            break
          }
          lastError = err
          console.warn(PREFIX, `Receipt timeout after ${config.receiptTimeoutMs}ms — attempting fallback re-broadcast`)

          const fallbackHash = await rebroadcastOnFallback(lastHash)
          if (fallbackHash) {
            console.log(PREFIX, `Polling again after fallback re-broadcast (hash=${fallbackHash})`)
            try {
              const receipt = await pollForReceipt(fallbackHash, {
                timeoutMs: config.receiptTimeoutMs,
                pollingIntervalMs: config.receiptPollIntervalMs,
              })
              console.log(PREFIX, `Receipt confirmed via fallback ✓ block=${receipt.blockNumber} status=${receipt.status}`)
              return { receipt, hash: fallbackHash }
            } catch {
              console.warn(PREFIX, "Receipt still not found after fallback re-broadcast")
            }
          }

          if (knownNonce === undefined) {
            knownNonce = await this.getNonceFromTx(lastHash)
            console.log(PREFIX, `Resolved nonce=${knownNonce} from original tx for resubmit`)
          }
          continue
        }
      } else {
        lastError = sendResult.error
        const errMsg = sendResult.error instanceof Error ? sendResult.error.message : String(sendResult.error)
        console.warn(PREFIX, `Send failed: ${errMsg.slice(0, 200)}`)

        if (isAlreadyKnown(sendResult.error) && lastHash) {
          console.log(PREFIX, "Tx already known in mempool — polling for receipt")
          try {
            const receipt = await pollForReceipt(lastHash, {
              timeoutMs: config.receiptTimeoutMs,
              pollingIntervalMs: config.receiptPollIntervalMs,
            })
            return { receipt, hash: lastHash }
          } catch {
            continue
          }
        }

        if (isNonceTooLow(sendResult.error) && lastHash) {
          console.log(PREFIX, "Nonce too low — original tx likely mined, quick-polling receipt")
          try {
            const receipt = await pollForReceipt(lastHash, {
              timeoutMs: 10_000,
              pollingIntervalMs: 1_000,
            })
            return { receipt, hash: lastHash }
          } catch {
            // Fall through to DLQ
          }
        }

        if (shouldNotRetry(sendResult.error)) {
          console.error(PREFIX, "Non-retryable error — aborting")
          throw sendResult.error instanceof Error
            ? sendResult.error
            : new Error(String(sendResult.error))
        }

        break
      }
    }

    console.error(PREFIX, `All ${config.maxResubmits + 1} cycles exhausted → dead letter queue`)
    deadLetterQueue.enqueue({
      hash: lastHash,
      nonce: knownNonce ?? -1,
      from: tx.from,
      to: tx.to,
      label: tx.label,
      error: lastError instanceof Error
        ? lastError.message
        : String(lastError ?? "Unknown error"),
    })

    throw lastError instanceof Error
      ? lastError
      : new Error(String(lastError ?? "Transaction failed after all retries"))
  }

  // -------------------------------------------------------------------------
  // Send with retry
  // -------------------------------------------------------------------------

  private async sendWithRetry(
    sendFn: (nonce?: number) => Promise<Hash>,
    nonce: number | undefined,
    config: Required<PipelineOptions>,
  ): Promise<{ hash?: Hash; error?: unknown }> {
    let lastError: unknown

    for (let attempt = 0; attempt < config.maxRetries; attempt++) {
      if (attempt > 0) {
        console.log(PREFIX, `Send retry ${attempt}/${config.maxRetries - 1}`)
      }
      try {
        const hash = await sendFn(nonce)
        if (attempt > 0) {
          console.log(PREFIX, `Send succeeded on retry ${attempt}`)
        }
        return { hash }
      } catch (err) {
        lastError = err
        const errMsg = err instanceof Error ? err.message : String(err)
        console.warn(PREFIX, `Send attempt ${attempt} failed: ${errMsg.slice(0, 200)}`)

        if (shouldNotRetry(err)) return { error: err }
        if (isNonceTooLow(err) || isAlreadyKnown(err)) return { error: err }

        if (attempt < config.maxRetries - 1) {
          const delay = retryDelay(attempt, config.retryBaseDelayMs, config.retryMaxDelayMs)
          console.log(PREFIX, `Waiting ${Math.round(delay)}ms before retry`)
          await sleep(delay)
        }
      }
    }

    return { error: lastError }
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private async getNonceFromTx(hash: Hash): Promise<number | undefined> {
    for (const client of rpcManager.getClientsInPriorityOrder()) {
      try {
        const tx = await client.getTransaction({ hash })
        if (tx) return tx.nonce
      } catch {
        // try next client
      }
    }
    return undefined
  }
}

export const transactionPipeline = new TransactionPipeline()
