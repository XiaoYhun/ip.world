import { NextRequest, NextResponse } from "next/server"
import { submitToSnapshotHub } from "@/lib/snapshot-eip712"

/**
 * POST /api/governance/proposals/submit
 *
 * Submits a signed Snapshot proposal to the hub.
 * The client must have signed the typed data from /prepare with their wallet.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { address, sig, typedData } = body

    if (!address || !sig || !typedData) {
      return NextResponse.json(
        { error: "address, sig, and typedData are required" },
        { status: 400 }
      )
    }

    const result = await submitToSnapshotHub({
      address,
      sig,
      data: typedData,
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error("[GOVERNANCE] Failed to submit proposal:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: `Failed to submit proposal: ${message}` },
      { status: 500 }
    )
  }
}
