import { Address } from "viem"

/**
 * Supported Uniswap V3 fee tiers for Wrapped IP / remix token pools.
 * Try order is determined per-token by V3_MIGRATED_TO_10000_ADDRESSES.
 */
export const V3_FEE_TIERS = [3000, 10000] as const

/**
 * Token addresses that have migrated from fee 3000 to 10000.
 * For these tokens, discovery tries 10000 first so they use the new pool.
 * Lookup is case-insensitive (normalized to lowercase).
 */
export const V3_MIGRATED_TO_10000_ADDRESSES: Address[] = [
  "0x693c7AcF65e52C71bAFE555Bc22d69cB7f8a78a2", // LARRY
  "0x543374350269CCe6651358769512875FAA4cCcFf", // IPPY
  "0xA074AcA68eeB6c831A78c84606F3CB44F9E547f5", // LOUIE (already migrated)
  "0xa597A4e9a9651DD6c390933AF9C7A13326667163", // YAP (already migrated)
  "0xd1b2D3Df51c3E5a22b09993354B8717e3a7E4D3b", // ZAZU (already migrated)
]

const migratedSet = new Set(V3_MIGRATED_TO_10000_ADDRESSES.map((a) => a.toLowerCase()))

/**
 * Returns true if the token has migrated to fee tier 10000 (try 10000 first in discovery).
 */
export function isMigratedTo10000(tokenAddress: Address): boolean {
  return migratedSet.has(tokenAddress.toLowerCase())
}

/**
 * Returns fee tier order for pool discovery: [10000, 3000] for migrated tokens, [3000, 10000] otherwise.
 */
export function getFeeTierOrder(tokenAddress: Address): readonly [number, number] {
  return isMigratedTo10000(tokenAddress) ? [10000, 3000] : [3000, 10000]
}
