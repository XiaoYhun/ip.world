/**
 * Token swap calculation utilities for IP.world protocol
 * Based on the exact Uniswap V3 concentrated liquidity formulas provided
 */

// Tick ranges: [-126_000, -104_000, -45_000] with allocations [72%, 25%, 1%]
// Main (first) range used for swap calculations:
export const START_TICK_LIST = [-126_000, -104_000, -45_000] as const
export const TICK_1 = START_TICK_LIST[0]
export const TICK_2 = START_TICK_LIST[1]
export const ALLOCATION_AMOUNT = 720_000_000 // 720M tokens (72% of 1B) for first range
export const TOTAL_SUPPLY = 1_000_000_000 // 1 billion tokens
export const MAX_PURCHASE_PERCENTAGE = 0.97 // 3% maximum
export const SWAP_FEE = 0.003 // 0.3%
export const DECIMALS = 18

/**
 * Calculate the starting token price and market cap from the initial pool tick.
 * At launch (no swaps), the pool price is set at TICK_1 = -126000.
 * price_per_token_in_IP = 1.0001^tick / (tokens_per_IP_at_tick)
 * Since Uniswap V3: price = 1.0001^tick where price = IP/token (token0 < token1),
 * the token price in IP = 1.0001^tick, and in USD = that × ipPriceUsd.
 *
 * For our pools, token is token0 (lower address than wrapped IP),
 * so price (token0/token1) = 1.0001^tick → IP per token = 1.0001^tick
 * → token price in USD = 1.0001^tick × ipPriceUsd
 *
 * If token is token1, the relationship inverts.
 */
export function calculateStartingMarketCap(ipPriceUsd: number, tokenAddress?: string): {
  priceUsd: number
  marketCapUsd: number
} {
  const wrappedIp = (process.env.NEXT_PUBLIC_WRAPPED_IP_TOKEN_ADDRESS ?? "0x1514000000000000000000000000000000000000").toLowerCase()
  const token = (tokenAddress ?? "").toLowerCase()
  const isToken0 = token < wrappedIp

  // price = 1.0001^tick gives the ratio of token1/token0
  // If token is token0: price = IP_per_token = 1.0001^TICK_1
  // If token is token1: price = token_per_IP = 1.0001^TICK_1, so IP_per_token = 1/price
  const tickPrice = Math.pow(1.0001, TICK_1)
  const ipPerToken = isToken0 ? tickPrice : 1 / tickPrice

  const priceUsd = ipPerToken * ipPriceUsd
  const marketCapUsd = priceUsd * TOTAL_SUPPLY

  return { priceUsd, marketCapUsd }
}

/**
 * Calculate token output for a given ETH input
 * @param tick1 - First tick
 * @param tick2 - Second tick
 * @param allocationAmount - Total allocated tokens
 * @param ethAmount - ETH input amount
 * @param feeTier - Swap fee rate (e.g., 0.003 = 0.3%)
 * @returns Token output amount
 */
export function calculateTokenOutWithFee(
  tick1: number,
  tick2: number,
  allocationAmount: number,
  ethAmount: number,
  feeTier: number = SWAP_FEE
): number {
  if (ethAmount <= 0) {
    throw new Error("ETH amount must be greater than 0.")
  }

  // Calculate prices from ticks
  const p1 = 1.0001 ** tick1
  const p2 = 1.0001 ** tick2

  // Calculate square roots of prices
  const sqrtP1 = Math.sqrt(p1)
  const sqrtP2 = Math.sqrt(p2)

  // Calculate liquidity using reciprocal difference
  const L1 = allocationAmount / (1 / sqrtP1 - 1 / sqrtP2)

  // Calculate maximum ETH amount
  const maxXAfterFee = L1 * (sqrtP2 - sqrtP1)
  const maxEthAmount = maxXAfterFee / (1 - feeTier)

  if (ethAmount >= maxEthAmount) {
    throw new Error(`ETH amount is too high. It must be less than ${maxEthAmount.toFixed(2)} ETH.`)
  }

  // Apply swap fee
  const x = ethAmount * (1 - feeTier)

  // Calculate token output
  const denominator = sqrtP1 + x / L1
  const tokenOut = (1 / sqrtP1 - 1 / denominator) * L1

  return tokenOut
}

/**
 * Calculate required ETH input for a specific token amount
 * @param tick1 - First tick
 * @param tick2 - Second tick
 * @param allocationAmount - Total allocated tokens
 * @param tokenAmount - Desired token amount
 * @param feeTier - Swap fee rate
 * @returns Required ETH amount (including fees)
 */
export function calculateEthInWithFee(
  tick1: number,
  tick2: number,
  allocationAmount: number,
  tokenAmount: number,
  feeTier: number = SWAP_FEE
): number {
  if (tokenAmount <= 0) {
    throw new Error("Token amount must be greater than 0.")
  }
  if (tokenAmount >= allocationAmount) {
    throw new Error(`Token amount cannot exceed total allocation (${allocationAmount.toLocaleString()}).`)
  }

  // Calculate prices and liquidity
  const p1 = 1.0001 ** tick1
  const p2 = 1.0001 ** tick2
  const sqrtP1 = Math.sqrt(p1)
  const sqrtP2 = Math.sqrt(p2)
  const L1 = allocationAmount / (1 / sqrtP1 - 1 / sqrtP2)

  // Calculate required ETH using inverse function
  const targetRatio = 1 / sqrtP1 - tokenAmount / L1
  const newSqrtPrice = 1 / targetRatio
  const xAfterFee = L1 * (newSqrtPrice - sqrtP1)
  const xBeforeFee = xAfterFee / (1 - feeTier)

  return xBeforeFee
}

/**
 * Calculates token output for a given IP (ETH) input using the main tick range
 * @param ipAmount Amount of IP (ETH) to spend
 * @returns The amount of tokens received
 */
export function calculateTokensFromIP(ipAmount: number): number {
  if (ipAmount <= 0) {
    return 0
  }

  try {
    return calculateTokenOutWithFee(TICK_1, TICK_2, ALLOCATION_AMOUNT, ipAmount)
  } catch {
    // If amount is too high, return max possible tokens
    // const maxTokens = TOTAL_SUPPLY * MAX_PURCHASE_PERCENTAGE
    const maxTokens = TOTAL_SUPPLY
    return Math.min(ALLOCATION_AMOUNT * 0.99, maxTokens) // 99% of allocation or 3% of total supply
  }
}

/**
 * Calculates required IP (ETH) input for a specific token amount
 * @param tokenAmount Desired amount of tokens to receive
 * @returns The amount of IP (ETH) required
 */
export function calculateIPFromTokens(tokenAmount: number): number {
  if (tokenAmount <= 0) {
    return 0
  }

  // const maxTokens = TOTAL_SUPPLY * MAX_PURCHASE_PERCENTAGE
  const maxTokens = TOTAL_SUPPLY
  if (tokenAmount > maxTokens) {
    throw new Error(`Maximum tokens is ${maxTokens.toLocaleString()} (3% of total supply)`)
  }

  // Ensure we don't exceed the allocation amount
  const effectiveTokenAmount = Math.min(tokenAmount, ALLOCATION_AMOUNT * 0.99)

  try {
    return calculateEthInWithFee(TICK_1, TICK_2, ALLOCATION_AMOUNT, effectiveTokenAmount)
  } catch (error) {
    throw new Error(
      `Token amount too large for calculation: ${error instanceof Error ? error.message : "Unknown error"}`
    )
  }
}

/**
 * Calculate IP required for percentage-based purchases
 * @param percentages Array of percentage values (e.g., [0.001, 0.005, 0.01, 0.02, 0.03])
 * @returns Array of objects with percentage and required IP amount
 */
export function calculatePercentageAllocations(percentages: number[]) {
  return percentages.map((percentage) => {
    // if (percentage > MAX_PURCHASE_PERCENTAGE) {
    //   return {
    //     percentage,
    //     tokenAmount: 0,
    //     ipRequired: 0,
    //     error: `Exceeds maximum of ${MAX_PURCHASE_PERCENTAGE * 100}%`,
    //   }
    // }

    const tokenAmount = percentage * TOTAL_SUPPLY

    try {
      const ipRequired = calculateIPFromTokens(tokenAmount)
      return {
        percentage,
        tokenAmount,
        ipRequired,
        error: null,
      }
    } catch (error) {
      return {
        percentage,
        tokenAmount,
        ipRequired: 0,
        error: error instanceof Error ? error.message : "Calculation failed",
      }
    }
  })
}

/**
 * Validate if an IP amount is within acceptable limits
 * @param ipAmount Amount of IP to validate
 * @returns Object with validation result and details
 */
export function validateIPAmount(ipAmount: number) {
  if (ipAmount <= 0) {
    return { isValid: false, error: "Amount must be greater than 0", maxIP: 0 }
  }

  try {
    // const maxTokens = TOTAL_SUPPLY * MAX_PURCHASE_PERCENTAGE
    const maxTokens = TOTAL_SUPPLY
    const maxIP = calculateIPFromTokens(maxTokens)

    // if (ipAmount > maxIP) {
    //   return {
    //     isValid: false,
    //     error: `Maximum amount is ${maxIP.toFixed(6)} IP (3% of total supply)`,
    //     maxIP,
    //   }
    // }

    return { isValid: true, error: null, maxIP }
  } catch {
    return { isValid: false, error: "Validation failed", maxIP: 0 }
  }
}

/**
 * Format token display with K, M, B suffixes
 * @param tokens Number of tokens to format
 * @returns Formatted string
 */
export function formatTokens(tokens: number): string {
  if (tokens === 0) return "0"
  if (tokens < 1000) return tokens.toFixed(2)
  if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}K`
  if (tokens < 1000000000) return `${(tokens / 1000000).toFixed(1)}M`
  return `${(tokens / 1000000000).toFixed(1)}B`
}

/**
 * Calculate dynamic position for IP label based on input length
 * @param inputValue Current input value as string
 * @param charWidth Character width in pixels (default for monospace)
 * @param baseOffset Base padding offset
 * @returns Position in pixels
 */
export function calculateIPLabelPosition(inputValue: string, charWidth: number = 8.4, baseOffset: number = 20): number {
  return baseOffset + inputValue.length * charWidth
}
