/**
 * Snapshot client-side types and utilities.
 * Network calls have been moved to server-side API routes (lib/snapshot-server.ts).
 * This file only contains types, constants, and pure utility functions.
 */

export type VoteChoice = 1 | 2 | 3 // 1 = For, 2 = Against, 3 = Abstain

export const VOTE_CHOICES = {
  FOR: 1 as VoteChoice,
  AGAINST: 2 as VoteChoice,
  ABSTAIN: 3 as VoteChoice,
}

export const VOTE_CHOICE_LABELS: Record<VoteChoice, string> = {
  1: "For",
  2: "Against",
  3: "Abstain",
}

// GraphQL types for Snapshot API responses
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
    id?: string
    name: string
  }
}

// Execution intent parsed from plugins
export interface ExecutionIntent {
  type: "transfer" | "claim"
  token?: string
  recipient?: string
  amount?: string
  claimType?: string
  tokenAddress?: string
  targetToken?: string
}

// Parse plugins (JSON string or already-parsed object) to extract execution intent
export function parseExecutionIntent(pluginsInput: string | Record<string, unknown> | null | undefined): ExecutionIntent | null {
  if (!pluginsInput) return null

  try {
    let plugins: Record<string, unknown>
    if (typeof pluginsInput === "string") {
      if (pluginsInput === "{}") return null
      plugins = JSON.parse(pluginsInput)
    } else {
      plugins = pluginsInput
    }

    if (!plugins || Object.keys(plugins).length === 0) return null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const execution = (plugins as any)?.readOnlyExecution
    if (!execution?.safes?.[0]?.transactions?.[0]) return null

    const tx = execution.safes[0].transactions[0]
    const args = tx._form?.args
    if (!args) return null

    return {
      type: args.type || "transfer",
      token: args.token,
      recipient: args.recipient,
      amount: args.amount,
      claimType: args.claimType,
      tokenAddress: args.tokenAddress,
      targetToken: args.targetToken,
    }
  } catch {
    return null
  }
}

// Vote interface from Snapshot
export interface SnapshotVote {
  id: string
  voter: string
  choice: number | number[] | Record<string, number>
  vp: number // voting power
  created: number
  proposal: {
    id: string
  }
}
