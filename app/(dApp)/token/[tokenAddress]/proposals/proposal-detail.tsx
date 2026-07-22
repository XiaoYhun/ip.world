"use client"

import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { formatUnits } from "viem"
import { useQuery } from "@tanstack/react-query"
import { ThumbsUp, ThumbsDown, ShieldBan, Zap, User2, Pencil, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { Ip } from "@/types/ip"
import { User } from "@/types/user"
import { truncateAddress } from "@/lib/strings"
import { Proposal } from "@/hooks/use-community-governance"
import { VoteChoice, SnapshotVote } from "@/lib/snapshot-client"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent } from "@/components/ui/dialog"

// ─── Design tokens ───
const COLOR_FOR = "#AFFF2E"
const COLOR_AGAINST = "#FF4297"
const COLOR_QUORUM = "#DFCDF9"
const COLOR_BAR_TRACK = "#242424"

const EXECUTION_DELAY_MS = 24 * 60 * 60 * 1000

// ─── Helpers ───

function formatVotes(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return n.toLocaleString()
}

function getTimeRemaining(endDate: string): string {
  const end = new Date(endDate).getTime()
  const now = Date.now()
  const diff = end - now
  if (diff <= 0) return "Ended"
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (days > 0) return `Ends in ${days}d ${hours}h`
  if (hours > 0) return `Ends in ${hours}h ${minutes}m`
  return `Ends in ${minutes}m`
}

function formatTokenAmount(weiAmount: string | undefined): string {
  if (!weiAmount) return "0"
  try {
    const formatted = formatUnits(BigInt(weiAmount), 18)
    const num = parseFloat(formatted)
    if (num === 0) return "0"
    if (num < 0.001) return "<0.001"
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`
    return num.toLocaleString(undefined, { maximumFractionDigits: 4 })
  } catch {
    return weiAmount
  }
}

function stripTransferDetails(text: string): string {
  const markers = ["**Transfer Details:**", "**Spending Details:**"]
  for (const marker of markers) {
    const idx = text.indexOf(marker)
    if (idx !== -1) return text.slice(0, idx).trim()
  }
  return text
}

// ─── Avatar colors for fallback initials ───
const AVATAR_COLORS = ["#A572ED", "#FF4297", "#AFFF2E", "#FFD600", "#00D1FF"]

function useUserProfile(address: string | undefined) {
  return useQuery<User | null>({
    queryKey: ["user-profile", address?.toLowerCase()],
    queryFn: async () => {
      if (!address) return null
      try {
        const res = await fetch(`/api/users/${address}/profile`)
        if (!res.ok) return null
        const json = await res.json()
        // Backend nests as { data: { user: User } } or route may return { user: User }
        return (json?.user ?? json?.data?.user ?? json) as User
      } catch {
        return null
      }
    },
    enabled: !!address,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}

function AvatarCircle({
  avatarUrl,
  colorIndex,
  size = 20,
}: {
  avatarUrl?: string
  colorIndex: number
  size?: number
}) {
  const color = AVATAR_COLORS[colorIndex % AVATAR_COLORS.length]
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        className="rounded-full border-2 border-[#121212] object-cover"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className="flex items-center justify-center rounded-full border-2 border-[#121212]"
      style={{ width: size, height: size, backgroundColor: `${color}22` }}
    >
      <User2 style={{ width: size * 0.5, height: size * 0.5, color }} />
    </div>
  )
}

function AuthorInfo({ address }: { address: string | undefined }) {
  const { data: profile } = useUserProfile(address)
  if (!address) return <span className="font-mono text-[14px] text-[#D9D9D9]">Unknown</span>

  const displayName = profile?.username || profile?.display_name || truncateAddress(address)
  return (
    <div className="flex items-center gap-2">
      <AvatarCircle avatarUrl={profile?.avatar_url} colorIndex={0} size={28} />
      <span className="font-mono text-[14px] text-[#D9D9D9]">{displayName}</span>
    </div>
  )
}

function VoterAvatar({ address, index }: { address: string; index: number }) {
  const { data: profile } = useUserProfile(address)
  return (
    <AvatarCircle avatarUrl={profile?.avatar_url} colorIndex={index} size={32} />
  )
}

function VoterAvatars({ proposalId, totalVotes }: { proposalId: string; totalVotes: number }) {
  const { data: topVoters } = useQuery<SnapshotVote[]>({
    queryKey: ["top-voters", proposalId],
    queryFn: async () => {
      const res = await fetch(`/api/governance/top-voters?proposalId=${proposalId}&limit=3`)
      if (!res.ok) return []
      const data = await res.json()
      return data.votes || []
    },
    enabled: !!proposalId && totalVotes > 0,
    staleTime: 60 * 1000,
    retry: false,
  })

  if (!totalVotes || !topVoters?.length) return null

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {topVoters.map((vote, i) => (
          <VoterAvatar key={vote.id} address={vote.voter} index={i} />
        ))}
      </div>
      <span className="font-mono text-[10px] text-[#494949]">
        {totalVotes === 1 ? "1 vote" : `${totalVotes} votes`}
      </span>
    </div>
  )
}

// ─── Status badge ───

function StatusBadge({ status }: { status: Proposal["status"] }) {
  const config: Record<string, { label: string; bg: string; text: string }> = {
    active: { label: "ACTIVE", bg: "bg-[#A572ED]", text: "text-[#321F4D]" },
    pending: { label: "PENDING", bg: "bg-[#494949]", text: "text-[#D9D9D9]" },
    passed: { label: "PASSED", bg: "bg-[#233309]", text: "text-[#AFFF2E]" },
    failed: { label: "FAILED", bg: "bg-[#401026]", text: "text-[#FF4297]" },
    executed: { label: "EXECUTED", bg: "bg-[#233309]", text: "text-[#AFFF2E]" },
  }
  const c = config[status] || config.pending
  return (
    <span className={cn("rounded-[6px] px-2 py-1.5 font-mono text-[10px] font-semibold leading-none", c.bg, c.text)}>
      {c.label}
    </span>
  )
}

// ─── Execution badge ───

function ExecutionBadge({ proposal }: { proposal: Proposal }) {
  if (proposal.executionStatus === "vetoed") {
    return <span className="rounded-[6px] bg-[#401026] px-2 py-1.5 font-mono text-[10px] font-semibold leading-none text-[#FF4297]">VETOED</span>
  }
  if (proposal.executionStatus === "executed") {
    const txHash = proposal.executionTxHash && proposal.executionTxHash !== "pending" ? proposal.executionTxHash : null
    return (
      <div className="flex items-center gap-2">
        <span className="rounded-[6px] bg-[#233309] px-2 py-1.5 font-mono text-[10px] font-semibold leading-none text-[#AFFF2E]">EXECUTED</span>
        {txHash && (
          <a
            href={`${process.env.NEXT_PUBLIC_EXPLORER_URL}/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="text-[#AFFF2E] transition-colors hover:text-[#d4ff91]"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    )
  }
  if (proposal.status === "passed") {
    const votingEnd = new Date(proposal.votingEndsAt).getTime()
    const autoExecAt = votingEnd + EXECUTION_DELAY_MS
    const remaining = autoExecAt - Date.now()
    const hours = Math.floor(remaining / (60 * 60 * 1000))
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000))
    const timeLabel = remaining <= 0 ? "Imminent" : hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-help rounded-[6px] bg-[#332B00] px-2 py-1.5 font-mono text-[10px] font-semibold leading-none text-[#FFD600]">
              EXEC PENDING
            </span>
          </TooltipTrigger>
          <TooltipContent><p className="text-xs">Auto-executes in {timeLabel}</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }
  return null
}

// ─── Props ───

interface ProposalDetailProps {
  proposal: Proposal
  ip: Ip
  isOwner: boolean
  onBack: () => void
  onVeto: (snapshotId: string) => Promise<{ success: boolean }>
  onExecute: (snapshotId: string) => Promise<{ success: boolean; signatureData?: unknown }>
  onVote: (proposal: Proposal, choice: VoteChoice) => Promise<{ success: boolean }>
  hasVoted: boolean
  userVoteLabel: string | null
  mutateProposals: () => void
  canVote: boolean
  voteDisabledReason?: string
}

// ─── Main Component ───

const ProposalDetail = ({
  proposal,
  ip,
  isOwner,
  onBack,
  onVeto,
  onExecute,
  onVote,
  hasVoted,
  userVoteLabel,
  mutateProposals,
  canVote,
  voteDisabledReason,
}: ProposalDetailProps) => {
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const votesFor = proposal.scores?.[0] || 0
  const votesAgainst = proposal.scores?.[1] || 0
  const total = votesFor + votesAgainst

  const canVeto =
    isOwner &&
    proposal.status === "active" &&
    proposal.executionStatus !== "vetoed" &&
    proposal.executionStatus !== "executed"

  const canExecute =
    isOwner &&
    proposal.status === "passed" &&
    proposal.executionStatus !== "vetoed" &&
    proposal.executionStatus !== "executed"

  const isVotingActive = proposal.status === "active"
  const [showChangeVote, setShowChangeVote] = useState(false)

  const handleAction = async (actionType: string, fn: () => Promise<unknown>) => {
    setActionLoading(actionType)
    setActionError(null)
    try {
      await fn()
      mutateProposals()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : `Failed to ${actionType}`)
    } finally {
      setActionLoading(null)
    }
  }

  // Quorum data
  const quorum = proposal.quorum || 0
  const requiredYes = quorum + votesAgainst
  const maxValue = Math.max(votesFor, requiredYes, 1)
  const quorumPct = Math.min((votesFor / maxValue) * 100, 100)
  const meetsQuorum = votesFor >= requiredYes

  return (
    <Dialog open onOpenChange={(open) => !open && onBack()}>
      <DialogContent
        hasCloseButton={false}
        className="!bg-[#121212] !border-[0.5px] !border-[#242424] sm:!max-w-[895px] !rounded-[16px] !p-0 !overflow-hidden"
      >
        <div className="flex flex-col overflow-x-hidden">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:gap-5 rounded-t-[12px] p-4 sm:p-5" style={{ backgroundColor: "#121212" }}>
            {/* ID + status row */}
            <div className="flex items-center justify-between gap-2">
              <span className="shrink-0 font-mono text-[12px] sm:text-[14px] font-semibold text-[#494949]">#{proposal.snapshotId?.slice(0, 8) || "---"}</span>
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                <StatusBadge status={proposal.status} />
                <span className="font-mono text-[10px] text-[#797979]">{getTimeRemaining(proposal.votingEndsAt)}</span>
                <ExecutionBadge proposal={proposal} />
              </div>
            </div>

            {/* Title + author */}
            <div className="flex flex-col gap-3">
              <h3 className="text-[16px] sm:text-[20px] font-medium text-white">{proposal.title}</h3>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-[#797979]">Proposed by</span>
                <AuthorInfo address={proposal.createdBy} />
              </div>
            </div>
          </div>

          {/* Body — stacks vertically on mobile, side-by-side on desktop */}
          <div className="flex flex-col sm:flex-row sm:min-h-[380px]">
            {/* Description + voters */}
            <div className="flex flex-1 flex-col justify-between overflow-y-auto p-4 sm:p-6">
              <div className="prose prose-sm prose-invert max-w-none text-[14px] leading-relaxed text-white/90">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  skipHtml
                  components={{
                    h1: ({ children }) => <h1 className="mb-4 mt-2 text-[20px] font-semibold text-white">{children}</h1>,
                    h2: ({ children }) => <h2 className="mb-3 mt-4 text-[18px] font-semibold text-white">{children}</h2>,
                    h3: ({ children }) => <h3 className="mb-2 mt-3 text-[16px] font-semibold text-white">{children}</h3>,
                    p: ({ children }) => <p className="mb-3 whitespace-pre-wrap leading-[1.7] last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                    em: ({ children }) => <em className="italic text-white/70">{children}</em>,
                    ul: ({ children }) => <ul className="mb-3 list-disc space-y-1.5 pl-5">{children}</ul>,
                    ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1.5 pl-5">{children}</ol>,
                    li: ({ children }) => <li className="leading-[1.7] text-white/80">{children}</li>,
                    a: ({ children, href }) => (
                      <a className="text-[#A572ED] underline underline-offset-2 hover:text-[#C4A4F7]" href={href} target="_blank" rel="noreferrer">
                        {children}
                      </a>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="my-3 border-l-2 border-[#A572ED]/40 pl-4 text-white/60">{children}</blockquote>
                    ),
                    code: ({ children, className }) => {
                      const isBlock = className?.includes("language-")
                      if (isBlock) {
                        return <code className="block overflow-x-auto rounded-[8px] bg-[#191919] p-3 font-mono text-[12px] text-[#D9D9D9]">{children}</code>
                      }
                      return <code className="rounded bg-[#242424] px-1.5 py-0.5 font-mono text-[12px] text-[#D9D9D9]">{children}</code>
                    },
                    pre: ({ children }) => <pre className="my-3">{children}</pre>,
                    hr: () => <hr className="my-4 border-[#242424]" />,
                  }}
                >
                  {stripTransferDetails(proposal.description || "")}
                </ReactMarkdown>
              </div>

              {/* Voter avatars */}
              <div className="mt-4 sm:mt-6">
                <VoterAvatars proposalId={proposal.snapshotId} totalVotes={proposal.voterCount || 0} />
              </div>
            </div>

            {/* Separator — horizontal on mobile, vertical on desktop */}
            <div className="h-px w-full bg-[#242424] sm:h-auto sm:w-px" />

            {/* Voting results */}
            <div className="flex w-full min-w-0 flex-col gap-5 p-4 sm:w-[273px] sm:shrink-0 sm:gap-6 sm:p-6">
              {/* For */}
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex min-w-0 items-center justify-between gap-2 font-mono text-[11px] sm:text-[12px]">
                  <span className="shrink-0 font-semibold text-white">For</span>
                  <span className="truncate text-[#494949]">{formatVotes(votesFor)} Votes ({total > 0 ? Math.round((votesFor / total) * 100) : 0}%)</span>
                </div>
                <div className="h-1.5 w-full rounded-[6px]" style={{ backgroundColor: COLOR_BAR_TRACK }}>
                  <div
                    className="h-full rounded-[6px] transition-all"
                    style={{ width: `${total > 0 ? (votesFor / total) * 100 : 0}%`, backgroundColor: COLOR_FOR }}
                  />
                </div>
              </div>

              {/* Against */}
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex min-w-0 items-center justify-between gap-2 font-mono text-[11px] sm:text-[12px]">
                  <span className="shrink-0 font-semibold text-white">Against</span>
                  <span className="truncate text-[#494949]">{formatVotes(votesAgainst)} Votes ({total > 0 ? Math.round((votesAgainst / total) * 100) : 0}%)</span>
                </div>
                <div className="h-1.5 w-full rounded-[6px]" style={{ backgroundColor: COLOR_BAR_TRACK }}>
                  <div
                    className="h-full rounded-[6px] transition-all"
                    style={{ width: `${total > 0 ? (votesAgainst / total) * 100 : 0}%`, backgroundColor: COLOR_AGAINST }}
                  />
                </div>
              </div>

              {/* Quorum */}
              <div className="flex min-w-0 flex-col gap-3 sm:gap-4 rounded-[8px] border-[0.5px] border-[#313131] bg-[#191919] p-3">
                <div className="flex min-w-0 items-center justify-between gap-2">
                  <span className="shrink-0 font-semibold text-[12px] text-white">Quorum</span>
                  <span className="truncate font-mono text-[11px] sm:text-[12px]">
                    <span className="text-[13px] sm:text-[14px] font-medium text-white">{formatVotes(votesFor)}</span>
                    <span className="text-[#494949]">/{formatVotes(requiredYes)}</span>
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-[6px]" style={{ backgroundColor: COLOR_BAR_TRACK }}>
                  <div
                    className={cn("h-full rounded-[6px] transition-all")}
                    style={{ width: `${quorumPct}%`, backgroundColor: meetsQuorum ? COLOR_FOR : COLOR_QUORUM }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom actions */}
          <div className="flex flex-col gap-4 border-t border-[#242424] p-4 sm:p-5">
            {/* Vote section */}
            {isVotingActive && (
              <>
                {hasVoted && !showChangeVote && (
                  <div className="flex items-center justify-between rounded-[8px] bg-[#A572ED]/10 px-4 py-2.5">
                    <span className="font-mono text-[12px] text-[#A572ED]">You voted: <span className="font-semibold">{userVoteLabel}</span></span>
                    {canVote && (
                      <button
                        onClick={() => setShowChangeVote(true)}
                        className="flex items-center gap-1.5 rounded-full border-[0.5px] border-[#A572ED]/30 px-3 py-1 font-mono text-[11px] text-[#A572ED] transition-colors hover:bg-[#A572ED]/10"
                      >
                        <Pencil className="h-3 w-3" />
                        Change
                      </button>
                    )}
                  </div>
                )}

                {!hasVoted && !canVote && voteDisabledReason && (
                  <div className="rounded-[8px] bg-[#191919] px-4 py-2.5">
                    <span className="font-mono text-[12px] text-[#494949]">{voteDisabledReason}</span>
                  </div>
                )}

                {canVote && (!hasVoted || showChangeVote) && (
                  <div className="flex flex-col gap-2.5">
                    {hasVoted && showChangeVote && (
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] text-[#797979]">
                          Current vote: <span className="text-[#A572ED]">{userVoteLabel}</span>
                        </span>
                        <button
                          onClick={() => setShowChangeVote(false)}
                          className="font-mono text-[11px] text-[#494949] transition-colors hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2.5">
                      {(!hasVoted || userVoteLabel !== "For") && (
                        <button
                          onClick={() => handleAction("vote-for", () => onVote(proposal, 1 as VoteChoice))}
                          disabled={actionLoading !== null}
                          className="flex items-center gap-2 rounded-full border-[0.5px] border-[#578017] bg-[#233309] px-4 py-2 text-[13px] sm:text-[14px] font-medium text-white transition-colors hover:bg-[#2d4410] disabled:opacity-50"
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                          {actionLoading === "vote-for" ? "Voting..." : hasVoted ? "Change to For" : "Vote For"}
                        </button>
                      )}
                      {(!hasVoted || userVoteLabel !== "Against") && (
                        <button
                          onClick={() => handleAction("vote-against", () => onVote(proposal, 2 as VoteChoice))}
                          disabled={actionLoading !== null}
                          className="flex items-center gap-2 rounded-full border-[0.5px] border-[#80214B] bg-[#401026] px-4 py-2 text-[13px] sm:text-[14px] font-medium text-white transition-colors hover:bg-[#551533] disabled:opacity-50"
                        >
                          <ThumbsDown className="h-3.5 w-3.5 rotate-180" />
                          {actionLoading === "vote-against" ? "Voting..." : hasVoted ? "Change to Against" : "Vote Against"}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Owner actions (Creator IP Veto/Execute) */}
            {isOwner && (canVeto || canExecute) && (
              <>
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-[#242424]" />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#494949]">Owner Actions</span>
                  <div className="h-px flex-1 bg-[#242424]" />
                </div>
                <div className="flex items-center gap-2.5">
                  {canVeto && (
                    <button
                      onClick={() => handleAction("veto", () => onVeto(proposal.snapshotId))}
                      disabled={actionLoading !== null}
                      className="flex items-center gap-2 rounded-full border-[0.5px] border-[#80214B] bg-[#401026] px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[#551533] disabled:opacity-50"
                    >
                      <ShieldBan className="h-4 w-4" />
                      {actionLoading === "veto" ? "Vetoing..." : "Veto Proposal"}
                    </button>
                  )}
                  {canExecute && (
                    <button
                      onClick={() => handleAction("execute", () => onExecute(proposal.snapshotId))}
                      disabled={actionLoading !== null}
                      className="flex items-center gap-2 rounded-full border-[0.5px] border-[#578017] bg-[#233309] px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[#2d4410] disabled:opacity-50"
                    >
                      <Zap className="h-4 w-4" />
                      {actionLoading === "execute" ? "Executing..." : "Execute Now"}
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Error display */}
            {actionError && (
              <div className="rounded-[8px] bg-[#401026] px-3 py-2 text-xs text-[#FF4297]">{actionError}</div>
            )}

            {/* Transfer details */}
            {proposal.type === "spending" && (proposal.recipientAddress || proposal.amount) && (
              <div className="flex min-w-0 flex-col gap-2 rounded-[8px] border border-[#242424] bg-[#191919] p-3 sm:p-4 font-mono text-[11px] sm:text-[12px]">
                {proposal.recipientAddress && (
                  <div className="flex min-w-0 items-center justify-between gap-3">
                    <span className="shrink-0 text-[#494949]">Recipient</span>
                    <span className="truncate text-[#D9D9D9]">{truncateAddress(proposal.recipientAddress)}</span>
                  </div>
                )}
                {proposal.amount && (
                  <div className="flex min-w-0 items-center justify-between gap-3">
                    <span className="shrink-0 text-[#494949]">Amount</span>
                    <span className="truncate text-[#D9D9D9]">{formatTokenAmount(proposal.amount)}</span>
                  </div>
                )}
                {proposal.tokenAddress && (
                  <div className="flex min-w-0 items-center justify-between gap-3">
                    <span className="shrink-0 text-[#494949]">Token</span>
                    <span className="truncate text-[#D9D9D9]">{truncateAddress(proposal.tokenAddress)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ProposalDetail
