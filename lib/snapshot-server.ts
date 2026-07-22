/**
 * Server-side Snapshot utilities.
 * These functions must ONLY be imported from server-side code (API routes).
 * They contain the Snapshot GraphQL queries and hub URL logic that was previously in snapshot-client.ts.
 */

/** Hub URL for GraphQL reads. Resolved lazily and cached after first call. */
let _cachedHubUrl: string | null = null
export function getSnapshotHubUrl(): string {
  if (!_cachedHubUrl) {
    const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "1514")
    _cachedHubUrl = chainId === 1315
      ? "https://testnet.hub.snapshot.org"
      : "https://hub.snapshot.org"
  }
  return _cachedHubUrl
}

/** @deprecated Use getSnapshotHubUrl() instead. Kept for backward compatibility. */
export const SNAPSHOT_HUB_URL = ""

// Backend API URL for resolving token -> space ID
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://dev-api.ip.world/api/v1"

export interface SnapshotProposal {
  id: string
  title: string
  body: string
  type: string
  privacy: string
  state: "active" | "closed" | "pending"
  scores: number[]
  scores_total: number
  votes: number
  quorum: number
  start: number
  end: number
  snapshot: string
  author: string
  choices: string[]
  plugins: string | Record<string, unknown>
  space: {
    id: string
    name: string
  }
}

export interface SnapshotVote {
  id: string
  voter: string
  choice: number | number[] | Record<string, number>
  vp: number
  created: number
  proposal: {
    id: string
  }
}

const SPACE_CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes for positive hits
const spaceIdCache = new Map<string, { value: string; expiry: number }>()

/**
 * Resolves a token address to its Snapshot space ID by querying the backend.
 * Returns null if the token has no governance space configured.
 * Positive results are cached in-memory; null results are never cached so
 * newly created spaces are discoverable immediately on the next call.
 */
export async function resolveSpaceId(tokenAddress: string): Promise<string | null> {
  const key = tokenAddress.toLowerCase()
  const cached = spaceIdCache.get(key)
  if (cached && Date.now() < cached.expiry) {
    return cached.value
  }

  try {
    const response = await fetch(`${API_BASE_URL}/remixes/${tokenAddress}`, {
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    })
    if (!response.ok) return null

    const data = await response.json()
    const spaceId: string | null = data?.snapshot_space_id || null

    if (spaceId) {
      spaceIdCache.set(key, { value: spaceId, expiry: Date.now() + SPACE_CACHE_TTL_MS })
    }

    return spaceId
  } catch {
    return null
  }
}

/**
 * Fetches proposals for a Snapshot space.
 */
export async function fetchProposalsBySpace(spaceId: string, limit = 50): Promise<SnapshotProposal[]> {
  const query = `
    query Proposals($space: String!, $first: Int!) {
      proposals(
        first: $first,
        skip: 0,
        where: { space: $space },
        orderBy: "created",
        orderDirection: desc
      ) {
        id
        title
        body
        type
        privacy
        state
        scores
        scores_total
        votes
        quorum
        start
        end
        snapshot
        author
        choices
        plugins
        space {
          id
          name
        }
      }
    }
  `

  const response = await fetch(`${getSnapshotHubUrl()}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      variables: { space: spaceId, first: limit },
    }),
  })

  if (!response.ok) {
    throw new Error(`Snapshot API error: ${response.status}`)
  }

  const data = await response.json()
  if (data.errors) {
    throw new Error(`Snapshot GraphQL error: ${JSON.stringify(data.errors)}`)
  }

  return data.data?.proposals || []
}

/**
 * Fetches votes for a specific voter, optionally filtered by proposal IDs.
 */
export async function fetchVotesByVoter(
  spaceId: string,
  voter: string,
  proposalIds?: string[]
): Promise<SnapshotVote[]> {
  const query = `
    query Votes($space: String!, $voter: String!, $proposals: [String!]) {
      votes(
        first: 100,
        where: {
          space: $space,
          voter: $voter,
          proposal_in: $proposals
        }
      ) {
        id
        voter
        choice
        vp
        created
        proposal {
          id
        }
      }
    }
  `

  const response = await fetch(`${getSnapshotHubUrl()}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      variables: {
        space: spaceId,
        voter: voter.toLowerCase(),
        proposals: proposalIds,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Snapshot API error: ${response.status}`)
  }

  const data = await response.json()
  if (data.errors) {
    throw new Error(`Snapshot GraphQL error: ${JSON.stringify(data.errors)}`)
  }

  return data.data?.votes || []
}

/**
 * Fetches top voters for a proposal, ordered by voting power.
 */
export async function fetchTopVoters(proposalId: string, limit = 3): Promise<SnapshotVote[]> {
  const query = `
    query Votes($proposal: String!, $first: Int!) {
      votes(
        first: $first,
        where: { proposal: $proposal },
        orderBy: "vp",
        orderDirection: desc
      ) {
        id
        voter
        choice
        vp
        created
        proposal {
          id
        }
      }
    }
  `

  const response = await fetch(`${getSnapshotHubUrl()}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      variables: { proposal: proposalId, first: limit },
    }),
  })

  if (!response.ok) {
    throw new Error(`Snapshot API error: ${response.status}`)
  }

  const data = await response.json()
  if (data.errors) {
    throw new Error(`Snapshot GraphQL error: ${JSON.stringify(data.errors)}`)
  }

  return data.data?.votes || []
}
