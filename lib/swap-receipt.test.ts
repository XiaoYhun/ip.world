vi.mock("@/config", () => ({
  env: {
    // Mid-range address so token addresses can sort on either side of it.
    NEXT_PUBLIC_WRAPPED_IP_TOKEN_ADDRESS: "0x8000000000000000000000000000000000000000",
  },
}))

import { computePriceFromSqrtPriceX96, decodeSqrtPriceFromReceipt } from "./swap-receipt"

const Q96 = 1n << 96n // sqrtPriceX96 == 2^96 => ratio of exactly 1

describe("decodeSqrtPriceFromReceipt", () => {
  it("returns null when there are no logs", () => {
    expect(decodeSqrtPriceFromReceipt([])).toBeNull()
  })

  it("ignores logs that are not Swap events", () => {
    const log = { address: "0x0", topics: ["0xdeadbeef"], data: "0x" } as never
    expect(decodeSqrtPriceFromReceipt([log])).toBeNull()
  })
})

describe("computePriceFromSqrtPriceX96", () => {
  const lowerToken = "0x0000000000000000000000000000000000000001" // < wrapped IP -> isToken0
  const higherToken = "0xffffffffffffffffffffffffffffffffffffffff" // > wrapped IP -> !isToken0

  it("derives priceUsd == ipPrice when the sqrt ratio is 1 (token0 side)", () => {
    const { priceUsd, marketCapUsd } = computePriceFromSqrtPriceX96(Q96, lowerToken, 5)
    expect(priceUsd).toBeCloseTo(5, 6)
    expect(marketCapUsd).toBeCloseTo(5_000_000_000, 0)
  })

  it("derives priceUsd == ipPrice when the sqrt ratio is 1 (token1 side)", () => {
    const { priceUsd, marketCapUsd } = computePriceFromSqrtPriceX96(Q96, higherToken, 5)
    expect(priceUsd).toBeCloseTo(5, 6)
    expect(marketCapUsd).toBeCloseTo(5_000_000_000, 0)
  })

  it("scales linearly with ipPrice", () => {
    const { priceUsd } = computePriceFromSqrtPriceX96(Q96, lowerToken, 2.5)
    expect(priceUsd).toBeCloseTo(2.5, 6)
  })
})
