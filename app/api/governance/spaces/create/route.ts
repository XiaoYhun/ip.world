import { NextRequest, NextResponse } from "next/server"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://dev-api.ip.world/api/v1"

const MAX_RETRIES = 3
const RETRY_BASE_DELAY_MS = 2000

/**
 * POST /api/governance/spaces/create
 *
 * Fire-and-forget endpoint called after a new token is created for a verified IP.
 * Creates the ENS subdomain and Snapshot space for the token's governance.
 *
 * Steps:
 * 1. Verify the IP is verified (has safe_address + handle)
 * 2. Create token-level ENS sub-subdomain with retries
 * 3. Create private Snapshot space with retries
 * 4. Register as child of ip-world.eth (non-fatal)
 * 5. Update the remix record with the space ID
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization header is required" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { tokenAddress, ipId, tokenSymbol } = body

    if (!tokenAddress || !ipId) {
      return NextResponse.json(
        { error: "tokenAddress and ipId are required" },
        { status: 400 }
      )
    }

    // Step 1: Verify IP is verified and has governance infrastructure
    const ipResponse = await fetch(`${API_BASE_URL}/ips/${ipId}`, {
      signal: AbortSignal.timeout(10000),
    })

    if (!ipResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch IP data" },
        { status: 500 }
      )
    }

    const ipData = await ipResponse.json()
    const safeAddress = ipData?.safe_address
    const ipHandle = ipData?.handle || ipData?.alias

    if (!safeAddress || !ipHandle) {
      return NextResponse.json({
        skipped: true,
        reason: "IP not verified or governance not configured",
      })
    }

    // Ensure GOVERNANCE_DEPLOYER_KEY is available
    if (!process.env.GOVERNANCE_DEPLOYER_KEY) {
      console.warn(
        "[GOVERNANCE-SPACES] GOVERNANCE_DEPLOYER_KEY not configured — cannot auto-create space"
      )
      return NextResponse.json({
        skipped: true,
        reason: "Deployer key not configured",
      })
    }

    // Lazy-import to keep the module tree-shakeable and avoid loading
    // viem/snapshot.js unless this endpoint is actually hit
    const {
      createTokenENSSubdomain,
      createTokenSnapshotSpace,
      registerChildSpace,
      buildTokenSpaceId,
    } = await import("@/lib/governance-setup")

    const cleanIpHandle = ipHandle
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")

    const spaceId = buildTokenSpaceId(tokenAddress, tokenSymbol || "token", cleanIpHandle)

    // Step 2: Create ENS subdomain (with retries)
    let ensCreated = false
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        await createTokenENSSubdomain({
          ipSubdomain: cleanIpHandle,
          tokenAddress,
          tokenSymbol: tokenSymbol || "token",
        })
        ensCreated = true
        break
      } catch (error) {
        console.warn(
          `[GOVERNANCE-SPACES] ENS attempt ${attempt + 1}/${MAX_RETRIES} failed:`,
          error instanceof Error ? error.message : error
        )
        if (attempt < MAX_RETRIES - 1) {
          await new Promise((r) =>
            setTimeout(r, RETRY_BASE_DELAY_MS * (attempt + 1))
          )
        }
      }
    }

    if (!ensCreated) {
      console.error(
        `[GOVERNANCE-SPACES] ENS creation failed after ${MAX_RETRIES} attempts for ${spaceId}`
      )
      return NextResponse.json(
        { error: "ENS subdomain creation failed" },
        { status: 500 }
      )
    }

    // Step 3: Create Snapshot space (with retries)
    let spaceCreated = false
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        await createTokenSnapshotSpace({
          ipName: ipData?.title || ipHandle,
          ipHandle: cleanIpHandle,
          ipDescription: ipData?.description || "",
          ipImageURL: ipData?.image || "",
          tokenAddress,
          tokenSymbol: tokenSymbol || "TOKEN",
          safeAddress,
          spaceId,
          ipOwnerAddress: ipData?.owner_address,
        })
        spaceCreated = true
        break
      } catch (error) {
        console.warn(
          `[GOVERNANCE-SPACES] Snapshot space attempt ${attempt + 1}/${MAX_RETRIES} failed:`,
          error instanceof Error ? error.message : error
        )
        if (attempt < MAX_RETRIES - 1) {
          await new Promise((r) =>
            setTimeout(r, RETRY_BASE_DELAY_MS * (attempt + 1))
          )
        }
      }
    }

    if (!spaceCreated) {
      console.error(
        `[GOVERNANCE-SPACES] Snapshot space creation failed after ${MAX_RETRIES} attempts for ${spaceId}`
      )
      return NextResponse.json(
        { error: "Snapshot space creation failed" },
        { status: 500 }
      )
    }

    // Step 4: Register as child space of ip-world.eth
    await registerChildSpace(spaceId)

    // Step 5: Persist the space ID on the remix record via self-validating authenticated endpoint
    const updateResponse = await fetch(
      `${API_BASE_URL}/remixes/${tokenAddress}/snapshot-space`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({ snapshot_space_id: spaceId }),
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text().catch(() => "unknown")
      console.error(`[GOVERNANCE-SPACES] Failed to update remix record: ${updateResponse.status} ${errorText}`)
      return NextResponse.json(
        { error: `Failed to persist space ID: ${updateResponse.status}` },
        { status: 500 }
      )
    }

    console.log(
      `[GOVERNANCE-SPACES] Successfully created space for token ${tokenAddress}: ${spaceId}`
    )

    return NextResponse.json({ success: true, spaceId, tokenAddress })
  } catch (error) {
    console.error(
      "[GOVERNANCE-SPACES] Auto space creation failed:",
      error instanceof Error ? error.message : error
    )
    return NextResponse.json(
      { error: "Failed to create governance space" },
      { status: 500 }
    )
  }
}
