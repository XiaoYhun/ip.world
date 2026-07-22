import { toast } from "sonner"
import { Hash } from "viem"
import { TransactionError } from "@/lib/contracts/types"
import { extractTransactionErrorMessages, parseTransactionErrorMessage } from "@/lib/web3/transaction-errors"

export interface TransactionOptions<T = unknown> {
  onPending?: () => void
  onSuccess?: (result: T) => void
  onError?: (error: TransactionError) => void
  successMessage?: string
  errorMessage?: string
  pendingMessage?: string
  loadingMessage?: string
}

export interface TransactionState {
  isPending: boolean
  isConfirming: boolean
  isSuccess: boolean
  isError: boolean
  error: TransactionError | null
  hash: Hash | undefined
}

export class TransactionManager {
  /**
   * Execute a transaction with comprehensive error handling and user feedback
   */
  static async executeTransaction<T>(
    operation: () => Promise<T>,
    options: TransactionOptions<T> = {}
  ): Promise<T | null> {
    const { onPending, onSuccess, onError, successMessage, errorMessage, pendingMessage } = options

    try {
      // Show pending message
      if (pendingMessage) {
        toast.loading(pendingMessage)
      }

      onPending?.()

      const result = await operation()

      // Dismiss loading toast
      toast.dismiss()

      // Show success message
      if (successMessage) {
        toast.success(successMessage)
      }

      onSuccess?.(result)
      return result
    } catch (error) {
      // Dismiss loading toast
      toast.dismiss()

      const transactionError = this.parseError(error)
      const userFriendlyMessage = this.getUserFriendlyErrorMessage(transactionError)

      // Show error message
      const finalErrorMessage = userFriendlyMessage || errorMessage || transactionError.message || "Transaction failed"
      toast.error(finalErrorMessage)

      onError?.(transactionError)
      return null
    }
  }

  /**
   * Parse various error types into a standardized TransactionError
   */
  static parseError(error: unknown): TransactionError {
    const messages = extractTransactionErrorMessages(error)
    const normalized = messages.join(" | ").toLowerCase()

    if (messages.length > 0) {
      if (
        normalized.includes("user rejected") ||
        normalized.includes("user denied") ||
        normalized.includes("rejected the request") ||
        normalized.includes("request rejected") ||
        normalized.includes("4001")
      ) {
        return {
          name: "UserRejectedError",
          message: "Transaction cancelled.",
          code: "USER_REJECTED",
        }
      }

      if (
        normalized.includes("insufficient funds") ||
        normalized.includes("insufficient balance") ||
        normalized.includes("transfer amount exceeds balance") ||
        normalized.includes("exceeds balance") ||
        normalized.includes("not enough balance")
      ) {
        return {
          name: "InsufficientFundsError",
          message: "Insufficient balance to complete this transaction.",
          code: "INSUFFICIENT_FUNDS",
        }
      }

      if (normalized.includes("gas")) {
        return {
          name: "GasError",
          message: "Transaction failed while estimating gas.",
          code: "GAS_ERROR",
        }
      }

      if (normalized.includes("nonce")) {
        return {
          name: "NonceError",
          message: "Transaction nonce error. Please try again.",
          code: "NONCE_ERROR",
        }
      }

      if (normalized.includes("operatoronly")) {
        return {
          name: "OperatorOnlyError",
          message: "Only authorized operators can perform this action",
          code: "OPERATOR_ONLY",
        }
      }

      if (normalized.includes("invalidamount")) {
        return {
          name: "InvalidAmountError",
          message: "Invalid amount specified",
          code: "INVALID_AMOUNT",
        }
      }

      if (normalized.includes("tokennotfound")) {
        return {
          name: "TokenNotFoundError",
          message: "Token not found",
          code: "TOKEN_NOT_FOUND",
        }
      }

      if (normalized.includes("ipnotclaimed")) {
        return {
          name: "IPNotClaimedError",
          message: "IP must be claimed before this action",
          code: "IP_NOT_CLAIMED",
        }
      }

      if (normalized.includes("vestingnotstarted")) {
        return {
          name: "VestingNotStartedError",
          message: "Vesting has not started yet",
          code: "VESTING_NOT_STARTED",
        }
      }

      if (normalized.includes("insufficientvestedamount")) {
        return {
          name: "InsufficientVestedAmountError",
          message: "Insufficient vested amount available",
          code: "INSUFFICIENT_VESTED_AMOUNT",
        }
      }
    }

    if (error instanceof Error) {
      return {
        name: error.name || "TransactionError",
        message: parseTransactionErrorMessage(error, error.message || "An unknown error occurred"),
        code: "UNKNOWN_ERROR",
        data: error,
      }
    }

    return {
      name: "TransactionError",
      message: parseTransactionErrorMessage(error, "An unknown error occurred"),
      code: "UNKNOWN_ERROR",
      data: error,
    }
  }

  /**
   * Create a standardized transaction state object
   */
  static createTransactionState(
    isPending = false,
    isConfirming = false,
    isSuccess = false,
    isError = false,
    error: TransactionError | null = null,
    hash?: Hash
  ): TransactionState {
    return {
      isPending,
      isConfirming,
      isSuccess,
      isError,
      error,
      hash,
    }
  }

  /**
   * Format transaction hash for display
   */
  static formatTransactionHash(hash: Hash | undefined): string {
    if (!hash) return ""
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`
  }

  /**
   * Get explorer URL for transaction
   */
  static getExplorerUrl(hash: Hash, explorerBaseUrl: string): string {
    return `${explorerBaseUrl}/tx/${hash}`
  }

  /**
   * Check if error is user rejection
   */
  static isUserRejection(error: TransactionError): boolean {
    return (
      error.code === "USER_REJECTED" ||
      error.message.toLowerCase().includes("user rejected") ||
      error.message.toLowerCase().includes("user denied")
    )
  }

  /**
   * Check if error is due to insufficient funds
   */
  static isInsufficientFunds(error: TransactionError): boolean {
    return (
      error.code === "INSUFFICIENT_FUNDS" ||
      error.message.toLowerCase().includes("insufficient funds") ||
      error.message.toLowerCase().includes("insufficient balance")
    )
  }

  /**
   * Get user-friendly error message
   */
  static getUserFriendlyErrorMessage(error: TransactionError): string {
    switch (error.code) {
      case "USER_REJECTED":
        return "Transaction was cancelled"
      case "INSUFFICIENT_FUNDS":
        return "Insufficient funds to complete transaction"
      case "GAS_ERROR":
        return "Transaction failed due to gas estimation error"
      case "NONCE_ERROR":
        return "Transaction failed due to nonce error. Please try again"
      case "OPERATOR_ONLY":
        return "This action requires operator privileges"
      case "INVALID_AMOUNT":
        return "Please enter a valid amount"
      case "TOKEN_NOT_FOUND":
        return "Token not found or invalid"
      case "IP_NOT_CLAIMED":
        return "IP must be claimed before performing this action"
      case "VESTING_NOT_STARTED":
        return "Vesting period has not started yet"
      case "INSUFFICIENT_VESTED_AMOUNT":
        return "No vested tokens available to claim"
      default:
        return error.message || "Transaction failed. Please try again"
    }
  }

  /**
   * Validate transaction parameters
   */
  static validateTransactionParams(params: Record<string, unknown>): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    // Check for required parameters
    if (params.to && typeof params.to !== "string") {
      errors.push("Invalid recipient address")
    }

    if (params.value && typeof params.value !== "bigint" && typeof params.value !== "string") {
      errors.push("Invalid transaction value")
    }

    if (params.gasLimit && typeof params.gasLimit !== "bigint" && typeof params.gasLimit !== "string") {
      errors.push("Invalid gas limit")
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }
}
