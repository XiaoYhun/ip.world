import { type Address, encodeFunctionData } from "viem"
import { env } from "@/config"
import StoryHuntSwapRouterABI from "@/config/SwapRouter.abi.json"
import type { RelayTx } from "./types"

const GAS_RESERVE_AMOUNT = BigInt(5) * BigInt(10) ** BigInt(16) // 0.05 IP

interface BuildStorySwapParams {
  tokenAddress: Address
  amountIn: bigint
  amountOutMin: bigint
  recipient: Address
  needsGasReserve?: boolean
  fee?: bigint
}

/**
 * Builds the StoryHunt SwapRouter multicall transaction data for Relay's
 * destination `txs` parameter. Encodes the buy-mode multicall:
 * exactInputSingle + sweepToken (WIP) + sweepToken (meme) + refundIP.
 *
 * When `needsGasReserve` is true, a small native IP transfer is prepended
 * so the user's embedded wallet receives gas for subsequent transactions.
 */
export function buildStorySwapTxs({
  tokenAddress,
  amountIn,
  amountOutMin,
  recipient,
  needsGasReserve = false,
  fee: externalFee,
}: BuildStorySwapParams): RelayTx[] {
  const swapRouter = env.NEXT_PUBLIC_STORYHUNT_SWAP_ROUTER
  const wrappedIp = env.NEXT_PUBLIC_WRAPPED_IP_TOKEN_ADDRESS
  const fee = externalFee ?? BigInt(env.NEXT_PUBLIC_V3_FEE)

  const reserveAmount =
    needsGasReserve && amountIn > GAS_RESERVE_AMOUNT * BigInt(2)
      ? GAS_RESERVE_AMOUNT
      : BigInt(0)
  const swapAmount = amountIn - reserveAmount

  const exactInputSingleParams = {
    tokenIn: wrappedIp,
    tokenOut: tokenAddress,
    fee,
    recipient: swapRouter,
    deadline: Math.floor(Date.now() / 1000) + 60 * 10,
    amountIn: swapAmount,
    amountOutMinimum: amountOutMin,
    sqrtPriceLimitX96: BigInt(0),
  }

  const multicallData = encodeFunctionData({
    abi: StoryHuntSwapRouterABI,
    functionName: "multicall",
    args: [
      [
        encodeFunctionData({
          abi: StoryHuntSwapRouterABI,
          functionName: "exactInputSingle",
          args: [exactInputSingleParams],
        }),
        encodeFunctionData({
          abi: StoryHuntSwapRouterABI,
          functionName: "sweepToken",
          args: [wrappedIp, BigInt(0), recipient],
        }),
        encodeFunctionData({
          abi: StoryHuntSwapRouterABI,
          functionName: "sweepToken",
          args: [tokenAddress, BigInt(0), recipient],
        }),
        encodeFunctionData({
          abi: StoryHuntSwapRouterABI,
          functionName: "refundIP",
          args: [],
        }),
      ],
    ],
  })

  const txs: RelayTx[] = []

  if (reserveAmount > BigInt(0)) {
    txs.push({ to: recipient, value: reserveAmount.toString(), data: "0x" })
  }

  txs.push({ to: swapRouter, value: swapAmount.toString(), data: multicallData })

  return txs
}
