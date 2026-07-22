import { Address } from "viem"

// ============================================================================
// Core IP.World Types
// ============================================================================

export interface IPData {
  id: string
  title: string
  description: string
  image: string
  alias: string[]
  category: string
  type: "creator" | "community"
  owner_account: string
  socials: SocialLink[]
  status: IPStatus
  ipa_hash?: string
  verified_at?: string
  claimed_at?: string
  owner_address?: Address
}

export interface SocialLink {
  platform: string
  url: string
  username?: string
}

export type IPStatus = "unverified" | "verified" | "claimed"

// ============================================================================
// Token Types
// ============================================================================

export interface TokenData {
  address: Address
  name: string
  symbol: string
  decimals: number
  totalSupply: bigint
  creator: Address
  ipId?: string
  poolAddress?: Address
  isLinkedToIP: boolean
  createdAt: number
}

export interface TokenInfo {
  token: Address
  pool: Address
  creator: Address
  ipaId: Address
  startTick: number
  allocationList: bigint[]
}

// ============================================================================
// Vesting Types
// ============================================================================

export interface VestingData {
  isSet: boolean
  start: bigint
  end: bigint
  remaining: bigint
  released: bigint
}

export interface VestingSchedule {
  token: Address
  beneficiary: Address
  totalAmount: bigint
  releasedAmount: bigint
  startTime: bigint
  endTime: bigint
  vestingDuration: bigint
}

// ============================================================================
// Staking Types
// ============================================================================

export interface StakeInfo {
  token: Address
  amount: bigint
  startEpoch: number
  claimableEpoch: number
  multiplier: number
}

export interface EpochInfo {
  pending: bigint
  over1Week: bigint
  over2Week: bigint
  over3Week: bigint
  over4Week: bigint
  reward: bigint
}

export interface StakingPosition {
  tokenId: bigint
  stakeInfo: StakeInfo
  claimableRewards: bigint
  currentMultiplier: number
}

// ============================================================================
// Pool & Trading Types
// ============================================================================

export interface PoolData {
  address: Address
  token0: Address
  token1: Address
  fee: number
  tickCurrent: number
  sqrtPriceX96: bigint
  liquidity: bigint
  tickSpacing: number
}

export interface LiquidityPosition {
  tokenId: bigint
  owner: Address
  token0: Address
  token1: Address
  fee: number
  tickLower: number
  tickUpper: number
  liquidity: bigint
  tokensOwed0: bigint
  tokensOwed1: bigint
}

export interface SwapParams {
  tokenIn: Address
  tokenOut: Address
  fee: number
  recipient: Address
  deadline: bigint
  amountIn: bigint
  amountOutMinimum: bigint
  sqrtPriceLimitX96: bigint
}

// ============================================================================
// Transaction Types
// ============================================================================

export interface TransactionOptions<T = unknown> {
  onPending?: () => void
  onSuccess?: (result: T) => void
  onError?: (error: TransactionError) => void
  successMessage?: string
  errorMessage?: string
  pendingMessage?: string
  loadingMessage?: string
}

export interface TransactionState {
  isPending: boolean
  isConfirming: boolean
  isSuccess: boolean
  isError: boolean
  error: TransactionError | null
  hash: string | undefined
}

export interface CreateIPParams {
  title: string
  description: string
  alias: string
  image: string
  type: "creator" | "community"
  owner_account: string
  socials: SocialLink[]
  category: string
}

export interface CreateTokenParams {
  name: string
  symbol: string
  startTick: number
  ipaId?: Address
  buyAmount?: bigint
}

export interface PreregisterIPParams {
  ipaHash: string
  deadline: bigint
  signature: SignatureData
}

export interface ClaimIPParams {
  ipaId: Address
  recipient: Address
  deadline: bigint
  signature: SignatureData
}

export interface LinkTokenParams {
  ipaId: Address
  tokenList: Address[]
  deadline: bigint
  signature: SignatureData
}

// ============================================================================
// Signature Types (EIP-712)
// ============================================================================

export interface SignatureData {
  v: number
  r: string
  s: string
}

export interface CreateTokenSignature extends SignatureData {
  deadline: bigint
  startTick: number
}

export interface PreregisterSignature extends SignatureData {
  deadline: bigint
  ipaHash: string
  sender: Address
  nonce: number
}

export interface ClaimIPSignature extends SignatureData {
  deadline: bigint
  ipaId: Address
  recipient: Address
  nonce: number
}

// ============================================================================
// Fee & Rewards Types
// ============================================================================

export interface FeeData {
  token: Address
  amount0: bigint
  amount1: bigint
  timestamp: bigint
}

export interface RewardData {
  token: Address
  amount: bigint
  recipient: Address
  type: "vesting" | "staking" | "lp_fees"
  claimableAt: bigint
}

export interface HarvestResult {
  token: Address
  feesCollected: FeeData
  distributed: {
    toOwner: bigint
    toStakers: bigint
    toPlatform: bigint
  }
}

// ============================================================================
// Error Types
// ============================================================================

export interface ContractError {
  name: string
  message: string
  code?: string
  data?: unknown
}

export interface TransactionError extends ContractError {
  hash?: string
  blockNumber?: bigint
  transactionIndex?: number
}

// ============================================================================
// Event Types
// ============================================================================

export interface TokenDeployedEvent {
  tokenCreator: Address
  token: Address
  pool: Address
  startTick: number
}

export interface IPClaimedEvent {
  ipaId: Address
  recipient: Address
  timestamp: bigint
}

export interface VestingCreatedEvent {
  token: Address
  beneficiary: Address
  amount: bigint
  startTime: bigint
  endTime: bigint
}

export interface StakeCreatedEvent {
  tokenId: bigint
  staker: Address
  token: Address
  amount: bigint
  startEpoch: number
}

export interface HarvestEvent {
  token: Address
  amount0: bigint
  amount1: bigint
  recipient: Address
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface ContractConfig {
  address: Address
  abi: unknown[]
  chainId: number
}

export interface NetworkConfig {
  chainId: number
  name: string
  rpcUrl: string
  explorerUrl: string
  contracts: Record<string, Address>
}

// ============================================================================
// API Response Types
// ============================================================================

export interface APIResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = unknown> extends APIResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ============================================================================
// Hook Return Types
// ============================================================================

export interface ContractReadResult<T = unknown> {
  data: T | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
}

export interface ContractWriteResult {
  writeContract: (args: unknown) => void
  data: string | undefined
  isPending: boolean
  isSuccess: boolean
  isError: boolean
  error: Error | null
}

export interface TransactionResult {
  hash: string | undefined
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
  error: Error | null
  receipt: unknown | undefined
}

// ============================================================================
// Utility Types
// ============================================================================

export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

// ============================================================================
// Constants
// ============================================================================

export const PRECISION = BigInt(1000000)
export const MAX_LP = 4
export const V3_FEE = 3000
export const TOTAL_SUPPLY = BigInt(1000000000) * BigInt(10) ** BigInt(18) // 1B tokens
export const IP_OWNER_SHARE = BigInt(30000) // 3% in basis points
export const VESTING_DURATION = 90 * 24 * 60 * 60 // 90 days in seconds
