// Export contract services
export { IPWorldService } from "./contracts/ip-world-service"

// Re-export types for convenience
export type {
  TokenInfo,
  CreateTokenParams,
  HarvestResult,
  TokenDeployedEvent,
  FeeData,
  TransactionError,
  TransactionOptions,
  TransactionState,
} from "@/lib/contracts/types"

// Re-export contract utilities
export { getContractAddress, getChainAddresses, isContractDeployed } from "@/lib/contracts/addresses"

export { TransactionManager } from "@/lib/web3/transaction-manager"

import type { PublicClient, WalletClient } from "viem"
import { IPWorldService } from "./contracts/ip-world-service"

/**
 * Service factory for creating contract service instances
 */
export class ServiceFactory {
  constructor(
    private publicClient: PublicClient,
    private walletClient?: WalletClient
  ) {}

  /**
   * Create IPWorld service instance
   */
  createIPWorldService(): IPWorldService {
    return new IPWorldService(this.publicClient, this.walletClient)
  }

  /**
   * Update wallet client for all services
   */
  updateWalletClient(walletClient: WalletClient): ServiceFactory {
    return new ServiceFactory(this.publicClient, walletClient)
  }

  /**
   * Create services with different wallet client
   */
  withWalletClient(walletClient: WalletClient): ServiceFactory {
    return new ServiceFactory(this.publicClient, walletClient)
  }
}

/**
 * Create service factory instance
 */
export function createServiceFactory(publicClient: PublicClient, walletClient?: WalletClient): ServiceFactory {
  return new ServiceFactory(publicClient, walletClient)
}

/**
 * Create individual service instances
 */
export function createServices(publicClient: PublicClient, walletClient?: WalletClient) {
  return {
    ipWorld: new IPWorldService(publicClient, walletClient),
  }
}
