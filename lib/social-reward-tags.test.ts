import { buildFeedIndexingTagPool, buildTokenSocialRewardTags } from "./social-reward-tags"

describe("social reward tag helpers", () => {
  it("builds the user-facing token reward tags from remix name and ticker", () => {
    expect(
      buildTokenSocialRewardTags({
        tokenName: "KTV Baddies!",
        tokenSymbol: "ktv",
        ipName: "KTV Baddies",
      })
    ).toEqual({
      tiktokTag: "#KtvBaddies\u30b7",
      xTag: "$KTV",
    })
  })

  it("builds the feed indexing tag pool from backend first-create search rules", () => {
    expect(
      buildFeedIndexingTagPool({
        tokenName: "KTV Baddies",
        tokenSymbol: "ktv",
        ipName: "KTV",
        category: "meme",
      })
    ).toEqual(["#ktv", "#ktv\u30b7", "#KtvBaddies", "#KtvBaddies\u30b7", "$KTV"])
  })

  it("dedupes token and IP tags after TikTok normalization", () => {
    expect(
      buildFeedIndexingTagPool({
        tokenName: "KTV Baddies",
        tokenSymbol: "ktv",
        ipName: "ktv    baddies!",
      })
    ).toEqual(["#KtvBaddies", "#KtvBaddies\u30b7", "$KTV"])
  })
})
