import { NextRequest, NextResponse } from "next/server"
import { submitToSnapshotHub } from "@/lib/snapshot-eip712"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://dev-api.ip.world/api/v1"

/**
 * POST /api/governance/proposals/cancel/submit
 *
 * Submits a signed proposal cancellation to Snapshot, then records the veto in the backend.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { address, sig, typedData, proposalId } = body

    if (!address || !sig || !typedData) {
      return NextResponse.json(
        { error: "address, sig, and typedData are required" },
        { status: 400 }
      )
    }

    // Submit cancellation to Snapshot hub
    await submitToSnapshotHub({
      address,
      sig,
      data: typedData,
    })

    // Record the veto in the backend so the executor doesn't try to execute it
    const snapshotProposalId = proposalId || typedData?.message?.proposal
    if (snapshotProposalId) {
      try {
        await fetch(`${API_BASE_URL}/community-governance/proposals/${snapshotProposalId}/veto`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ caller_address: address }),
          signal: AbortSignal.timeout(10000),
        })
      } catch (error) {
        // Non-fatal: the backend safety check will handle orphaned cancellations
        console.warn("[GOVERNANCE] Failed to record veto in backend:", error)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[GOVERNANCE] Failed to submit cancellation:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: `Failed to submit cancellation: ${message}` },
      { status: 500 }
    )
  }
}
