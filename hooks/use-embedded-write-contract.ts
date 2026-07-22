"use client"

import { useCallback, useState } from "react"
import type { Abi, Address, TransactionReceipt } from "viem"
import { useEmbeddedEvmWalletClient } from "./use-embedded-evm-wallet-client"
import { tradeTimer } from "@/lib/trade-timer"
import {
  transactionPipeline,
  type PipelineOptions,
} from "@/lib/web3/tx-pipeline"

interface WriteContractArgs {
  address: Address
  // Permissive to accept JSON ABI imports (which have `type: string` instead of literal types)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abi: any
  functionName: string
  args?: unknown[]
  value?: bigint
  /** When provided, skips eth_estimateGas RPC call (saves ~300-800ms) */
  gas?: bigint
}

/**
 * Drop-in replacement for wagmi's `useWriteContract` that always signs
 * with the embedded EVM wallet's viem WalletClient, bypassing wagmi's
 * connector routing entirely.
 *
 * Exposes two paths:
 * - `writeContractAsync` — direct sign+broadcast (original, for approvals etc.)
 * - `writeContractWithPipeline` — full pipeline: nonce mgmt, retry, fallback RPC,
 *    receipt polling, dead-letter queue. Returns a confirmed receipt.
 */
export function useEmbeddedWriteContract() {
  const { getEmbeddedWalletClient } = useEmbeddedEvmWalletClient()
  const [data, setData] = useState<`0x${string}` | undefined>()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<Error | undefined>()
  const [receipt, setReceipt] = useState<TransactionReceipt | undefined>()

  const writeContractAsync = useCallback(
    async (args: WriteContractArgs): Promise<`0x${string}`> => {
      const fnLabel = `[writeContract] ${args.functionName}`
      tradeTimer.start(`${fnLabel}:getWalletClient`)
      const client = await getEmbeddedWalletClient()
      tradeTimer.end(`${fnLabel}:getWalletClient`)

      setIsPending(true)
      setError(undefined)
      try {
        tradeTimer.start(`${fnLabel}:signAndBroadcast`)
        const hash = await client.writeContract({
          address: args.address,
          abi: args.abi as Abi,
          functionName: args.functionName,
          args: args.args as readonly unknown[],
          value: args.value,
          gas: args.gas,
          chain: client.chain,
          account: client.account!,
        })
        tradeTimer.end(`${fnLabel}:signAndBroadcast`)
        setData(hash)
        return hash
      } catch (err) {
        tradeTimer.end(`${fnLabel}:signAndBroadcast`)
        const e = err instanceof Error ? err : new Error(String(err))
        setError(e)
        throw e
      } finally {
        setIsPending(false)
      }
    },
    [getEmbeddedWalletClient]
  )

  /**
   * Full pipeline path: sign once → broadcast with retry/fallback → poll receipt.
   * Returns the confirmed TransactionReceipt.
   */
  const writeContractWithPipeline = useCallback(
    async (
      args: WriteContractArgs,
      opts?: PipelineOptions,
    ): Promise<TransactionReceipt> => {
      const fnLabel = `[pipeline] ${args.functionName}`
      tradeTimer.start(`${fnLabel}:getWalletClient`)
      const client = await getEmbeddedWalletClient()
      tradeTimer.end(`${fnLabel}:getWalletClient`)

      setIsPending(true)
      setError(undefined)
      setReceipt(undefined)
      try {
        tradeTimer.start(`${fnLabel}:pipeline`)
        const result = await transactionPipeline.submitContractCall(
          {
            walletClient: client,
            address: args.address,
            abi: args.abi,
            functionName: args.functionName,
            args: args.args,
            value: args.value,
            gas: args.gas,
          },
          opts,
        )
        tradeTimer.end(`${fnLabel}:pipeline`)
        setData(result.hash)
        setReceipt(result.receipt)
        return result.receipt
      } catch (err) {
        tradeTimer.end(`${fnLabel}:pipeline`)
        const e = err instanceof Error ? err : new Error(String(err))
        setError(e)
        throw e
      } finally {
        setIsPending(false)
      }
    },
    [getEmbeddedWalletClient]
  )

  /**
   * Optimistic pipeline: sign+broadcast → return hash immediately.
   * Receipt polling runs in the background; the returned `receiptPromise`
   * resolves once the tx is confirmed on-chain.
   */
  const writeContractOptimistic = useCallback(
    async (
      args: WriteContractArgs,
      opts?: PipelineOptions,
    ): Promise<{ hash: `0x${string}`; receiptPromise: Promise<TransactionReceipt> }> => {
      const fnLabel = `[optimistic] ${args.functionName}`
      tradeTimer.start(`${fnLabel}:getWalletClient`)
      const client = await getEmbeddedWalletClient()
      tradeTimer.end(`${fnLabel}:getWalletClient`)

      setIsPending(true)
      setError(undefined)
      setReceipt(undefined)
      try {
        tradeTimer.start(`${fnLabel}:signAndBroadcast`)
        const result = await transactionPipeline.submitContractCallOptimistic(
          {
            walletClient: client,
            address: args.address,
            abi: args.abi,
            functionName: args.functionName,
            args: args.args,
            value: args.value,
            gas: args.gas,
          },
          opts,
        )
        tradeTimer.end(`${fnLabel}:signAndBroadcast`)
        setData(result.hash)
        setIsPending(false)

        const receiptPromise = result.receiptPromise.then((r) => {
          setReceipt(r)
          return r
        }).catch((err) => {
          const e = err instanceof Error ? err : new Error(String(err))
          setError(e)
          throw e
        })

        return { hash: result.hash, receiptPromise }
      } catch (err) {
        tradeTimer.end(`${fnLabel}:signAndBroadcast`)
        const e = err instanceof Error ? err : new Error(String(err))
        setError(e)
        setIsPending(false)
        throw e
      }
    },
    [getEmbeddedWalletClient]
  )

  const writeContract = useCallback(
    (args: WriteContractArgs) => {
      writeContractAsync(args).catch(() => {})
    },
    [writeContractAsync]
  )

  const reset = useCallback(() => {
    setData(undefined)
    setError(undefined)
    setReceipt(undefined)
    setIsPending(false)
  }, [])

  return {
    writeContractAsync,
    writeContractWithPipeline,
    writeContractOptimistic,
    writeContract,
    data,
    isPending,
    error,
    receipt,
    reset,
  }
}
