// Import existing ABIs
import IPOwnerVaultABI from "@/config/IPOwnerVault.abi.json"
import IPTokenABI from "@/config/IPToken.abi.json"
import IPWorldABI from "@/config/IPWorld.abi.json"
import IPWorldOwnerVaultABI from "@/config/IPWorldOwnerVault.abi.json"
import IPWorldStakingVaultABI from "@/config/IPWorldStakingVault.abi.json"
import IWrappedABI from "@/config/IWrapped.abi.json"
import Multicall3ABI from "@/config/Multicall3.abi.json"
import OperatorABI from "@/config/Operator.abi.json"
import StoryHuntV3PoolABI from "@/config/StoryHuntV3Pool.abi.json"
import SwapRouterABI from "@/config/SwapRouter.abi.json"
import Safe from "@/config/Safe.abi.json"

// Export ABIs with consistent naming
export const ABIS = {
  IPWorld: IPWorldABI,
  Operator: OperatorABI,
  IPToken: IPTokenABI,
  IPOwnerVault: IPOwnerVaultABI,
  IPWorldOwnerVault: IPWorldOwnerVaultABI,
  IPWorldStakingVault: IPWorldStakingVaultABI,
  WrappedIP: IWrappedABI,
  SwapRouter: SwapRouterABI,
  StoryHuntV3Pool: StoryHuntV3PoolABI,
  Multicall3: Multicall3ABI,
  Safe: Safe,
} as const

// Individual exports for convenience
export {
  IPWorldABI,
  OperatorABI,
  IPOwnerVaultABI,
  IPTokenABI,
  IPWorldOwnerVaultABI,
  IPWorldStakingVaultABI,
  IWrappedABI as WrappedIPABI,
  SwapRouterABI,
  StoryHuntV3PoolABI,
  Multicall3ABI,
  Safe,
}

// Type helpers
export type ContractABI = (typeof ABIS)[keyof typeof ABIS]
export type ContractABIName = keyof typeof ABIS
