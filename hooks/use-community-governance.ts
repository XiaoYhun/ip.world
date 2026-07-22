"use client"

import { useState, useMemo, useCallback } from "react"
import { useReadContract, useBlockNumber } from "wagmi"
import { useEmbeddedWallets } from "@/hooks/use-embedded-wallets"
import { useEmbeddedEvmWalletClient } from "@/hooks/use-embedded-evm-wallet-client"
import { Address, formatUnits } from "viem"
import { useQuery } from "@tanstack/react-query"
import {
  VoteChoice,
  SnapshotProposal,
  SnapshotVote,
  parseExecutionIntent,
} from "@/lib/snapshot-client"
import {
  type CancelProposalTypedData,
  type ProposalTypedData,
  type VoteTypedData,
} from "@/lib/snapshot-eip712"
import IPTokenABI from "@/config/IPToken.abi.json"
import { getAPIRootUrl } from "@/lib/utils"
import { Ip } from "@/types/ip"
import { SNAPSHOT_PROPOSAL_MIN_SCORE, SNAPSHOT_VOTE_MIN_SCORE, GOVERNANCE_TOKEN_DECIMALS, getVotingPeriodSeconds } from "@/lib/governance-constants"

export type ExecutionStatus =
  | "pending_vote"
  | "vote_passed"
  | "signed"
  | "execution_pending"
  | "executed"
  | "vetoed"
  | "failed"

export interface Proposal {
  id: string
  title: string
  type: "spending" | "general"
  status: "pending" | "active" | "passed" | "failed" | "executed"
  description: string
  votingEndsAt: string
  votingStartsAt: string
  createdBy: string
  snapshotId: string
  vaultAddress?: string
  recipientAddress?: string
  tokenAddress?: string
  targetToken?: string
  amount?: string
  scores?: number[]
  scoresTotal?: number
  voterCount?: number
  quorum?: number
  choices?: string[]
  voteType?: string // Snapshot vote type: "single-choice", "approval", "quadratic", etc.
  privacy?: string // "" for public, "shutter" for encrypted voting
  executionStatus?: ExecutionStatus
  executionTxHash?: string
  userVote?: {
    choice: number | number[] | Record<string, number>
    vp: number
  }
}

export type VotingType = "basic" | "single-choice" | "approval" | "ranked-choice" | "weighted"

export type TransactionType = "transfer" | "claim"

export interface TransferDetails {
  type: "transfer"
  token: string // token address or "native" for IP
  recipient: string
  amount: string // in wei/smallest unit
}

export interface ClaimDetails {
  type: "claim"
  claimType: "tokenFees" | "ipFees" | "vesting"
  tokenAddress: string
}

export type ExecutionIntent = TransferDetails | ClaimDetails

export interface CreateSpendingProposalData {
  title: string
  description: string
  recipientAddress: string
  tokenAddress: string
  amount: string
  discussionUrl?: string
  votingType: VotingType
  executionIntent?: ExecutionIntent // Structured execution data
}

type SnapshotTypedData =
  | ProposalTypedData
  | VoteTypedData
  | CancelProposalTypedData

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const

// Build plugins JSON for Snapshot proposal
function buildExecutionPlugins(
  safeAddress: string,
  chainId: number,
  intent: ExecutionIntent,
  targetToken?: string
): string {
  const plugin = {
    readOnlyExecution: {
      safes: [
        {
          safeName: "Community Treasury",
          safeAddress,
          chainId,
          transactions: [
            {
              _type: intent.type === "transfer" ? "transferFunds" : "contractCall",
              // Store intent details in _form.args for backend parsing
              _form: {
                args: {
                  type: intent.type,
                  ...(targetToken ? { targetToken } : {}),
                  ...(intent.type === "transfer"
                    ? {
                      token: intent.token,
                      recipient: intent.recipient,
                      amount: intent.amount,
                    }
                    : {
                      claimType: intent.claimType,
                      tokenAddress: intent.tokenAddress,
                    }),
                },
              },
            },
          ],
        },
      ],
    },
  }
  return JSON.stringify(plugin)
}

export function useCommunityGovernance(ipId: string, ip?: Ip, tokenAddress?: string) {
  const { evmAddress } = useEmbeddedWallets()
  const { getEmbeddedWalletClient } = useEmbeddedEvmWalletClient()
  const { data: blockNumber } = useBlockNumber()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [voting, setVoting] = useState<string | null>(null)
  const [tokenSymbol, setTokenSymbol] = useState<string | null>(null)

  const signSnapshotTypedData = useCallback(
    async (typedData: SnapshotTypedData) => {
      const embeddedClient = await getEmbeddedWalletClient()
      const signaturePayload = {
        account: embeddedClient.account!,
        domain: typedData.domain,
        types: typedData.types,
        primaryType: typedData.primaryType,
        message: typedData.message,
      } as unknown as Parameters<typeof embeddedClient.signTypedData>[0]

      return embeddedClient.signTypedData(signaturePayload)
    },
    [getEmbeddedWalletClient]
  )

  // Get the canonical voting token (first token created for this IP)
  const canonicalToken = useMemo(() => {
    if (!ip?.remixes || ip.remixes.length === 0) return null

    const sortedRemixes = [...ip.remixes].sort((a, b) => {
      const dateA = new Date(a.token_created_at || a.created_at).getTime()
      const dateB = new Date(b.token_created_at || b.created_at).getTime()
      return dateA - dateB
    })
    setTokenSymbol(sortedRemixes[0].symbol)
    return sortedRemixes[0].token_address as Address
  }, [ip?.remixes])

  // The active token for governance: either the specific token page or the canonical token
  const governanceToken = tokenAddress || canonicalToken
  const minScoreRaw = BigInt(SNAPSHOT_PROPOSAL_MIN_SCORE) * BigInt(10 ** GOVERNANCE_TOKEN_DECIMALS)
  const minVoteScoreRaw = BigInt(SNAPSHOT_VOTE_MIN_SCORE) * BigInt(10 ** GOVERNANCE_TOKEN_DECIMALS)

  // Check user's token balance for the active governance token
  const { data: tokenBalance } = useReadContract({
    address: (governanceToken || ZERO_ADDRESS) as Address,
    abi: IPTokenABI,
    functionName: "balanceOf",
    args: [evmAddress || ZERO_ADDRESS],
    query: {
      enabled: !!governanceToken && !!evmAddress,
    },
  })

  // Convert Snapshot proposal to our Proposal format
  const convertSnapshotProposal = useCallback((sp: SnapshotProposal): Proposal => {
    // Parse execution details from plugins (preferred) or body (fallback)
    let proposalType: "spending" | "general" = "general"
    let recipientAddress: string | undefined
    let parsedTokenAddress: string | undefined
    let amount: string | undefined
    let targetToken: string | undefined

    // Try plugins first (structured data)
    const intent = parseExecutionIntent(sp.plugins)
    if (intent) {
      proposalType = "spending"
      recipientAddress = intent.recipient
      parsedTokenAddress = intent.token === "native" ? undefined : intent.token
      amount = intent.amount
      targetToken = intent.targetToken
    }
    // Fall back to body parsing for legacy proposals
    else if (sp.body.includes("**Transfer Details:**") || sp.body.includes("**Spending Details:**")) {
      proposalType = "spending"
      const lines = sp.body.split("\n")
      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.startsWith("- Recipient:")) {
          recipientAddress = trimmed.replace("- Recipient:", "").trim()
        } else if (trimmed.startsWith("- Amount:")) {
          amount = trimmed.replace("- Amount:", "").trim()
        } else if (trimmed.startsWith("- Token:")) {
          parsedTokenAddress = trimmed.replace("- Token:", "").trim()
        }
      }
    }

    // Determine status from Snapshot state
    let status: Proposal["status"] = "active"
    if (sp.state === "pending") {
      status = "pending"
    } else if (sp.state === "closed") {
      const votesFor = sp.scores[0] || 0
      const votesAgainst = sp.scores[1] || 0
      const requiredYes = (sp.quorum || 0) + votesAgainst
      const passed = votesFor > votesAgainst && votesFor >= requiredYes
      status = passed ? "passed" : "failed"
    }

    return {
      id: sp.id,
      snapshotId: sp.id,
      title: sp.title,
      description: sp.body,
      type: proposalType,
      status,
      votingStartsAt: new Date(sp.start * 1000).toISOString(),
      votingEndsAt: new Date(sp.end * 1000).toISOString(),
      createdBy: sp.author,
      recipientAddress,
      tokenAddress: parsedTokenAddress,
      targetToken,
      amount,
      scores: sp.scores,
      scoresTotal: sp.scores_total,
      voterCount: sp.votes || 0,
      quorum: sp.quorum,
      choices: sp.choices,
      voteType: sp.type || "single-choice",
      privacy: sp.privacy || "",
    }
  }, [])

  // Fetch proposals via server-side API route (space ID resolved server-side)
  const { data: proposals, isLoading: isQueryLoading, refetch: mutateProposals } = useQuery<Proposal[]>({
    queryKey: ["governance-proposals", governanceToken, evmAddress || "anon", ipId],
    queryFn: async () => {
      if (!governanceToken) return []

      // Fetch proposals from server-side proxy
      const proposalsResponse = await fetch(`/api/governance/proposals?tokenAddress=${governanceToken}`)
      if (!proposalsResponse.ok) return []

      const { proposals: snapshotProposals } = await proposalsResponse.json()
      const proposalsList = (snapshotProposals || []).map(convertSnapshotProposal)

      // Fetch execution status from backend for closed/passed proposals
      try {
        const apiUrl = getAPIRootUrl()
        const backendResponse = await fetch(
          `${apiUrl}/community-governance/proposals/ip/${ipId}`
        )
        if (backendResponse.ok) {
          const { proposals: backendProposals } = await backendResponse.json()
          if (Array.isArray(backendProposals)) {
            const backendMap = new Map<string, { execution_status: string; execution_tx_hash: string; token_address: string }>(
              backendProposals.map((bp: { snapshot_id: string; execution_status: string; execution_tx_hash: string; token_address: string }) => [
                bp.snapshot_id,
                bp,
              ])
            )

            for (const proposal of proposalsList) {
              const bp = backendMap.get(proposal.snapshotId)
              if (bp) {
                proposal.executionStatus = bp.execution_status as ExecutionStatus
                proposal.executionTxHash = bp.execution_tx_hash || undefined
                if (!proposal.targetToken && bp.token_address) {
                  proposal.targetToken = bp.token_address
                }
              }
            }
          }
        }
      } catch (err) {
        console.error("[Governance] Failed to fetch execution status from backend:", err)
      }

      // Fetch user's votes if connected
      if (evmAddress && proposalsList.length > 0) {
        try {
          const proposalIds = proposalsList.map((p: Proposal) => p.snapshotId)
          const votesResponse = await fetch(
            `/api/governance/votes?tokenAddress=${governanceToken}&voter=${evmAddress}&proposalIds=${proposalIds.join(",")}`
          )
          if (votesResponse.ok) {
            const { votes: userVotes } = await votesResponse.json()
            const voteMap = new Map<string, SnapshotVote>()
            for (const vote of (userVotes || [])) {
              voteMap.set(vote.proposal.id, vote)
            }
            for (const proposal of proposalsList) {
              const vote = voteMap.get(proposal.snapshotId)
              if (vote) {
                proposal.userVote = {
                  choice: vote.choice,
                  vp: vote.vp,
                }
              }
            }
          }
        } catch (err) {
          console.error("[Governance] Failed to fetch user votes:", err)
        }
      }

      return proposalsList
    },
    enabled: !!governanceToken,
    refetchInterval: 30000,
  })

  function describeUnknownError(err: unknown): { message: string; details?: unknown } {
    if (err instanceof Error) {
      const anyErr = err as unknown as { cause?: unknown }
      const details = anyErr?.cause ? { cause: anyErr.cause } : undefined
      return { message: err.message || err.name || "Unknown error", details }
    }
    if (err && typeof err === "object") {
      const maybeMessage = (err as { message?: unknown }).message
      if (typeof maybeMessage === "string" && maybeMessage.trim().length > 0) {
        return { message: maybeMessage, details: err }
      }
      try {
        return { message: JSON.stringify(err, Object.getOwnPropertyNames(err)) }
      } catch {
        return { message: "[object Object]", details: err }
      }
    }
    return { message: String(err) }
  }

  const createSpendingProposal = async (
    data: CreateSpendingProposalData,
    vaultAddr: string
  ) => {
    if (!evmAddress) {
      throw new Error("Wallet not connected")
    }

    if (!governanceToken) {
      throw new Error("No governance token available")
    }

    if (!canCreateProposal()) {
      throw new Error(getCreateProposalDisabledReason())
    }

    setLoading(true)
    setError(null)

    try {
      const now = Math.floor(Date.now() / 1000)
      const votingDuration = getVotingPeriodSeconds()

      // Format amount for human-readable body text
      let displayAmount = data.amount
      try {
        const parsed = parseFloat(formatUnits(BigInt(data.amount), 18))
        displayAmount = parsed.toLocaleString(undefined, { maximumFractionDigits: 4 })
      } catch {
        // If parsing fails, use raw value
      }

      const proposalBody = `${data.description}\n\n**Transfer Details:**\n- Recipient: ${data.recipientAddress}\n- Amount: ${displayAmount}\n- Token: ${data.tokenAddress}`

      // Build execution plugins
      const executionIntent: ExecutionIntent = data.executionIntent || {
        type: "transfer",
        token: data.tokenAddress || "native",
        recipient: data.recipientAddress,
        amount: data.amount,
      }

      const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 1514
      const plugins = buildExecutionPlugins(vaultAddr, chainId, executionIntent, tokenAddress)

      const snapshotBlock = blockNumber ? Number(blockNumber) - 1 : 0
      if (snapshotBlock === 0) {
        throw new Error("Could not get current block number")
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const getChoicesForVotingType = (_type: VotingType): string[] => {
        return ["For", "Against", "Abstain"]
      }

      // Step 1: Prepare typed data from server (server resolves space ID)
      const prepareResponse = await fetch("/api/governance/proposals/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenAddress: governanceToken,
          from: evmAddress,
          type: data.votingType,
          title: data.title,
          body: proposalBody,
          discussion: data.discussionUrl || "",
          choices: getChoicesForVotingType(data.votingType),
          start: now,
          end: now + votingDuration,
          snapshot: snapshotBlock,
          plugins,
        }),
      })

      if (!prepareResponse.ok) {
        const errData = await prepareResponse.json().catch(() => ({ error: "Failed to prepare proposal" }))
        throw new Error(errData.error || "Failed to prepare proposal")
      }

      const { typedData }: { typedData: ProposalTypedData } = await prepareResponse.json()

      // Step 2: Sign with embedded wallet
      const sig = await signSnapshotTypedData(typedData)

      // Step 3: Submit signed data to Snapshot via server
      const submitResponse = await fetch("/api/governance/proposals/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: evmAddress,
          sig,
          typedData,
        }),
      })

      if (!submitResponse.ok) {
        const errData = await submitResponse.json().catch(() => ({ error: "Failed to submit proposal" }))
        throw new Error(errData.error || "Failed to submit proposal")
      }

      const result = await submitResponse.json()

      mutateProposals()

      return {
        success: true,
        snapshotId: result.id,
      }
    } catch (err) {
      const described = describeUnknownError(err)
      setError(described.message)
      console.error("[Governance] createSpendingProposal failed", { described, raw: err })
      throw err
    } finally {
      setLoading(false)
    }
  }

  const canCreateProposal = () => {
    if (!evmAddress) return false
    if (!tokenBalance) return false
    return (tokenBalance as bigint) >= minScoreRaw
  }

  const getCreateProposalDisabledReason = () => {
    if (!evmAddress) return "Embedded wallet not connected."
    if (!tokenBalance) return "Insufficient balance for proposal creation."
    if ((tokenBalance as bigint) < minScoreRaw) {
      return `You need at least ${SNAPSHOT_PROPOSAL_MIN_SCORE.toLocaleString()} tokens to create a proposal.`
    }
    return ""
  }

  const canVote = () => {
    if (!evmAddress) return false
    if (!tokenBalance) return false
    return (tokenBalance as bigint) >= minVoteScoreRaw
  }

  const getVoteDisabledReason = () => {
    if (!evmAddress) return "Wallet not connected."
    if (!tokenBalance) return "Unable to check token balance."
    if ((tokenBalance as bigint) < minVoteScoreRaw) {
      return `You need at least ${SNAPSHOT_VOTE_MIN_SCORE.toLocaleString()} tokens to vote.`
    }
    return ""
  }

  const voteOnProposal = async (proposal: Proposal, choice: VoteChoice) => {
    if (!evmAddress) {
      throw new Error("Wallet not connected")
    }

    if (!proposal.snapshotId) {
      throw new Error("Proposal not yet posted to Snapshot")
    }

    if (!governanceToken) {
      throw new Error("No governance token available")
    }

    if (!canVote()) {
      throw new Error(getVoteDisabledReason())
    }

    // For Shutter (shielded) voting, redirect to Snapshot
    if (proposal.privacy === "shutter") {
      throw new Error("Shielded voting is only available on Snapshot. Please vote on Snapshot directly.")
    }

    setVoting(proposal.id)
    setError(null)

    try {
      // Step 1: Prepare typed data from server
      const prepareResponse = await fetch("/api/governance/votes/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenAddress: governanceToken,
          from: evmAddress,
          proposalId: proposal.snapshotId,
          choice,
        }),
      })

      if (!prepareResponse.ok) {
        const errData = await prepareResponse.json().catch(() => ({ error: "Failed to prepare vote" }))
        throw new Error(errData.error || "Failed to prepare vote")
      }

      const { typedData }: { typedData: VoteTypedData } = await prepareResponse.json()

      // Step 2: Sign with embedded wallet
      const sig = await signSnapshotTypedData(typedData)

      // Step 3: Submit signed vote to Snapshot via server
      const submitResponse = await fetch("/api/governance/votes/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: evmAddress,
          sig,
          typedData,
        }),
      })

      if (!submitResponse.ok) {
        const errData = await submitResponse.json().catch(() => ({ error: "Failed to submit vote" }))
        throw new Error(errData.error || "Failed to submit vote")
      }

      mutateProposals()
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to vote"
      setError(errorMessage)
      throw err
    } finally {
      setVoting(null)
    }
  }

  // Helper to get the user's vote choice label for a proposal
  const getUserVoteLabel = (proposal: Proposal): string | null => {
    if (!proposal.userVote) return null

    const choice = proposal.userVote.choice
    // For single-choice/basic voting, choice is a number (1-indexed)
    if (typeof choice === "number" && proposal.choices) {
      return proposal.choices[choice - 1] || `Choice ${choice}`
    }
    return null
  }

  // Check if user has already voted on a proposal
  const hasUserVoted = (proposal: Proposal): boolean => {
    return !!proposal.userVote
  }

  // Check if proposal uses shielded (Shutter) voting
  const isShieldedVoting = (proposal: Proposal): boolean => {
    return proposal.privacy === "shutter"
  }

  const canAccessGovernance = () => {
    if (!evmAddress) return false
    if (!tokenBalance) return false
    return (tokenBalance as bigint) >= minScoreRaw
  }

  const canParticipateInVoting = () => {
    if (!evmAddress) return false
    if (!tokenBalance) return false
    return (tokenBalance as bigint) >= minVoteScoreRaw
  }

  // Veto a proposal: cancel on Snapshot (owner is moderator) then record in backend
  const vetoProposal = async (snapshotId: string) => {
    if (!evmAddress) {
      throw new Error("Wallet not connected")
    }

    if (!governanceToken) {
      throw new Error("No governance token available")
    }

    setLoading(true)
    setError(null)

    try {
      // Step 1: Prepare cancellation typed data from server
      const prepareResponse = await fetch("/api/governance/proposals/cancel/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenAddress: governanceToken,
          from: evmAddress,
          proposalId: snapshotId,
        }),
      })

      if (!prepareResponse.ok) {
        const errData = await prepareResponse.json().catch(() => ({ error: "Failed to prepare cancellation" }))
        throw new Error(errData.error || "Failed to prepare cancellation")
      }

      const { typedData }: { typedData: CancelProposalTypedData } = await prepareResponse.json()

      // Step 2: Sign with embedded wallet
      const sig = await signSnapshotTypedData(typedData)

      // Step 3: Submit signed cancellation (also records veto in backend)
      const submitResponse = await fetch("/api/governance/proposals/cancel/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: evmAddress,
          sig,
          typedData,
          proposalId: snapshotId,
        }),
      })

      if (!submitResponse.ok) {
        const errData = await submitResponse.json().catch(() => ({ error: "Failed to cancel proposal" }))
        throw new Error(errData.error || "Failed to cancel proposal")
      }

      mutateProposals()
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to veto proposal"
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Fetch the backend pre-signed signature for client-side Safe execution
  const getProposalSignature = async (snapshotId: string) => {
    if (!evmAddress) throw new Error("Wallet not connected")

    const apiUrl = getAPIRootUrl()
    const response = await fetch(
      `${apiUrl}/community-governance/proposals/${snapshotId}/signature?caller_address=${evmAddress}`
    )

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: "Failed to fetch signature" }))
      throw new Error(data.error || "Failed to fetch proposal signature")
    }

    return response.json()
  }

  // Execute a passed proposal on-chain: co-sign with backend signature, call Safe.execTransaction
  const executeProposal = async (snapshotId: string) => {
    if (!evmAddress) {
      throw new Error("Wallet not connected")
    }

    setLoading(true)
    setError(null)

    try {

      // Fetch backend signature and transaction parameters
      const sigData = await getProposalSignature(snapshotId)

      // Record execution in backend
      const apiUrl = getAPIRootUrl()
      await fetch(`${apiUrl}/community-governance/proposals/${snapshotId}/executed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caller_address: evmAddress,
          execution_tx_hash: sigData.backend_signature ? "pending" : "",
        }),
      })

      mutateProposals()
      return { success: true, signatureData: sigData }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to execute proposal"
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    proposals: proposals || [],
    loading: loading || isQueryLoading,
    error,
    voting,
    createSpendingProposal,
    canCreateProposal,
    canVote,
    canAccessGovernance,
    canParticipateInVoting,
    voteOnProposal,
    vetoProposal,
    executeProposal,
    getProposalSignature,
    mutateProposals,
    getUserVoteLabel,
    hasUserVoted,
    isShieldedVoting,
    canonicalToken,
    tokenSymbol,
    tokenBalance: tokenBalance as bigint | undefined,
    createProposalDisabledReason: getCreateProposalDisabledReason(),
    voteDisabledReason: getVoteDisabledReason(),
  }
}
