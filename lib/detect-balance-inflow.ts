import type { PaymentCurrency } from "@/config/relay-chains"

/** Raw chain balances used to compare before/after for deposit detection. */
export interface RawBalanceSnapshot {
  ip: bigint
  sol: bigint
  storyUsdc: bigint
  solanaUsdc: bigint
}

/** ~0.0001 IP at 18 decimals */
const IP_INCREASE_MIN = BigInt(10) ** BigInt(14)
/** ~0.001 SOL */
const SOL_INCREASE_MIN = BigInt(1_000_000)
/** 0.01 USDC (6 decimals) combined Story + Solana */
const USDC_INCREASE_MIN = BigInt(10_000)

export type BalanceInflowDetectMode = "depositModal" | "ambient"

export interface BalanceInflowDetectContext {
  mode: BalanceInflowDetectMode
  /** For resolving multi-asset increases in deposit modal (optional). */
  ipPriceUsd?: number
  solPriceUsd?: number
}

function usdDeltaIp(dIp: bigint, ipPriceUsd: number): number {
  if (!ipPriceUsd || ipPriceUsd <= 0) return 0
  return (Number(dIp) / 1e18) * ipPriceUsd
}

function usdDeltaSol(dSol: bigint, solPriceUsd: number): number {
  if (!solPriceUsd || solPriceUsd <= 0) return 0
  return (Number(dSol) / 1e9) * solPriceUsd
}

function usdDeltaUsdc(dUsdcRaw: bigint): number {
  return Number(dUsdcRaw) / 1e6
}

/**
 * If exactly one of IP / SOL / combined USDC increased meaningfully, return that currency.
 * Ambient mode requires a single winner (avoids mis-classifying swaps).
 * Deposit modal allows multiple increases and picks the largest USD-weighted delta when prices exist.
 */
export function detectBalanceInflow(
  prev: RawBalanceSnapshot,
  next: RawBalanceSnapshot,
  ctx: BalanceInflowDetectContext
): PaymentCurrency | null {
  const dIp = next.ip - prev.ip
  const dSol = next.sol - prev.sol
  const dStory = next.storyUsdc - prev.storyUsdc
  const dSolana = next.solanaUsdc - prev.solanaUsdc
  const dUsdc = dStory + dSolana

  const ipPos = dIp >= IP_INCREASE_MIN
  const solPos = dSol >= SOL_INCREASE_MIN
  const usdcPos = dUsdc >= USDC_INCREASE_MIN

  const winners = (ipPos ? 1 : 0) + (solPos ? 1 : 0) + (usdcPos ? 1 : 0)
  if (winners === 0) return null

  if (ctx.mode === "ambient") {
    if (winners !== 1) return null
    if (ipPos) return "IP"
    if (solPos) return "SOL"
    return "USDC"
  }

  // depositModal
  if (winners === 1) {
    if (ipPos) return "IP"
    if (solPos) return "SOL"
    return "USDC"
  }

  const ipP = ctx.ipPriceUsd ?? 0
  const solP = ctx.solPriceUsd ?? 0
  const scoreIp = usdDeltaIp(dIp, ipP)
  const scoreSol = usdDeltaSol(dSol, solP)
  const scoreUsdc = usdDeltaUsdc(dUsdc)

  if (scoreIp <= 0 && scoreSol <= 0 && scoreUsdc <= 0) return null

  if (scoreIp >= scoreSol && scoreIp >= scoreUsdc && ipPos) return "IP"
  if (scoreSol >= scoreIp && scoreSol >= scoreUsdc && solPos) return "SOL"
  if (usdcPos) return "USDC"
  if (ipPos) return "IP"
  if (solPos) return "SOL"
  return null
}
