/**
 * Server-side Snapshot EIP-712 typed data construction and submission.
 * Types and message formats match snapshot.js v0.14 exactly.
 */

/**
 * Snapshot sequencer URL (for write operations: proposals, votes, cancellations).
 * This is different from the hub URL which is for reads (GraphQL queries).
 * Client712 in snapshot.js internally maps hub URLs to seq URLs.
 */
function getSnapshotSeqUrl(): string {
  const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "1514")
  return chainId === 1315
    ? "https://testnet.seq.snapshot.org"
    : "https://seq.snapshot.org"
}

const SNAPSHOT_DOMAIN = {
  name: "snapshot",
  version: "0.1.4",
} as const

// Exact types from snapshot.js v0.14 proposalTypes
const PROPOSAL_TYPES = {
  Proposal: [
    { name: "from", type: "string" },
    { name: "space", type: "string" },
    { name: "timestamp", type: "uint64" },
    { name: "type", type: "string" },
    { name: "title", type: "string" },
    { name: "body", type: "string" },
    { name: "discussion", type: "string" },
    { name: "choices", type: "string[]" },
    { name: "labels", type: "string[]" },
    { name: "start", type: "uint64" },
    { name: "end", type: "uint64" },
    { name: "snapshot", type: "uint64" },
    { name: "plugins", type: "string" },
    { name: "privacy", type: "string" },
    { name: "app", type: "string" },
  ],
} as const

// Exact types from snapshot.js v0.14 voteTypes
const VOTE_TYPES = {
  Vote: [
    { name: "from", type: "string" },
    { name: "space", type: "string" },
    { name: "timestamp", type: "uint64" },
    { name: "proposal", type: "string" },
    { name: "choice", type: "uint32" },
    { name: "reason", type: "string" },
    { name: "app", type: "string" },
    { name: "metadata", type: "string" },
  ],
} as const

// Exact types from snapshot.js v0.14 cancelProposal2Types
const CANCEL_PROPOSAL_TYPES = {
  CancelProposal: [
    { name: "from", type: "string" },
    { name: "space", type: "string" },
    { name: "timestamp", type: "uint64" },
    { name: "proposal", type: "string" },
  ],
} as const

export interface ProposalTypedData {
  domain: typeof SNAPSHOT_DOMAIN
  types: typeof PROPOSAL_TYPES
  primaryType: "Proposal"
  message: {
    from: string
    space: string
    timestamp: number
    type: string
    title: string
    body: string
    discussion: string
    choices: string[]
    labels: string[]
    start: number
    end: number
    snapshot: number
    plugins: string
    privacy: string
    app: string
  }
}

export interface VoteTypedData {
  domain: typeof SNAPSHOT_DOMAIN
  types: typeof VOTE_TYPES
  primaryType: "Vote"
  message: {
    from: string
    space: string
    timestamp: number
    proposal: string
    choice: number
    reason: string
    app: string
    metadata: string
  }
}

export interface CancelProposalTypedData {
  domain: typeof SNAPSHOT_DOMAIN
  types: typeof CANCEL_PROPOSAL_TYPES
  primaryType: "CancelProposal"
  message: {
    from: string
    space: string
    timestamp: number
    proposal: string
  }
}

/**
 * Builds EIP-712 typed data for a Snapshot proposal.
 */
export function buildProposalTypedData(params: {
  from: string
  spaceId: string
  type: string
  title: string
  body: string
  discussion: string
  choices: string[]
  start: number
  end: number
  snapshot: number
  plugins: string
}): ProposalTypedData {
  const timestamp = Math.floor(Date.now() / 1000)

  return {
    domain: SNAPSHOT_DOMAIN,
    types: PROPOSAL_TYPES,
    primaryType: "Proposal",
    message: {
      from: params.from,
      space: params.spaceId,
      timestamp,
      type: params.type,
      title: params.title,
      body: params.body,
      discussion: params.discussion,
      choices: params.choices,
      labels: [],
      start: params.start,
      end: params.end,
      snapshot: params.snapshot,
      plugins: params.plugins,
      privacy: "",
      app: "ip.world",
    },
  }
}

/**
 * Builds EIP-712 typed data for a Snapshot vote.
 */
export function buildVoteTypedData(params: {
  from: string
  spaceId: string
  proposalId: string
  choice: number
  reason?: string
}): VoteTypedData {
  const timestamp = Math.floor(Date.now() / 1000)

  return {
    domain: SNAPSHOT_DOMAIN,
    types: VOTE_TYPES,
    primaryType: "Vote",
    message: {
      from: params.from,
      space: params.spaceId,
      timestamp,
      proposal: params.proposalId,
      choice: params.choice,
      reason: params.reason || "",
      app: "ip.world",
      metadata: "{}",
    },
  }
}

/**
 * Builds EIP-712 typed data for a Snapshot proposal cancellation.
 */
export function buildCancelTypedData(params: {
  from: string
  spaceId: string
  proposalId: string
}): CancelProposalTypedData {
  const timestamp = Math.floor(Date.now() / 1000)

  return {
    domain: SNAPSHOT_DOMAIN,
    types: CANCEL_PROPOSAL_TYPES,
    primaryType: "CancelProposal",
    message: {
      from: params.from,
      space: params.spaceId,
      timestamp,
      proposal: params.proposalId,
    },
  }
}

/**
 * Submits a signed EIP-712 message to Snapshot sequencer.
 * Matches the exact envelope format of snapshot.js Client712.send().
 */
export async function submitToSnapshotHub(params: {
  address: string
  sig: string
  data: ProposalTypedData | VoteTypedData | CancelProposalTypedData
}): Promise<{ id?: string; ipfsHash?: string }> {
  const seqUrl = getSnapshotSeqUrl()
  const response = await fetch(seqUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      address: params.address,
      sig: params.sig,
      data: {
        domain: params.data.domain,
        types: params.data.types,
        message: params.data.message,
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Snapshot hub rejected submission: ${response.status} - ${errorText}`)
  }

  return response.json()
}
