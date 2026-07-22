"use server"

import { cache } from "react"
import { createPublicClient, http, type Address, type Abi } from "viem"
import { multicall, type MulticallParameters } from "viem/actions"
import { unstable_cache } from "next/cache"
import { env } from "@/config"

// Types for better type safety
export interface ContractCall<TAbi extends Abi = Abi, TFunctionName extends string = string> {
  address: Address
  abi: TAbi
  functionName: TFunctionName
  args?: readonly unknown[]
}

export interface CacheConfig {
  ttl?: number // Time to live in seconds (default: 30)
  tags?: string[] // Cache tags for invalidation
  key?: string // Custom cache key
  enabled?: boolean // Whether to use cache (default: true)
}

export interface ContractReadResult<T = unknown> {
  result: T | null
  status: "success" | "failure"
  error?: string
}

export interface CachedContractReadOptions extends CacheConfig {
  multicallAddress?: Address
  allowFailure?: boolean
}

// Create a cached viem client
const getPublicClient = cache(() => {
  return createPublicClient({
    transport: http(env.NEXT_PUBLIC_JSON_RPC_URL),
    chain: {
      id: Number(env.NEXT_PUBLIC_CHAIN_ID),
      name: env.NEXT_PUBLIC_CHAIN_NAME,
      network: env.NEXT_PUBLIC_CHAIN_NAME,
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      rpcUrls: {
        default: { http: [env.NEXT_PUBLIC_JSON_RPC_URL] },
        public: { http: [env.NEXT_PUBLIC_JSON_RPC_URL] },
      },
    } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
  })
})

// Generate cache key from contract calls
function generateCacheKey(contracts: ContractCall[], customKey?: string): string {
  if (customKey) return customKey

  const callsHash = contracts
    .map((call) => `${call.address}-${call.functionName}-${JSON.stringify(call.args || [])}`)
    .join("|")

  return `contracts:${Buffer.from(callsHash).toString("base64").slice(0, 32)}`
}

// Internal multicall function without caching (for cache function)
const performMulticall = cache(
  async (contracts: ContractCall[], multicallAddress?: Address, allowFailure: boolean = true) => {
    const client = getPublicClient()

    console.log(`🔗 Executing multicall for ${contracts.length} contracts`)

    try {
      const multicallParams: MulticallParameters = {
        contracts: contracts as any[], // eslint-disable-line @typescript-eslint/no-explicit-any
        allowFailure,
      }

      if (multicallAddress) {
        multicallParams.multicallAddress = multicallAddress
      }

      const results = await multicall(client, multicallParams)

      return results.map((result: any, index: number) => ({
        result: result.status === "success" ? result.result : null,
        status: result.status,
        error: result.status === "failure" ? result.error?.message : undefined,
        contractIndex: index,
      }))
    } catch (error) {
      console.error("Multicall error:", error)

      // Return failure results for all contracts
      return contracts.map((_, index) => ({
        result: null,
        status: "failure" as const,
        error: error instanceof Error ? error.message : "Unknown error",
        contractIndex: index,
      }))
    }
  }
)

/**
 * Generic cached contract reader with multicall support
 *
 * @param contracts Array of contract calls to execute
 * @param options Caching and multicall configuration
 * @returns Array of contract call results
 *
 * @example
 * ```typescript
 * const results = await readContractsCached([
 *   {
 *     address: tokenAddress,
 *     abi: ERC20ABI,
 *     functionName: "totalSupply"
 *   },
 *   {
 *     address: tokenAddress,
 *     abi: ERC20ABI,
 *     functionName: "balanceOf",
 *     args: [userAddress]
 *   }
 * ], {
 *   ttl: 60, // Cache for 1 minute
 *   tags: ["token-data"],
 *   key: "token-info"
 * })
 * ```
 */
export async function readContractsCached(
  contracts: ContractCall[],
  options: CachedContractReadOptions = {}
): Promise<ContractReadResult[]> {
  const {
    ttl = 30,
    tags = [],
    key,
    enabled = true,
    multicallAddress = "0xcA11bde05977b3631167028862bE2a173976CA11" as Address,
    allowFailure = true,
  } = options

  // If caching disabled, execute directly
  if (!enabled) {
    return await performMulticall(contracts, multicallAddress, allowFailure)
  }

  const cacheKey = generateCacheKey(contracts, key)
  const cacheTags = [`contracts`, cacheKey, ...tags]

  // Use unstable_cache for persistent caching across requests
  const cachedResult = await unstable_cache(
    async () => {
      return await performMulticall(contracts, multicallAddress, allowFailure)
    },
    [cacheKey],
    {
      revalidate: ttl,
      tags: cacheTags,
    }
  )()

  return cachedResult
}

/**
 * Read a single contract with caching
 */
export async function readContractCached<TAbi extends Abi, TFunctionName extends string, TResult = unknown>(
  contract: ContractCall<TAbi, TFunctionName>,
  options: CacheConfig = {}
): Promise<ContractReadResult<TResult>> {
  const results = await readContractsCached([contract], options)
  return results[0] as ContractReadResult<TResult>
}

/**
 * Utility to create a cached contract reader for specific contracts
 * Useful for creating typed contract readers
 */
export function createContractReader<TAbi extends Abi>(address: Address, abi: TAbi, defaultOptions: CacheConfig = {}) {
  return {
    /**
     * Read a single function from the contract
     */
    read: async <TFunctionName extends string, TResult = unknown>(
      functionName: TFunctionName,
      args?: readonly unknown[],
      options: CacheConfig = {}
    ): Promise<ContractReadResult<TResult>> => {
      const mergedOptions = { ...defaultOptions, ...options }
      return await readContractCached<TAbi, TFunctionName, TResult>({ address, abi, functionName, args }, mergedOptions)
    },

    /**
     * Read multiple functions from the same contract
     */
    readMultiple: async (
      calls: Array<{
        functionName: string
        args?: readonly unknown[]
      }>,
      options: CachedContractReadOptions = {}
    ): Promise<ContractReadResult[]> => {
      const mergedOptions = { ...defaultOptions, ...options }
      const contracts = calls.map((call) => ({
        address,
        abi,
        functionName: call.functionName,
        args: call.args,
      }))

      return await readContractsCached(contracts, mergedOptions)
    },

    /**
     * Get the contract address and ABI
     */
    getInfo: () => ({ address, abi }),
  }
}

/**
 * Cache invalidation utilities
 */
export const contractCache = {
  /**
   * Invalidate cache by tags
   */
  invalidateByTags: async (tags: string[]) => {
    const { revalidateTag } = await import("next/cache")
    tags.forEach((tag) => revalidateTag(tag, "max"))
  },

  /**
   * Invalidate all contract caches
   */
  invalidateAll: async () => {
    const { revalidateTag } = await import("next/cache")
    revalidateTag("contracts", "max")
  },

  /**
   * Invalidate specific contract cache
   */
  invalidateContract: async (contracts: ContractCall[], customKey?: string) => {
    const { revalidateTag } = await import("next/cache")
    const cacheKey = generateCacheKey(contracts, customKey)
    revalidateTag(cacheKey, "max")
  },
}

/**
 * Pre-built contract readers for common patterns
 */
export const contractReaders = {
  /**
   * ERC20 token reader
   */
  erc20: (tokenAddress: Address, abi: Abi) =>
    createContractReader(tokenAddress, abi, {
      ttl: 30,
      tags: ["erc20", tokenAddress],
    }),

  /**
   * Multi-contract reader with shared cache settings
   */
  multiContract: (contracts: ContractCall[], baseOptions: CacheConfig = {}) => ({
    read: (additionalOptions: CachedContractReadOptions = {}) =>
      readContractsCached(contracts, { ...baseOptions, ...additionalOptions }),
  }),
}
