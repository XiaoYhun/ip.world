"use client"

import { useMemo } from "react"
import { Address } from "viem"
import { useReadContract, useReadContracts } from "wagmi"
import { env } from "@/config"
import IPTokenABI from "@/config/IPToken.abi.json"
import QuoterABI from "@/config/Quoter.abi.json"
import StoryHuntV3FactoryABI from "@/config/StoryHuntV3Factory.abi.json"
import StoryHuntV3PoolABI from "@/config/StoryHuntV3Pool.abi.json"

function isAntiSnipeError(error: Error | null): boolean {
  if (!error?.message) return false
  return error.message.includes("reverted with the following reason:\nTF")
}

interface PriceImpactResult {
  priceImpact: number
  midPrice: number
  quotedPrice: number
  estimatedAmountOut: bigint
  poolTvlBase: number
  poolTvlQuote: number
  isLoading: boolean
  error: Error | null
  isAntiSnipeBlocked: boolean
}

interface UseUniswapV3PriceImpactParams {
  tokenIn: Address
  tokenOut: Address
  amountIn: bigint
  enabled?: boolean
  fee?: bigint
}

/**
 * Hook to calculate accurate Uniswap V3 price impact using onchain data
 * Based on the price impact calculation methodology from eth_defi
 */
export function useUniswapV3PriceImpact({
  tokenIn,
  tokenOut,
  amountIn,
  enabled = true,
  fee: externalFee,
}: UseUniswapV3PriceImpactParams): PriceImpactResult {
  const resolvedFee = externalFee ?? BigInt(env.NEXT_PUBLIC_V3_FEE)
  // Determine token ordering (Uniswap V3 always orders token0 < token1 by address)
  const isReversed = tokenIn > tokenOut
  const token0 = isReversed ? tokenOut : tokenIn
  const token1 = isReversed ? tokenIn : tokenOut

  // Get pool address from factory (always use token0, token1 order)
  const { data: poolAddress } = useReadContract({
    address: env.NEXT_PUBLIC_STORYHUNT_V3_FACTORY,
    abi: StoryHuntV3FactoryABI,
    functionName: "getPool",
    args: [token0, token1, resolvedFee],
    query: {
      enabled: enabled && !!tokenIn && !!tokenOut,
      staleTime: Infinity,
      gcTime: Infinity,
    },
  })

  // Use 18 decimals for all tokens (simplified approach)
  // const { data: tokenDecimals } = useReadContracts({
  //   contracts: [
  //     {
  //       address: tokenIn,
  //       abi: IPTokenABI,
  //       functionName: "decimals",
  //     },
  //     {
  //       address: tokenOut,
  //       abi: IPTokenABI,
  //       functionName: "decimals",
  //     },
  //   ],
  //   query: {
  //     enabled: enabled && !!tokenIn && !!tokenOut,
  //     staleTime: Infinity,
  //     gcTime: Infinity,
  //   },
  // })

  // All tokens use 18 decimals - no need to fetch

  const {
    data: multicallData,
    error: multicallError,
    isLoading: isLoadingMulticall,
  } = useReadContracts({
    contracts: [
      {
        address: poolAddress as Address,
        abi: StoryHuntV3PoolABI,
        functionName: "slot0",
      },
      {
        address: token0,
        abi: IPTokenABI,
        functionName: "balanceOf",
        args: [poolAddress as Address],
      },
      {
        address: token1,
        abi: IPTokenABI,
        functionName: "balanceOf",
        args: [poolAddress as Address],
      },
    ],
    query: {
      enabled: enabled && !!poolAddress && poolAddress !== "0x0000000000000000000000000000000000000000",
      staleTime: 15_000,
      gcTime: 30_000,
      refetchInterval: 15_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    multicallAddress: "0xcA11bde05977b3631167028862bE2a173976CA11",
  })

  // Extract data from multicall results
  const poolState = multicallData?.[0]?.result
  const poolBalances = useMemo(
    () => [{ result: multicallData?.[1]?.result }, { result: multicallData?.[2]?.result }],
    [multicallData]
  )

  // Get quoted amount out from Quoter
  const {
    data: quotedAmountOut,
    isLoading: isLoadingQuote,
    error: quoteError,
    // isError: isQuoteError,
  } = useReadContract({
    address: env.NEXT_PUBLIC_QUOTER_ADDRESS,
    abi: QuoterABI,
    functionName: "quoteExactInputSingle",
    args: [tokenIn, tokenOut, resolvedFee, amountIn, BigInt(0)],
    query: {
      enabled: enabled && !!tokenIn && !!tokenOut && amountIn > 0,
      staleTime: 15_000,
      gcTime: 30_000,
      refetchInterval: 15_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  })

  // Calculate mid price from pool state
  const midPrice = useMemo(() => {
    if (!poolState) return 0

    const [sqrtPriceX96] = poolState as [bigint, number, number, number, number, number, boolean]

    // Convert sqrtPriceX96 to actual price
    // price = (sqrtPriceX96 / 2^96)^2
    const Q96 = BigInt(2) ** BigInt(96)
    const sqrtPrice = Number(sqrtPriceX96) / Number(Q96)
    let price = sqrtPrice ** 2

    // sqrtPriceX96 represents price of token1 in terms of token0
    // If our tokenIn/tokenOut order is reversed from token0/token1, we need to invert the price
    if (isReversed) {
      price = 1 / price
    }

    return price
  }, [poolState, isReversed])

  // Calculate quoted price from the swap quote
  const quotedPrice = useMemo(() => {
    if (!quotedAmountOut || amountIn === BigInt(0)) return 0

    const decimalsIn = 18 // All tokens use 18 decimals
    const decimalsOut = 18 // All tokens use 18 decimals

    const amountInNumber = Number(amountIn) / 10 ** decimalsIn
    const amountOutNumber = Number(quotedAmountOut as bigint) / 10 ** decimalsOut

    if (amountInNumber === 0) return 0
    return amountOutNumber / amountInNumber
  }, [quotedAmountOut, amountIn])

  // Calculate pool TVL
  const { poolTvlBase, poolTvlQuote } = useMemo(() => {
    if (!poolBalances?.[0]?.result || !poolBalances?.[1]?.result) {
      return { poolTvlBase: 0, poolTvlQuote: 0 }
    }

    const decimals = 18 // All tokens use 18 decimals
    const balance0 = Number(poolBalances[0].result as bigint) / 10 ** decimals // token0 balance
    const balance1 = Number(poolBalances[1].result as bigint) / 10 ** decimals // token1 balance

    // Map back to tokenIn/tokenOut based on ordering
    const balanceIn = isReversed ? balance1 : balance0
    const balanceOut = isReversed ? balance0 : balance1

    return {
      poolTvlBase: balanceIn,
      poolTvlQuote: balanceOut,
    }
  }, [poolBalances, isReversed])

  const priceImpact = useMemo(() => {
    if (!midPrice || !quotedPrice || midPrice === 0) return 0

    const impact = Math.abs((quotedPrice - midPrice) / midPrice) * 100
    return Math.min(impact, 100)
  }, [midPrice, quotedPrice])

  const isLoading = isLoadingQuote || isLoadingMulticall
  // Determine if the error is an anti-snipe error
  const isAntiSnipeBlocked = isAntiSnipeError(quoteError) || isAntiSnipeError(multicallError)

  return {
    priceImpact,
    midPrice,
    quotedPrice,
    estimatedAmountOut: (quotedAmountOut as bigint) || BigInt(0),
    poolTvlBase,
    poolTvlQuote,
    isLoading,
    error: quoteError || multicallError,
    isAntiSnipeBlocked,
  }
}

/**
 * Simplified hook for just getting price impact percentage
 */
export function usePriceImpact({ tokenIn, tokenOut, amountIn, enabled = true, fee }: UseUniswapV3PriceImpactParams): {
  priceImpact: number
  isLoading: boolean
  error: Error | null
  isAntiSnipeBlocked: boolean
} {
  const { priceImpact, isLoading, error, isAntiSnipeBlocked } = useUniswapV3PriceImpact({
    tokenIn,
    tokenOut,
    amountIn,
    enabled,
    fee,
  })

  return { priceImpact, isLoading, error, isAntiSnipeBlocked }
}

/**
 * Hook specifically for sell operations (token -> IP)
 */
export function useSellPriceImpact({
  tokenAddress,
  sellAmount,
  enabled = true,
  fee,
}: {
  tokenAddress: Address
  sellAmount: bigint
  enabled?: boolean
  fee?: bigint
}) {
  return useUniswapV3PriceImpact({
    tokenIn: tokenAddress,
    tokenOut: env.NEXT_PUBLIC_WRAPPED_IP_TOKEN_ADDRESS,
    amountIn: sellAmount,
    enabled,
    fee,
  })
}

/**
 * Hook specifically for buy operations (IP -> token)
 */
export function useBuyPriceImpact({
  tokenAddress,
  buyAmount,
  enabled = true,
  fee,
}: {
  tokenAddress: Address
  buyAmount: bigint
  enabled?: boolean
  fee?: bigint
}) {
  return useUniswapV3PriceImpact({
    tokenIn: env.NEXT_PUBLIC_WRAPPED_IP_TOKEN_ADDRESS,
    tokenOut: tokenAddress,
    amountIn: buyAmount,
    enabled,
    fee,
  })
}
