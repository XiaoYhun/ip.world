"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  type Abi,
  type Address,
  encodeAbiParameters,
  getContractAddress,
  keccak256,
} from "viem"
import { usePublicClient } from "wagmi"
import { env, MULTICALL3_ADDRESS } from "@/config"
import StoryHuntV3FactoryABI from "@/config/StoryHuntV3Factory.abi.json"

const factoryAbi = StoryHuntV3FactoryABI as Abi

const SUPPORTED_FEES = [3000, 10000, 500, 100] as const

const POOL_INIT_CODE_HASH: `0x${string}` =
  "0xd5178f9f07b08d01d075cc5b7e1a1ae23a37b3811522cb2fed1367201d51d4e5"

const POOL_LIQUIDITY_ABI = [
  {
    type: "function" as const,
    name: "liquidity" as const,
    inputs: [],
    outputs: [{ name: "", type: "uint128" as const }],
    stateMutability: "view" as const,
  },
]

let cachedDeployer: Address | null = null

function computePoolAddress(
  deployer: Address,
  tokenA: string | Address,
  tokenB: string | Address,
  fee: number
): Address {
  const a = tokenA.toLowerCase() as Address
  const b = tokenB.toLowerCase() as Address
  const [token0, token1] = a < b ? [a, b] : [b, a]

  const salt = keccak256(
    encodeAbiParameters(
      [{ type: "address" }, { type: "address" }, { type: "uint24" }],
      [token0 as Address, token1 as Address, fee]
    )
  )

  return getContractAddress({
    bytecodeHash: POOL_INIT_CODE_HASH,
    from: deployer,
    opcode: "CREATE2",
    salt,
  })
}

interface PoolFeeResult {
  poolAddress: Address | undefined
  fee: bigint
  isLoading: boolean
}

/**
 * Discovers the Uniswap V3 pool with the best liquidity for a WIP/token pair
 * in a single RPC multicall.
 *
 * Pool addresses are computed locally via CREATE2 (no getPool calls needed).
 * A single multicall queries liquidity() on all 4 fee-tier addresses at once.
 * Non-existent pools return errors which are handled gracefully.
 */
export function usePoolFee(tokenAddress: string | Address) {
  const publicClient = usePublicClient()
  const [result, setResult] = useState<PoolFeeResult>({
    poolAddress: undefined,
    fee: BigInt(env.NEXT_PUBLIC_V3_FEE),
    isLoading: true,
  })
  const lastTokenRef = useRef<string>("")

  useEffect(() => {
    if (!tokenAddress || !publicClient) {
      setResult({ poolAddress: undefined, fee: BigInt(env.NEXT_PUBLIC_V3_FEE), isLoading: false })
      return
    }

    const tokenKey = typeof tokenAddress === "string" ? tokenAddress.toLowerCase() : tokenAddress
    if (tokenKey === lastTokenRef.current) return
    lastTokenRef.current = tokenKey

    let cancelled = false

    async function discover() {
      try {
        setResult((prev) => ({ ...prev, isLoading: true }))
        console.log("[poolFeeDebug] === START discover for", tokenAddress, "===")

        if (!cachedDeployer) {
          const deployer = await publicClient!.readContract({
            address: env.NEXT_PUBLIC_STORYHUNT_V3_FACTORY,
            abi: factoryAbi,
            functionName: "poolDeployer",
          })
          cachedDeployer = deployer as Address
          console.log("[poolFeeDebug] deployer:", cachedDeployer)
        }

        if (cancelled) { console.log("[poolFeeDebug] cancelled after deployer"); return }

        const wip = env.NEXT_PUBLIC_WRAPPED_IP_TOKEN_ADDRESS as Address
        console.log("[poolFeeDebug] token:", tokenAddress, "wip:", wip)

        const pools = SUPPORTED_FEES.map((fee) => {
          const addr = computePoolAddress(cachedDeployer!, wip, tokenAddress, fee)
          console.log(`[poolFeeDebug] fee=${fee} → computed: ${addr}`)
          return { address: addr, fee }
        })

        console.log("[poolFeeDebug] fetching factory getPool for cross-check...")
        const factoryResults = await publicClient!.multicall({
          multicallAddress: MULTICALL3_ADDRESS,
          contracts: SUPPORTED_FEES.map((fee) => ({
            address: env.NEXT_PUBLIC_STORYHUNT_V3_FACTORY,
            abi: factoryAbi,
            functionName: "getPool",
            args: [wip, tokenAddress, fee],
          })),
          allowFailure: true,
        })
        for (let i = 0; i < SUPPORTED_FEES.length; i++) {
          const res = factoryResults[i]
          const factoryAddr = res.status === "success" ? res.result : `FAILED(${res.error})`
          const match = typeof factoryAddr === "string" && factoryAddr.toLowerCase() === pools[i].address.toLowerCase()
          console.log(
            `[poolFeeDebug] fee=${SUPPORTED_FEES[i]} | computed=${pools[i].address} | factory=${factoryAddr} | match=${match}`
          )
        }

        console.log("[poolFeeDebug] fetching liquidity for all 4 computed addresses...")
        const liqResults = await publicClient!.multicall({
          multicallAddress: MULTICALL3_ADDRESS,
          contracts: pools.map((p) => ({
            address: p.address,
            abi: POOL_LIQUIDITY_ABI,
            functionName: "liquidity" as const,
          })),
          allowFailure: true,
        })
        console.log("[poolFeeDebug] liquidity multicall returned")

        if (cancelled) { console.log("[poolFeeDebug] cancelled after liquidity"); return }

        let bestIdx = -1
        let bestLiquidity = BigInt(0)

        for (let i = 0; i < pools.length; i++) {
          const res = liqResults[i]
          const liq = res.status === "success" && res.result != null ? BigInt(res.result.toString()) : BigInt(0)
          const status = res.status === "success" ? "ok" : `fail(${res.status === "failure" ? res.error : "unknown"})`
          console.log(
            `[poolFeeDebug] fee=${pools[i].fee} | addr=${pools[i].address} | liquidity=${liq.toString()} | status=${status}`
          )
          if (res.status === "success" && res.result != null && liq > bestLiquidity) {
            bestLiquidity = liq
            bestIdx = i
          }
        }

        if (bestIdx === -1) {
          console.log("[poolFeeDebug] RESULT: no pool found, using default fee")
          if (!cancelled) setResult({ poolAddress: undefined, fee: BigInt(env.NEXT_PUBLIC_V3_FEE), isLoading: false })
        } else {
          const best = pools[bestIdx]
          console.log(
            `[poolFeeDebug] RESULT: ✓ fee=${best.fee} addr=${best.address} liquidity=${bestLiquidity.toString()}`
          )
          if (!cancelled) setResult({ poolAddress: best.address, fee: BigInt(best.fee), isLoading: false })
        }
        console.log("[poolFeeDebug] === END discover ===")
      } catch (err) {
        console.error("[poolFeeDebug] ERROR in discover:", err)
        if (!cancelled) setResult({ poolAddress: undefined, fee: BigInt(env.NEXT_PUBLIC_V3_FEE), isLoading: false })
      }
    }

    discover()

    return () => {
      cancelled = true
    }
  }, [tokenAddress, publicClient])

  return useMemo(() => result, [result])
}
