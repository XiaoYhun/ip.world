import { NextRequest, NextResponse } from "next/server"
import { resolveSpaceId } from "@/lib/snapshot-server"
import { buildCancelTypedData } from "@/lib/snapshot-eip712"

/**
 * POST /api/governance/proposals/cancel/prepare
 *
 * Builds EIP-712 typed data for cancelling (vetoing) a Snapshot proposal.
 * Only the IP owner (moderator) or platform admin can cancel proposals.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tokenAddress, from, proposalId } = body

    if (!tokenAddress || !from || !proposalId) {
      return NextResponse.json(
        { error: "tokenAddress, from, and proposalId are required" },
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

    const typedData = buildCancelTypedData({
      from,
      spaceId,
      proposalId,
    })

    return NextResponse.json({ typedData })
  } catch (error) {
    console.error("[GOVERNANCE] Failed to prepare cancellation:", error)
    return NextResponse.json(
      { error: "Failed to prepare cancellation typed data" },
      { status: 500 }
    )
  }
}
