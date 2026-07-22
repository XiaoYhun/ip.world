import { RELAY_SOLANA_CHAIN_ID, RELAY_STORY_CHAIN_ID } from "./relay-chains"

export interface WithdrawChain {
  readonly chainId: number
  readonly name: string
  readonly isEvm: boolean
}

export const STORY_CHAIN: WithdrawChain = {
  chainId: RELAY_STORY_CHAIN_ID,
  name: "Story",
  isEvm: true,
}

export const SOLANA_CHAIN: WithdrawChain = {
  chainId: RELAY_SOLANA_CHAIN_ID,
  name: "Solana",
  isEvm: false,
}

export const WITHDRAW_DESTINATION_CHAINS: readonly WithdrawChain[] = [
  STORY_CHAIN,
  SOLANA_CHAIN,
] as const

export function getChainById(chainId: number): WithdrawChain | undefined {
  return WITHDRAW_DESTINATION_CHAINS.find((c) => c.chainId === chainId)
}
