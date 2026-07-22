import { getRankProgress } from "./rank"

describe("getRankProgress", () => {
  it("starts in the Normie tier progressing toward Casual", () => {
    expect(getRankProgress(0)).toEqual({ nextRank: "Casual", pointsToGo: 500, progressPercent: 0 })
    expect(getRankProgress(250)).toEqual({ nextRank: "Casual", pointsToGo: 250, progressPercent: 50 })
  })

  it("rolls into the next tier exactly at the threshold", () => {
    expect(getRankProgress(500)).toEqual({ nextRank: "Degen", pointsToGo: 1500, progressPercent: 0 })
  })

  it("caps out at Legend once past the final tier", () => {
    expect(getRankProgress(15000)).toEqual({ nextRank: "Legend", pointsToGo: 0, progressPercent: 100 })
    expect(getRankProgress(99999)).toEqual({ nextRank: "Legend", pointsToGo: 0, progressPercent: 100 })
  })

  it("clamps negatives and non-numbers to zero points", () => {
    expect(getRankProgress(-100)).toEqual({ nextRank: "Casual", pointsToGo: 500, progressPercent: 0 })
    expect(getRankProgress(NaN)).toEqual({ nextRank: "Casual", pointsToGo: 500, progressPercent: 0 })
  })
})
