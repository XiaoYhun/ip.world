import { NextRequest, NextResponse } from "next/server"
import { fetchTopVoters } from "@/lib/snapshot-server"

/**
 * GET /api/governance/top-voters?proposalId=0x...&limit=3
 *
 * Fetches top voters for a proposal, ordered by voting power.
 * No space ID needed since we query directly by proposal ID.
 */
export async function GET(request: NextRequest) {
  const proposalId = request.nextUrl.searchParams.get("proposalId")
  const limitParam = request.nextUrl.searchParams.get("limit")
  const limit = limitParam ? parseInt(limitParam, 10) : 3

  if (!proposalId) {
    return NextResponse.json(
      { error: "proposalId is required" },
      { status: 400 }
    )
  }

  try {
    const votes = await fetchTopVoters(proposalId, limit)
    return NextResponse.json({ votes })
  } catch (error) {
    console.error("[GOVERNANCE] Failed to fetch top voters:", error)
    return NextResponse.json(
      { error: "Failed to fetch top voters" },
      { status: 500 }
    )
  }
}
