"use client"

import { useCallback, useState } from "react"
import type { Address, TransactionReceipt } from "viem"
import { useEmbeddedEvmWalletClient } from "./use-embedded-evm-wallet-client"
import {
  transactionPipeline,
  type PipelineOptions,
} from "@/lib/web3/tx-pipeline"

interface SendTransactionArgs {
  to: Address
  data?: `0x${string}`
  value?: bigint
  gas?: bigint
}

/**
 * Drop-in replacement for wagmi's `useSendTransaction` that always signs
 * with the embedded EVM wallet's viem WalletClient, bypassing wagmi's
 * connector routing entirely.
 *
 * Exposes two paths:
 * - `sendTransactionAsync` — direct send (original)
 * - `sendTransactionWithPipeline` — full pipeline with retry, fallback, receipt polling
 */
export function useEmbeddedSendTransaction() {
  const { getEmbeddedWalletClient } = useEmbeddedEvmWalletClient()
  const [data, setData] = useState<`0x${string}` | undefined>()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<Error | undefined>()
  const [receipt, setReceipt] = useState<TransactionReceipt | undefined>()

  const sendTransactionAsync = useCallback(
    async (args: SendTransactionArgs): Promise<`0x${string}`> => {
      const client = await getEmbeddedWalletClient()

      setIsPending(true)
      setError(undefined)
      try {
        const hash = await client.sendTransaction({
          to: args.to,
          data: args.data,
          value: args.value,
          gas: args.gas,
          chain: client.chain,
          account: client.account!,
        })
        setData(hash)
        return hash
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err))
        setError(e)
        throw e
      } finally {
        setIsPending(false)
      }
    },
    [getEmbeddedWalletClient]
  )

  const sendTransactionWithPipeline = useCallback(
    async (
      args: SendTransactionArgs,
      opts?: PipelineOptions,
    ): Promise<TransactionReceipt> => {
      const client = await getEmbeddedWalletClient()

      setIsPending(true)
      setError(undefined)
      setReceipt(undefined)
      try {
        const result = await transactionPipeline.submitRawTransaction(
          {
            walletClient: client,
            to: args.to,
            data: args.data,
            value: args.value,
            gas: args.gas,
          },
          opts,
        )
        setData(result.hash)
        setReceipt(result.receipt)
        return result.receipt
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err))
        setError(e)
        throw e
      } finally {
        setIsPending(false)
      }
    },
    [getEmbeddedWalletClient]
  )

  const reset = useCallback(() => {
    setData(undefined)
    setError(undefined)
    setReceipt(undefined)
    setIsPending(false)
  }, [])

  return {
    sendTransactionAsync,
    sendTransactionWithPipeline,
    data,
    isPending,
    error,
    receipt,
    reset,
  }
}
