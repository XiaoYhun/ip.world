import { NextRequest, NextResponse } from "next/server"
import { resolveSpaceId } from "@/lib/snapshot-server"
import { buildProposalTypedData } from "@/lib/snapshot-eip712"
import { getVotingPeriodSeconds } from "@/lib/governance-constants"

/**
 * POST /api/governance/proposals/prepare
 *
 * Builds EIP-712 typed data for a Snapshot proposal.
 * The client signs this data with their wallet, then submits via the /submit endpoint.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      tokenAddress,
      from,
      type,
      title,
      body: proposalBody,
      discussion,
      choices,
      start,
      end,
      snapshot,
      plugins,
    } = body

    if (!tokenAddress || !from || !title) {
      return NextResponse.json(
        { error: "tokenAddress, from, and title are required" },
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

    const typedData = buildProposalTypedData({
      from,
      spaceId,
      type: type || "single-choice",
      title,
      body: proposalBody || "",
      discussion: discussion || "",
      choices: choices || ["For", "Against", "Abstain"],
      start: start || Math.floor(Date.now() / 1000),
      end: end || Math.floor(Date.now() / 1000) + getVotingPeriodSeconds(),
      snapshot: snapshot || 0,
      plugins: typeof plugins === "string" ? plugins : JSON.stringify(plugins || {}),
    })

    return NextResponse.json({ typedData })
  } catch (error) {
    console.error("[GOVERNANCE] Failed to prepare proposal:", error)
    return NextResponse.json(
      { error: "Failed to prepare proposal typed data" },
      { status: 500 }
    )
  }
}
