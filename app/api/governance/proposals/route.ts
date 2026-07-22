import { NextRequest, NextResponse } from "next/server"
import { resolveSpaceId, fetchProposalsBySpace } from "@/lib/snapshot-server"

/**
 * GET /api/governance/proposals?tokenAddress=0x...
 *
 * Fetches Snapshot proposals for a token's governance space.
 * The space ID is resolved server-side so it's never exposed to the client.
 */
export async function GET(request: NextRequest) {
  const tokenAddress = request.nextUrl.searchParams.get("tokenAddress")

  if (!tokenAddress) {
    return NextResponse.json({ error: "tokenAddress is required" }, { status: 400 })
  }

  try {
    const spaceId = await resolveSpaceId(tokenAddress)
    if (!spaceId) {
      return NextResponse.json({ proposals: [] })
    }

    const proposals = await fetchProposalsBySpace(spaceId)

    // Strip space.id from the response to avoid leaking it
    const sanitizedProposals = proposals.map(({ space, ...rest }) => ({
      ...rest,
      space: { name: space.name },
    }))

    return NextResponse.json({ proposals: sanitizedProposals })
  } catch (error) {
    console.error("[GOVERNANCE] Failed to fetch proposals:", error)
    return NextResponse.json(
      { error: "Failed to fetch proposals" },
      { status: 500 }
    )
  }
}
