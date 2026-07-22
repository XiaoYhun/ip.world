import { NextRequest, NextResponse } from "next/server"
import { resolveSpaceId, fetchVotesByVoter } from "@/lib/snapshot-server"

/**
 * GET /api/governance/votes?tokenAddress=0x...&voter=0x...&proposalIds=id1,id2
 *
 * Fetches a voter's votes for a specific token's governance space.
 * Space ID is resolved server-side.
 */
export async function GET(request: NextRequest) {
  const tokenAddress = request.nextUrl.searchParams.get("tokenAddress")
  const voter = request.nextUrl.searchParams.get("voter")
  const proposalIdsParam = request.nextUrl.searchParams.get("proposalIds")

  if (!tokenAddress || !voter) {
    return NextResponse.json(
      { error: "tokenAddress and voter are required" },
      { status: 400 }
    )
  }

  try {
    const spaceId = await resolveSpaceId(tokenAddress)
    if (!spaceId) {
      return NextResponse.json({ votes: [] })
    }

    const proposalIds = proposalIdsParam ? proposalIdsParam.split(",") : undefined
    const votes = await fetchVotesByVoter(spaceId, voter, proposalIds)

    return NextResponse.json({ votes })
  } catch (error) {
    console.error("[GOVERNANCE] Failed to fetch votes:", error)
    return NextResponse.json(
      { error: "Failed to fetch votes" },
      { status: 500 }
    )
  }
}
