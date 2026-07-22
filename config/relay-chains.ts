import { type Address } from "viem"

/** Relay chain ID for Solana (used by Relay API, not standard Solana chain ID) */
export const RELAY_SOLANA_CHAIN_ID = 792703809

/** Story mainnet chain ID */
export const RELAY_STORY_CHAIN_ID = 1514

/** Solana USDC SPL token address for mainnet */
export const SOLANA_USDC_ADDRESS = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"

/** USDC ERC-20 contract on Story mainnet */
export const STORY_USDC_ADDRESS = "0xF1815bd50389c46847f0Bda824eC8da914045D14" as Address

/** Solana native SOL address (System Program) — Relay expects Solana-format for SVM chains */
export const SOLANA_NATIVE_SOL_ADDRESS = "11111111111111111111111111111111"

/** Native currency zero address used by Relay for EVM native tokens */
export const NATIVE_CURRENCY_ADDRESS = "0x0000000000000000000000000000000000000000" as Address

/**
 * Curated set of chain IDs shown in deposit/withdraw dropdowns.
 * Filtered from Relay's full chain list.
 */
export const CURATED_CHAIN_IDS = new Set([
  1,           // Ethereum
  8453,        // Base
  42161,       // Arbitrum
  10,          // Optimism
  137,         // Polygon
  56,          // BNB Chain
  43114,       // Avalanche
  RELAY_SOLANA_CHAIN_ID, // Solana
])

export function isSolanaChain(chainId: number): boolean {
  return chainId === RELAY_SOLANA_CHAIN_ID
}

/** User-facing payment currencies in the trade modal */
export type PaymentCurrency = "IP" | "SOL" | "USDC"

export interface RelaySourceChain {
  readonly chainId: number
  readonly name: string
  readonly currency: string
  readonly currencyAddress: string
  readonly decimals: number
}

/** Relay config for native SOL on Solana */
export const RELAY_SOL_CONFIG: RelaySourceChain = {
  chainId: RELAY_SOLANA_CHAIN_ID,
  name: "Solana",
  currency: "SOL",
  currencyAddress: SOLANA_NATIVE_SOL_ADDRESS,
  decimals: 9,
}

/** Relay config for USDC SPL on Solana (used for bridge operations) */
export const RELAY_USDC_SOL_CONFIG: RelaySourceChain = {
  chainId: RELAY_SOLANA_CHAIN_ID,
  name: "Solana",
  currency: "USDC",
  currencyAddress: SOLANA_USDC_ADDRESS,
  decimals: 6,
}

/**
 * All Relay source chain configs for reference.
 */
export const RELAY_SOURCE_CHAINS: readonly RelaySourceChain[] = [
  RELAY_SOL_CONFIG,
  RELAY_USDC_SOL_CONFIG,
] as const
