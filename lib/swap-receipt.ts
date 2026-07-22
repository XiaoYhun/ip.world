import { decodeEventLog, type Log } from "viem"
import { env } from "@/config"

const TOTAL_SUPPLY = 1_000_000_000

// Uniswap V3 Swap event ABI
const SwapEventABI = [
  {
    type: "event",
    name: "Swap",
    inputs: [
      { name: "sender", type: "address", indexed: true },
      { name: "recipient", type: "address", indexed: true },
      { name: "amount0", type: "int256", indexed: false },
      { name: "amount1", type: "int256", indexed: false },
      { name: "sqrtPriceX96", type: "uint160", indexed: false },
      { name: "liquidity", type: "uint128", indexed: false },
      { name: "tick", type: "int24", indexed: false },
    ],
    anonymous: false,
  },
] as const

/**
 * Decode sqrtPriceX96 from a swap tx receipt's logs.
 * Returns the last Swap event's sqrtPriceX96 (final pool state).
 */
export function decodeSqrtPriceFromReceipt(logs: Log[]): bigint | null {
  let lastSqrtPrice: bigint | null = null

  for (const log of logs) {
    try {
      const decoded = decodeEventLog({
        abi: SwapEventABI,
        data: log.data,
        topics: log.topics,
      })
      if (decoded.eventName === "Swap") {
        lastSqrtPrice = decoded.args.sqrtPriceX96
      }
    } catch {
      // Not a Swap event log, skip
    }
  }

  return lastSqrtPrice
}

/**
 * Compute token price in USD from sqrtPriceX96, matching the backend formula exactly.
 *
 * Backend (price/service.go CalculatePriceFromSqrt):
 *   ratio = sqrtPriceX96² / 2¹⁹² = token1 / token0
 *   if isToken0 (target is token0): tokensPerWIP = 2¹⁹² / sqrtPriceX96²
 *   if !isToken0 (target is token1): tokensPerWIP = sqrtPriceX96² / 2¹⁹²
 *
 * Then: priceUsd = ipPrice / tokensPerWIP
 *        marketCap = priceUsd * 1,000,000,000
 *
 * Uses BigInt arithmetic throughout to match backend's big.Int/big.Float precision.
 */
export function computePriceFromSqrtPriceX96(
  sqrtPriceX96: bigint,
  tokenAddress: string,
  ipPrice: number,
): { priceUsd: number; marketCapUsd: number } {
  const wrappedIp = (env.NEXT_PUBLIC_WRAPPED_IP_TOKEN_ADDRESS as string).toLowerCase()
  const token = tokenAddress.toLowerCase()

  // Uniswap V3: token0 is the numerically lower address
  const isToken0 = token < wrappedIp

  // BigInt math to avoid Number precision loss on large sqrtPriceX96 values
  const Q192 = BigInt(1) << BigInt(192)
  const SCALE = BigInt(10) ** BigInt(18)
  const sqrtPriceSq = sqrtPriceX96 * sqrtPriceX96

  // tokensPerWIP scaled by 1e18 to preserve decimals through integer division
  let tokensPerWIPScaled: bigint
  if (isToken0) {
    // token0/token1 = 2¹⁹² / sqrtPriceX96²
    tokensPerWIPScaled = (Q192 * SCALE) / sqrtPriceSq
  } else {
    // token1/token0 = sqrtPriceX96² / 2¹⁹²
    tokensPerWIPScaled = (sqrtPriceSq * SCALE) / Q192
  }

  const tokensPerWIP = Number(tokensPerWIPScaled) / 1e18

  const priceUsd = tokensPerWIP === 0 ? 0 : ipPrice / tokensPerWIP
  const marketCapUsd = priceUsd * TOTAL_SUPPLY

  return { priceUsd, marketCapUsd }
}
