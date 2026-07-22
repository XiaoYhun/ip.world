import { NextRequest, NextResponse } from "next/server"
import { resolveSpaceId } from "@/lib/snapshot-server"
import { buildVoteTypedData } from "@/lib/snapshot-eip712"

/**
 * POST /api/governance/votes/prepare
 *
 * Builds EIP-712 typed data for a Snapshot vote.
 * The client signs this data with their wallet, then submits via the /submit endpoint.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tokenAddress, from, proposalId, choice, reason } = body

    if (!tokenAddress || !from || !proposalId || choice === undefined) {
      return NextResponse.json(
        { error: "tokenAddress, from, proposalId, and choice are required" },
        { status: 400 }
      )
    }

    const spaceId = await resolveSpaceId(tokenAddress)
    if (!spaceId) {
      return NextResponse.json(
        { error: "No governance space configured for this token" },
        { status: 404 }
      )
    }

    const typedData = buildVoteTypedData({
      from,
      spaceId,
      proposalId,
      choice,
      reason,
    })

    return NextResponse.json({ typedData })
  } catch (error) {
    console.error("[GOVERNANCE] Failed to prepare vote:", error)
    return NextResponse.json(
      { error: "Failed to prepare vote typed data" },
      { status: 500 }
    )
  }
}
