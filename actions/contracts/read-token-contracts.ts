"use server"

import { readContractsCached, createContractReader, contractReaders } from "@/lib/contracts/cached-reader"
import { IPTokenABI, IPOwnerVaultABI } from "@/lib/contracts/abis"
import { getContractAddress } from "@/lib/contracts/addresses"
import type { Address } from "viem"

export interface TokenContractData {
  totalSupply: bigint | null
  released: bigint | null
  releasable: bigint | null
  ipWorldBalance: bigint | null
}

/**
 * Read token contract data using the generic cached reader
 * Cache TTL: 30 seconds
 */
export async function readTokenContracts(tokenAddress: string): Promise<TokenContractData> {
  const contracts = [
    {
      address: tokenAddress as Address,
      abi: IPTokenABI as any,
      functionName: "totalSupply",
    },
    {
      address: getContractAddress("IPOwnerVault") as Address,
      abi: IPOwnerVaultABI as any,
      functionName: "released",
      args: [tokenAddress],
    },
    {
      address: getContractAddress("IPOwnerVault") as Address,
      abi: IPOwnerVaultABI as any,
      functionName: "releasable",
      args: [tokenAddress],
    },
    {
      address: tokenAddress as Address,
      abi: IPTokenABI as any,
      functionName: "balanceOf",
      args: [getContractAddress("IPWorld") as Address],
    },
  ]

  const results = await readContractsCached(contracts, {
    ttl: 30, // Cache for 30 seconds
    tags: ["token-contracts", tokenAddress],
    key: `token-${tokenAddress}`,
  })

  return {
    totalSupply: results[0]?.result as bigint | null,
    released: results[1]?.result as bigint | null,
    releasable: results[2]?.result as bigint | null,
    ipWorldBalance: results[3]?.result as bigint | null,
  }
}

/**
 * Alternative: Using the contract reader factory
 */
export async function readTokenContractsTyped(tokenAddress: string): Promise<TokenContractData> {
  // Create typed readers for each contract
  const tokenReader = createContractReader(tokenAddress as Address, IPTokenABI as any, {
    ttl: 30,
    tags: ["token", tokenAddress],
  })

  const vaultReader = createContractReader(getContractAddress("IPOwnerVault") as Address, IPOwnerVaultABI as any, {
    ttl: 30,
    tags: ["vault", tokenAddress],
  })

  // Read multiple functions in parallel
  const [totalSupplyResult, ipWorldBalanceResult] = await Promise.all([
    tokenReader.read("totalSupply"),
    tokenReader.read("balanceOf", [getContractAddress("IPWorld")]),
  ])

  const [releasedResult, releasableResult] = await Promise.all([
    vaultReader.read("released", [tokenAddress]),
    vaultReader.read("releasable", [tokenAddress]),
  ])

  return {
    totalSupply: totalSupplyResult.result as bigint | null,
    released: releasedResult.result as bigint | null,
    releasable: releasableResult.result as bigint | null,
    ipWorldBalance: ipWorldBalanceResult.result as bigint | null,
  }
}

/**
 * Read only basic token info (faster, longer cache)
 */
export async function readBasicTokenInfo(tokenAddress: string) {
  const tokenReader = contractReaders.erc20(tokenAddress as Address, IPTokenABI as any)

  const [totalSupply, name, symbol, decimals] = await Promise.all([
    tokenReader.read<"totalSupply", bigint>("totalSupply"),
    tokenReader.read<"name", string>("name"),
    tokenReader.read<"symbol", string>("symbol"),
    tokenReader.read<"decimals", number>("decimals"),
  ])

  return {
    totalSupply: totalSupply.result,
    name: name.result,
    symbol: symbol.result,
    decimals: decimals.result,
  }
}

/**
 * Batch read multiple tokens efficiently
 */
export async function readMultipleTokens(tokenAddresses: string[]) {
  const contracts = tokenAddresses.flatMap((address) => [
    {
      address: address as Address,
      abi: IPTokenABI as any,
      functionName: "totalSupply",
    },
    {
      address: address as Address,
      abi: IPTokenABI as any,
      functionName: "name",
    },
    {
      address: address as Address,
      abi: IPTokenABI as any,
      functionName: "symbol",
    },
  ])

  const results = await readContractsCached(contracts, {
    ttl: 60, // Longer cache for batch operations
    tags: ["token-batch"],
    key: `tokens-${tokenAddresses.join("-")}`,
  })

  // Group results by token
  const tokens = []
  for (let i = 0; i < tokenAddresses.length; i++) {
    const baseIndex = i * 3
    tokens.push({
      address: tokenAddresses[i],
      totalSupply: results[baseIndex]?.result as bigint | null,
      name: results[baseIndex + 1]?.result as string | null,
      symbol: results[baseIndex + 2]?.result as string | null,
    })
  }

  return tokens
}

/**
 * Cache management utilities for token contracts
 */
export const tokenContractCache = {
  /**
   * Invalidate cache for a specific token
   */
  invalidateToken: async (tokenAddress: string) => {
    const { contractCache } = await import("@/lib/contracts/cached-reader")
    await contractCache.invalidateByTags([`token-${tokenAddress}`, tokenAddress])
  },

  /**
   * Invalidate all token caches
   */
  invalidateAll: async () => {
    const { contractCache } = await import("@/lib/contracts/cached-reader")
    await contractCache.invalidateByTags(["token-contracts", "token", "vault"])
  },
}
