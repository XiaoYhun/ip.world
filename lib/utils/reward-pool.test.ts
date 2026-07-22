import { resolveRewardPoolUsd } from "./reward-pool"

describe("resolveRewardPoolUsd", () => {
  it("prefers drafted backend pool amount over computed and total values", () => {
    expect(
      resolveRewardPoolUsd({
        draftedPoolUsd: 2937,
        computedCurrentPoolUsd: 5879,
        fallbackTotalPoolUsd: 7646,
      })
    ).toBe(2937)
  })

  it("falls back to computed current pool when drafted amount is unavailable", () => {
    expect(
      resolveRewardPoolUsd({
        draftedPoolUsd: undefined,
        computedCurrentPoolUsd: 5879,
        fallbackTotalPoolUsd: 7646,
      })
    ).toBe(5879)
  })

  it("falls back to total pool when only total is available", () => {
    expect(
      resolveRewardPoolUsd({
        draftedPoolUsd: undefined,
        computedCurrentPoolUsd: undefined,
        fallbackTotalPoolUsd: 7646,
      })
    ).toBe(7646)
  })
})
