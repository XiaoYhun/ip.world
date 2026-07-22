import { useMemo } from "react"
import { Address, Hash } from "viem"
import { usePublicClient } from "wagmi"
import type { HarvestResult, TokenDeployedEvent, TokenInfo } from "@/lib/contracts/types"
import { useEmbeddedEvmWalletClient } from "@/hooks/use-embedded-evm-wallet-client"
import { createServiceFactory, IPWorldService } from "@/lib/services"

/**
 * Hook for interacting with the IPWorld contract
 */
export function useIPWorldService() {
  const publicClient = usePublicClient()
  const { embeddedWalletAddress, getEmbeddedWalletClient } = useEmbeddedEvmWalletClient()

  // Create service instance
  const service = useMemo(() => {
    if (!publicClient) return null
    return new IPWorldService(publicClient, undefined, getEmbeddedWalletClient)
  }, [publicClient, getEmbeddedWalletClient])

  // Service factory for advanced usage
  const serviceFactory = useMemo(() => {
    if (!publicClient) return null
    return createServiceFactory(publicClient)
  }, [publicClient])

  return {
    service,
    serviceFactory,
    isReady: !!service,
    hasWallet: !!embeddedWalletAddress,
    embeddedWalletAddress,
  }
}

/**
 * Hook for IPWorld read operations
 */
export function useIPWorldRead() {
  const { service } = useIPWorldService()

  const getTokenInfo = async (tokenAddress: Address): Promise<TokenInfo | null> => {
    if (!service) throw new Error("Service not ready")
    return service.getTokenInfo(tokenAddress)
  }

  const getIpRecipient = async (ipaId: Address): Promise<Address | null> => {
    if (!service) throw new Error("Service not ready")
    return service.getIpRecipient(ipaId)
  }

  const isOperator = async (address: Address): Promise<boolean> => {
    if (!service) throw new Error("Service not ready")
    return service.isOperator(address)
  }

  const getOwnerVault = async (): Promise<Address | null> => {
    if (!service) throw new Error("Service not ready")
    return service.getOwnerVault()
  }

  const getStakingVault = async (): Promise<Address | null> => {
    if (!service) throw new Error("Service not ready")
    return service.getStakingVault()
  }

  const getProtocolFee = async (): Promise<bigint> => {
    if (!service) throw new Error("Service not ready")
    return service.getProtocolFee()
  }

  const getIpOwnerShare = async (): Promise<bigint> => {
    if (!service) throw new Error("Service not ready")
    return service.getIpOwnerShare()
  }

  const getNonces = async (address: Address): Promise<bigint> => {
    if (!service) throw new Error("Service not ready")
    return service.getNonces(address)
  }

  return {
    getTokenInfo,
    getIpRecipient,
    isOperator,
    getOwnerVault,
    getStakingVault,
    getProtocolFee,
    getIpOwnerShare,
    getNonces,
    isReady: !!service,
  }
}

/**
 * Hook for IPWorld write operations
 */
export function useIPWorldWrite() {
  const { service } = useIPWorldService()

  const createIpTokenWithSig = async (
    name: string,
    symbol: string,
    ipaId: Address,
    antiSnipe: boolean,
    deadline: bigint,
    v: number,
    r: string,
    s: string,
    value?: bigint
  ): Promise<{ pool: Address; token: Address; txHash: Hash; tokenCreator: Address } | null> => {
    if (!service) throw new Error("Service not ready")
    return service.createIpTokenWithSig(name, symbol, ipaId, antiSnipe, deadline, v, r, s, value)
  }

  const linkTokensToIp = async (ipaId: Address, tokenList: Address[]): Promise<Hash | null> => {
    if (!service) throw new Error("Service not ready")
    return service.linkTokensToIp(ipaId, tokenList)
  }

  const claimIp = async (ipaId: Address, recipient: Address): Promise<Hash | null> => {
    if (!service) throw new Error("Service not ready")
    return service.claimIp(ipaId, recipient)
  }

  const harvest = async (tokenAddress: Address): Promise<HarvestResult | null> => {
    if (!service) throw new Error("Service not ready")
    return service.harvest(tokenAddress)
  }

  const setOperator = async (operator: Address, status: boolean): Promise<Hash | null> => {
    if (!service) throw new Error("Service not ready")
    return service.setOperator(operator, status)
  }

  return {
    createIpTokenWithSig,
    linkTokensToIp,
    claimIp,
    harvest,
    setOperator,
    isReady: !!service,
  }
}

/**
 * Hook for IPWorld event queries
 */
export function useIPWorldEvents() {
  const { service } = useIPWorldService()

  const getTokenDeployedEvents = async (fromBlock?: bigint, toBlock?: bigint): Promise<TokenDeployedEvent[]> => {
    if (!service) throw new Error("Service not ready")
    return service.getTokenDeployedEvents(fromBlock, toBlock)
  }

  const getIpClaimedEvents = async (
    fromBlock?: bigint,
    toBlock?: bigint
  ): Promise<Array<{ ipaId: Address; recipient: Address; blockNumber: bigint }>> => {
    if (!service) throw new Error("Service not ready")
    return service.getIpClaimedEvents(fromBlock, toBlock)
  }

  return {
    getTokenDeployedEvents,
    getIpClaimedEvents,
    isReady: !!service,
  }
}

/**
 * Hook for IPWorld utility functions
 */
export function useIPWorldUtils() {
  const { service } = useIPWorldService()

  const estimateGas = async (functionName: string, args: unknown[], value?: bigint): Promise<bigint> => {
    if (!service) throw new Error("Service not ready")
    return service.estimateGas(functionName, args, value)
  }

  const simulate = async (functionName: string, args: unknown[], value?: bigint): Promise<unknown> => {
    if (!service) throw new Error("Service not ready")
    return service.simulate(functionName, args, value)
  }

  return {
    estimateGas,
    simulate,
    isReady: !!service,
  }
}

/**
 * Combined hook with all IPWorld functionality
 */
export function useIPWorld() {
  const base = useIPWorldService()
  const read = useIPWorldRead()
  const write = useIPWorldWrite()
  const events = useIPWorldEvents()
  const utils = useIPWorldUtils()

  return {
    ...base,
    read,
    write,
    events,
    utils,
  }
}
