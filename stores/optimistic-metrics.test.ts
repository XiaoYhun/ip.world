import {
  clearOptimisticMetric,
  getOptimisticMetric,
  setOptimisticMetric,
  type OptimisticMetric,
} from "./optimistic-metrics"

const ADDRESS = "0xAbCdEf0000000000000000000000000000000001"
const metric: OptimisticMetric = { priceUsd: 1.23, marketCapUsd: 4567, timestamp: 1_700_000_000_000 }

describe("optimistic-metrics store", () => {
  afterEach(() => {
    clearOptimisticMetric(ADDRESS)
  })

  it("stores and retrieves a metric", () => {
    setOptimisticMetric(ADDRESS, metric)
    expect(getOptimisticMetric(ADDRESS)).toEqual(metric)
  })

  it("looks up addresses case-insensitively", () => {
    setOptimisticMetric(ADDRESS.toUpperCase(), metric)
    expect(getOptimisticMetric(ADDRESS.toLowerCase())).toEqual(metric)
  })

  it("clears a stored metric", () => {
    setOptimisticMetric(ADDRESS, metric)
    clearOptimisticMetric(ADDRESS)
    expect(getOptimisticMetric(ADDRESS)).toBeUndefined()
  })

  it("returns undefined for unknown addresses", () => {
    expect(getOptimisticMetric("0x0000000000000000000000000000000000000000")).toBeUndefined()
  })
})
