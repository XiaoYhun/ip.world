export interface RelayTx {
  to: string
  value: string
  data: string
}

export interface RelayQuoteParams {
  originChainId: number
  originCurrency: string
  destinationChainId?: number
  destinationCurrency?: string
  amount: string
  userAddress: string
  recipientAddress: string
  tradeType?: "EXACT_INPUT" | "EXPECTED_OUTPUT"
  destinationTxs?: RelayTx[]
}

export interface RelaySolanaInstruction {
  keys: Array<{ pubkey: string; isSigner: boolean; isWritable: boolean }>
  programId: string
  data: string
}

export interface RelayQuoteStep {
  id: string
  action: string
  description: string
  requestId?: string
  items?: Array<{
    data?: {
      to?: string
      value?: string
      data?: string
      chainId?: number
      instructions?: RelaySolanaInstruction[]
      /** Present on same-chain Jupiter-style swaps (e.g. USDC → SOL on Solana). */
      addressLookupTableAddresses?: string[]
    }
    status: string
  }>
}

export interface RelayQuoteResponse {
  steps: RelayQuoteStep[]
  fees: {
    gas: { amount: string; amountUsd: string }
    relayer: { amount: string; amountUsd: string }
  }
  details: {
    currencyIn: {
      currency: { chainId: number; address: string; symbol: string; decimals: number }
      amount: string
      amountUsd: string
    }
    currencyOut: {
      currency: { chainId: number; address: string; symbol: string; decimals: number }
      amount: string
      amountUsd: string
    }
    totalImpact: { usd: string; percent: string }
    timeEstimate: number
  }
  requestId?: string
}

export interface RelayStatusResponse {
  status: "pending" | "waiting" | "delayed" | "success" | "failure" | "refund"
  inTxHashes?: string[]
  outTxHashes?: string[]
  details?: {
    currencyIn?: { amount: string }
    currencyOut?: { amount: string }
  }
}

export interface RelayQuoteWithFallbackResult {
  quote: RelayQuoteResponse
  usedFallback: boolean
}

export interface RelayBridgeEstimate {
  estimatedIpWei: bigint
  usdPerInputToken: number
  fees: { relayUsd: string; gasUsd: string; totalUsd: string }
  raw: RelayQuoteResponse
}

export interface RelayWithdrawQuoteParams {
  destinationChainId: number
  destinationCurrency: string
  amount: string
  userAddress: string
  recipientAddress: string
}

export interface GeneralWithdrawQuoteParams {
  originChainId: number
  originCurrency: string
  destinationChainId: number
  destinationCurrency: string
  amount: string
  userAddress: string
  recipientAddress: string
}

export type StatusCallback = (status: RelayStatusResponse) => void
