"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Address } from "viem"
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi"
import OperatorABI from "@/config/Operator.abi.json"
import { getContractAddress } from "@/lib/contracts/addresses"
import { errorReporter } from "@/lib/error-reporting"
import { ClaimResult, ClaimState, SignatureComponents } from "@/types/claim"

interface UseClaimTransactionResult {
  executeTransaction: (params: {
    ipaAddress: Address
    claimer: Address
    tokens: Address[]
    deadline: number
    operatorSignature: SignatureComponents
    ipOwnerSignature: SignatureComponents
  }) => Promise<ClaimResult>
  state: ClaimState
  reset: () => void
}

/**
 * Hook for executing blockchain transactions for IP claim operations
 * Handles the contract call and transaction confirmation
 */
export const useClaimTransaction = (): UseClaimTransactionResult => {
  const [state, setState] = useState<ClaimState>({
    status: "idle",
    error: null,
    txHash: null,
  })

  const processedTxRef = useRef<string | null>(null)

  const { data: txHash, isPending: isPendingTx, error, writeContract } = useWriteContract()

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: txError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
    query: {
      refetchOnWindowFocus: false,
    },
  })

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && txHash && processedTxRef.current !== txHash) {
      processedTxRef.current = txHash
      setState((prev) => ({
        ...prev,
        status: "success",
        txHash,
      }))
    }
  }, [isConfirmed, txHash])

  // Handle transaction errors
  useEffect(() => {
    if (error || txError) {
      const errorMessage = error?.message || txError?.message || "Transaction failed"
      setState((prev) => ({
        ...prev,
        status: "error",
        error: errorMessage,
      }))

      errorReporter.reportError(error || txError || new Error(errorMessage), {
        component: "useClaimTransaction",
        action: "transactionError",
        severity: "high",
        txHash: txHash || undefined,
      })
    }
  }, [error, txError, txHash])

  // Update pending state
  useEffect(() => {
    if (isPendingTx || isConfirming) {
      setState((prev) => ({
        ...prev,
        status: "pending",
        error: null,
      }))
    }
  }, [isPendingTx, isConfirming])

  const executeTransaction = useCallback(
    async (params: {
      ipaAddress: Address
      claimer: Address
      tokens: Address[]
      deadline: number
      operatorSignature: SignatureComponents
      ipOwnerSignature: SignatureComponents
    }): Promise<ClaimResult> => {
      try {
        // Reset processed transaction ref for new transaction
        processedTxRef.current = null

        setState({
          status: "pending",
          error: null,
          txHash: null,
        })

        writeContract({
          abi: OperatorABI,
          address: getContractAddress("Operator"),
          functionName: "claimIpWithSig",
          args: [
            params.ipaAddress,
            params.claimer,
            params.tokens,
            params.deadline,
            {
              v: params.operatorSignature.v,
              r: params.operatorSignature.r,
              s: params.operatorSignature.s,
            },
            params.ipOwnerSignature,
          ],
        })

        return { success: true }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to execute transaction"
        setState((prev) => ({
          ...prev,
          status: "error",
          error: errorMessage,
        }))

        errorReporter.reportError(error instanceof Error ? error : new Error(errorMessage), {
          component: "useClaimTransaction",
          action: "executeTransaction",
          severity: "high",
        })

        return { success: false, error: errorMessage }
      }
    },
    [writeContract]
  )

  const reset = useCallback(() => {
    setState({
      status: "idle",
      error: null,
      txHash: null,
    })
    processedTxRef.current = null
  }, [])

  return {
    executeTransaction,
    state,
    reset,
  }
}
