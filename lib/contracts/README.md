# Server-Side Contract Caching System

A generic, type-safe system for caching blockchain contract reads on the server side with configurable TTL, cache invalidation, and multicall support.

## Features

- 🚀 **Generic**: Works with any contract ABI and function
- ⚡ **Fast**: Uses multicall for batch operations
- 🔒 **Type-safe**: Full TypeScript support with proper typing
- 💾 **Cached**: Configurable caching with TTL and tags
- 🎯 **Smart**: Request-level deduplication
- 🛡️ **Resilient**: Error handling and fallbacks
- 🔄 **Invalidation**: Fine-grained cache control

## Quick Start

```typescript
import { readContractsCached, createContractReader } from "@/lib/contracts/cached-reader"
import { ERC20ABI } from "@/lib/contracts/abis"

// Simple single contract read
const totalSupply = await readContractCached(
  {
    address: "0x...",
    abi: ERC20ABI,
    functionName: "totalSupply",
  },
  {
    ttl: 60, // Cache for 1 minute
  }
)

// Multiple contracts (multicall)
const results = await readContractsCached(
  [
    { address: "0x...", abi: ERC20ABI, functionName: "totalSupply" },
    { address: "0x...", abi: ERC20ABI, functionName: "name" },
    { address: "0x...", abi: ERC20ABI, functionName: "symbol" },
  ],
  {
    ttl: 300, // 5 minutes
    tags: ["token-metadata"],
  }
)
```

## API Reference

### `readContractsCached(contracts, options)`

Main function for reading multiple contracts with caching.

**Parameters:**

- `contracts`: Array of contract calls
- `options`: Caching configuration

**Returns:** Array of contract results

### `readContractCached(contract, options)`

Read a single contract with caching.

### `createContractReader(address, abi, defaultOptions)`

Create a reusable contract reader with default settings.

### Cache Options

```typescript
interface CacheConfig {
  ttl?: number // Time to live in seconds (default: 30)
  tags?: string[] // Cache tags for invalidation
  key?: string // Custom cache key
  enabled?: boolean // Whether to use cache (default: true)
}
```

## Usage Patterns

### 1. Basic Token Info

```typescript
export async function getTokenInfo(tokenAddress: string) {
  const contracts = [
    { address: tokenAddress, abi: ERC20ABI, functionName: "name" },
    { address: tokenAddress, abi: ERC20ABI, functionName: "symbol" },
    { address: tokenAddress, abi: ERC20ABI, functionName: "totalSupply" },
  ]

  const results = await readContractsCached(contracts, {
    ttl: 300, // 5 minutes - metadata rarely changes
    tags: ["token-metadata", tokenAddress],
  })

  return {
    name: results[0]?.result,
    symbol: results[1]?.result,
    totalSupply: results[2]?.result,
  }
}
```

### 2. Contract Reader Factory

```typescript
// Create a typed reader for a specific contract
const tokenReader = createContractReader(tokenAddress, ERC20ABI, {
  ttl: 30,
  tags: ["token", tokenAddress],
})

// Use it multiple times
const totalSupply = await tokenReader.read("totalSupply")
const balance = await tokenReader.read("balanceOf", [userAddress])
```

### 3. Batch Operations

```typescript
export async function getUserPortfolio(userAddress: string, tokens: string[]) {
  const contracts = tokens.map((token) => ({
    address: token,
    abi: ERC20ABI,
    functionName: "balanceOf",
    args: [userAddress],
  }))

  const results = await readContractsCached(contracts, {
    ttl: 30,
    tags: ["portfolio", userAddress],
  })

  return tokens.map((token, i) => ({
    token,
    balance: results[i]?.result,
  }))
}
```

## Cache Strategies

Different types of data should use different cache durations:

```typescript
export const cacheStrategies = {
  // Static data that never changes
  static: { ttl: 3600 }, // 1 hour

  // Metadata that rarely changes
  metadata: { ttl: 300 }, // 5 minutes

  // Balance data that changes frequently
  balances: { ttl: 30 }, // 30 seconds

  // Real-time data
  realtime: { ttl: 5 }, // 5 seconds

  // No cache for critical operations
  fresh: { enabled: false },
}
```

## Cache Management

```typescript
import { contractCache } from "@/lib/contracts/cached-reader"

// Invalidate by tags
await contractCache.invalidateByTags(["token-metadata"])

// Invalidate all contracts
await contractCache.invalidateAll()

// Invalidate specific contract
await contractCache.invalidateContract(contracts, "custom-key")
```

## Integration with Next.js Pages

```typescript
// app/token/[address]/page.tsx
export default async function TokenPage({ params }) {
  // This data will be cached and pre-rendered
  const [tokenInfo, totalSupply] = await Promise.all([
    getTokenInfo(params.address),
    getTokenTotalSupply(params.address),
  ])

  return (
    <TokenDisplay
      initialTokenInfo={tokenInfo}
      initialTotalSupply={totalSupply}
    />
  )
}
```

## Error Handling

The system includes built-in error handling:

```typescript
const result = await readContractCached(contract, options)

if (result.status === "success") {
  console.log("Result:", result.result)
} else {
  console.error("Error:", result.error)
}
```

## Performance Tips

1. **Use multicall**: Batch multiple calls into one request
2. **Choose appropriate TTL**: Balance freshness vs performance
3. **Use tags**: Organize cache for efficient invalidation
4. **Request deduplication**: Identical calls are automatically deduplicated
5. **Error fallbacks**: Handle failed calls gracefully

## Best Practices

1. **Group related calls**: Use multicall for related data
2. **Tag consistently**: Use clear, hierarchical tags
3. **Monitor cache hit rates**: Adjust TTL based on usage patterns
4. **Handle errors**: Always check result status
5. **Invalidate appropriately**: Clear cache when data changes

## Examples

See `examples/contract-caching-usage.ts` for comprehensive usage examples including:

- Basic contract reads
- Multicall operations
- Contract reader factories
- Batch operations
- Error handling
- Cache management
- Real-world patterns

## Migration from useReadContracts

Replace client-side `useReadContracts`:

```typescript
// Before (client-side)
const { data } = useReadContracts({ contracts })

// After (server-side)
const data = await readContractsCached(contracts, { ttl: 30 })
```

The server-side version provides the same interface with added caching benefits.
