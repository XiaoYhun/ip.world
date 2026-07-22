import { Address } from "viem"

/**
 * Signature components for blockchain operations
 */
export interface SignatureComponents {
  v: number
  r: `0x${string}`
  s: `0x${string}`
}

/**
 * Response from the claim signature API
 */
export interface ClaimSignatureResponse {
  v: number
  r: string
  s: string
  deadline: number
  error?: string
  message?: string
}

/**
 * Parameters for generating claim signature
 */
export interface ClaimSignatureParams {
  sender: Address
  ipa_id: Address
  claimer: Address
  nonce: number
  tokens: Address[]
}

/**
 * IP Account state and signature data
 */
export interface IpAccountData {
  state: `0x${string}`
  signature: SignatureComponents
}

/**
 * Claim operation status
 */
export type ClaimStatus = "idle" | "pending" | "success" | "error"

/**
 * Claim operation result
 */
export interface ClaimResult {
  success: boolean
  error?: string
  txHash?: `0x${string}`
}

/**
 * Hook state for claim operations
 */
export interface ClaimState {
  status: ClaimStatus
  error: string | null
  txHash: `0x${string}` | null
}
