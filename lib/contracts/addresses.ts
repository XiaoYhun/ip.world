import { Address } from "viem"

// Contract names type for type safety
export type ContractName =
  | "IPWorld"
  | "IPToken"
  | "Operator"
  | "IPOwnerVault"
  | "AccessController"
  | "StoryHuntV3Factory"
  | "StoryHuntV3Pool"
  | "NonfungiblePositionManager"
  | "SwapRouter"
  | "Multicall3"
  | "WETH9"
  | "USDC"
  | "USDT"
  | "LicensingModule"
// Story Aeneid Testnet (chain ID 1315)
export const CONTRACT_ADDRESSES: Record<number, Record<ContractName, Address>> = {
  // Story Aeneid Testnet
  [1315]: {
    IPWorld: "0x77475A8ca1AfE6a6dc9E82B32210709054937099",
    IPToken: "0x0000000000000000000000000000000000000000", // TODO: Add if needed.
    Operator: "0x36D42740b9fd0d1806aAe64F450b3b2828c02634",
    IPOwnerVault: "0x276679F9e03d2E99350d407f964b5b42A3f01c73",
    LicensingModule: "0x04fbd8a2e56dd85CFD5500A4A4DfA955B9f1dE6f",
    AccessController: "0xcCF37d0a503Ee1D4C11208672e622ed3DFB2275a", // TODO: Add if needed
    StoryHuntV3Factory: "0x0000000000000000000000000000000000000000", // TODO: Add if needed
    StoryHuntV3Pool: "0x0000000000000000000000000000000000000000", // TODO: Add if needed
    NonfungiblePositionManager: "0x0000000000000000000000000000000000000000", // TODO: Add if needed
    SwapRouter: "0x0000000000000000000000000000000000000000", // TODO: Add if needed
    Multicall3: "0x0000000000000000000000000000000000000000", // TODO: Add if needed
    WETH9: "0x0000000000000000000000000000000000000000", // TODO: Add if needed
    USDC: "0x0000000000000000000000000000000000000000", // TODO: Add if needed
    USDT: "0x0000000000000000000000000000000000000000", // TODO: Add if needed
  },
  // Story Mainnet
  [1514]: {
    IPWorld: "0xd0EFb8Cd4c7a3Eefe823Fe963af9661D8F0CB745",
    IPToken: "0x0000000000000000000000000000000000000000", // TODO: Add if needed
    Operator: "0x0844042195C364d556Acc97ffD2527982933Db60",
    IPOwnerVault: "0x81336266Ba5F26B8AFf7d2b2A2305F52A39292b2",
    LicensingModule: "0x04fbd8a2e56dd85CFD5500A4A4DfA955B9f1dE6f",
    AccessController: "0xcCF37d0a503Ee1D4C11208672e622ed3DFB2275a", // TODO: Add if needed
    StoryHuntV3Factory: "0x0000000000000000000000000000000000000000", // TODO: Add if needed
    StoryHuntV3Pool: "0x0000000000000000000000000000000000000000", // TODO: Add if needed
    NonfungiblePositionManager: "0x0000000000000000000000000000000000000000", // TODO: Add if needed
    SwapRouter: "0x0000000000000000000000000000000000000000", // TODO: Add if needed
    Multicall3: "0x0000000000000000000000000000000000000000", // TODO: Add if needed
    WETH9: "0x0000000000000000000000000000000000000000", // TODO: Add if needed
    USDC: "0x0000000000000000000000000000000000000000", // TODO: Add if needed
    USDT: "0x0000000000000000000000000000000000000000", // TODO: Add if needed
  },
}

/**
 * Get contract address for the current chain
 */
export function getContractAddress(contractName: ContractName, chainId?: number): Address {
  // Use provided chainId or fall back to environment variable
  const currentChainId = chainId || parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "1315")

  const chainAddresses = CONTRACT_ADDRESSES[currentChainId]

  if (!chainAddresses) {
    throw new Error(`Unsupported chain ID: ${currentChainId}`)
  }

  const address = chainAddresses[contractName]

  if (!address || address === "0x0000000000000000000000000000000000000000") {
    throw new Error(`Contract ${contractName} not deployed on chain ${currentChainId}`)
  }

  return address
}

/**
 * Get all contract addresses for a specific chain
 */
export function getChainAddresses(chainId: number): Record<ContractName, Address> {
  const chainAddresses = CONTRACT_ADDRESSES[chainId]

  if (!chainAddresses) {
    throw new Error(`Unsupported chain ID: ${chainId}`)
  }

  return chainAddresses
}

/**
 * Check if a contract is deployed on a specific chain
 */
export function isContractDeployed(contractName: ContractName, chainId: number): boolean {
  try {
    const address = getContractAddress(contractName, chainId)
    return address !== "0x0000000000000000000000000000000000000000"
  } catch {
    return false
  }
}

/**
 * Get supported chains for a contract
 */
export function getSupportedChains(contractName: ContractName): number[] {
  return Object.entries(CONTRACT_ADDRESSES)
    .filter(
      ([, addresses]) =>
        addresses[contractName] && addresses[contractName] !== "0x0000000000000000000000000000000000000000"
    )
    .map(([chainId]) => parseInt(chainId))
}

/**
 * Validate all contract addresses for a chain
 */
export function validateChainAddresses(chainId: number): {
  valid: boolean
  missing: ContractName[]
  invalid: ContractName[]
} {
  const chainAddresses = CONTRACT_ADDRESSES[chainId]

  if (!chainAddresses) {
    return {
      valid: false,
      missing: Object.keys(CONTRACT_ADDRESSES[1315]) as ContractName[],
      invalid: [],
    }
  }

  const missing: ContractName[] = []
  const invalid: ContractName[] = []

  Object.entries(chainAddresses).forEach(([name, address]) => {
    if (!address) {
      missing.push(name as ContractName)
    } else if (address === "0x0000000000000000000000000000000000000000") {
      invalid.push(name as ContractName)
    }
  })

  return {
    valid: missing.length === 0 && invalid.length === 0,
    missing,
    invalid,
  }
}

// Environment-specific helpers
export const isDevelopment = process.env.NODE_ENV === "development"
export const isProduction = process.env.NODE_ENV === "production"

/**
 * Get the default chain ID based on environment
 */
export function getDefaultChainId(): number {
  return 1315 // Story Aeneid Testnet
}

/**
 * Contract deployment status for Story testnet
 */
export const DEPLOYMENT_STATUS = {
  storyTestnet: {
    deployed: ["IPWorld", "IPOwnerVault", "Operator"] as ContractName[],
    pending: [
      "IPToken",
      "StoryHuntV3Factory",
      "StoryHuntV3Pool",
      "NonfungiblePositionManager",
      "SwapRouter",
      "Multicall3",
      "WETH9",
      "USDC",
      "USDT",
    ] as ContractName[],
  },
} as const
