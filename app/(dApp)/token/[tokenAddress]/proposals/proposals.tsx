"use client"

import { useState, useMemo } from "react"
import { Address, formatUnits } from "viem"
import { useBalance, useReadContract } from "wagmi"
import { useAccount } from "@/hooks/use-account"
import { useQuery } from "@tanstack/react-query"
import { ThumbsUp, ThumbsDown, User2, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { Ip } from "@/types/ip"
import { Remix } from "@/types/remix"
import { User } from "@/types/user"
import { formatNumberWithSuffix } from "@/lib/number"
import { truncateAddress } from "@/lib/strings"
import {
  useCommunityGovernance,
  Proposal,
} from "@/hooks/use-community-governance"
import { useGetRewards } from "@/hooks/use-get-rewards"
import { useIpPrice } from "@/context/token-metrics-context"
import { useTokenMetricsLive } from "@/hooks/use-token-metrics"
import IPTokenABI from "@/config/IPToken.abi.json"
import { VOTE_CHOICES, SnapshotVote } from "@/lib/snapshot-client"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import CreateProposalDialog from "./create-proposal-dialog"
import ProposalDetail from "./proposal-detail"

// ─── Design tokens (from Figma) ───
const COLOR_FOR = "#AFFF2E"
const COLOR_AGAINST = "#FF4297"
const COLOR_BAR_TRACK = "#242424"

// ─── Helpers ───

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

function formatVotes(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return n.toLocaleString()
}

function truncateSnapshotId(id: string | undefined): string {
  if (!id) return "#---"
  return `#${id.slice(0, 8)}`
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

function stripMarkdown(text: string): string {
  return stripTransferDetails(text)
    .replace(/\*\*(.+?)\*\*/g, "$1")      // bold
    .replace(/\*(.+?)\*/g, "$1")           // italic
    .replace(/#{1,6}\s/g, "")              // headings
    .replace(/[-*+]\s/g, "")               // unordered list markers
    .replace(/\d+\.\s/g, "")              // ordered list markers
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")   // links
    .replace(/`(.+?)`/g, "$1")            // inline code
    .replace(/\n{2,}/g, " ")              // collapse double newlines
    .replace(/\n/g, " ")                  // collapse newlines
    .trim()
}

// ─── Avatar colors for fallback initials ───
const AVATAR_COLORS = ["#A572ED", "#FF4297", "#AFFF2E", "#FFD600", "#00D1FF"]

// ─── Profile-aware author/voter components ───

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
    <div className="flex items-center gap-1.5">
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

function VoterAvatar({ address, index }: { address: string; index: number }) {
  const { data: profile } = useUserProfile(address)
  return (
    <AvatarCircle avatarUrl={profile?.avatar_url} colorIndex={index} size={32} />
  )
}

// ─── Status badge (Figma aligned) ───

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

const EXECUTION_DELAY_MS = 24 * 60 * 60 * 1000

function ExecutionBadge({ proposal, size = "sm" }: { proposal: Proposal; size?: "sm" | "md" }) {
  const textSize = size === "md" ? "text-[12px]" : "text-[10px]"
  if (proposal.executionStatus === "vetoed") {
    return <span className={cn("rounded-[6px] bg-[#401026] px-2 py-1.5 font-mono font-semibold leading-none text-[#FF4297]", textSize)}>VETOED</span>
  }
  if (proposal.executionStatus === "executed") {
    const txHash = proposal.executionTxHash && proposal.executionTxHash !== "pending" ? proposal.executionTxHash : null
    return (
      <div className="flex items-center gap-2">
        <span className={cn("rounded-[6px] bg-[#233309] px-2 py-1.5 font-mono font-semibold leading-none text-[#AFFF2E]", textSize)}>EXECUTED</span>
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
    const remaining = autoExecAt - new Date().getTime()
    const hours = Math.floor(remaining / (60 * 60 * 1000))
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000))
    const timeLabel = remaining <= 0 ? "Imminent" : hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn("cursor-help rounded-[6px] bg-[#332B00] px-2 py-1.5 font-mono font-semibold leading-none text-[#FFD600]", textSize)}>
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

// ─── Vote bar (Figma: green #AFFF2E / pink #FF4297, 6px, rounded) ───

function VoteBar({ scores }: { scores?: number[] }) {
  const votesFor = scores?.[0] || 0
  const votesAgainst = scores?.[1] || 0
  const total = votesFor + votesAgainst
  const forPct = total > 0 ? (votesFor / total) * 100 : 50

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">For</span>
          <span className="font-mono text-[#494949]">{formatVotes(votesFor)} Votes ({total > 0 ? Math.round((votesFor / total) * 100) : 0}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">Against</span>
          <span className="font-mono text-[#494949]">{formatVotes(votesAgainst)} Votes ({total > 0 ? Math.round((votesAgainst / total) * 100) : 0}%)</span>
        </div>
      </div>
      <div className="flex h-1.5 w-full gap-2">
        <div
          className="h-full rounded-[6px] transition-all"
          style={{ width: `${forPct}%`, backgroundColor: total > 0 ? COLOR_FOR : COLOR_BAR_TRACK }}
        />
        <div
          className="h-full rounded-[13px] transition-all"
          style={{ width: `${100 - forPct}%`, backgroundColor: total > 0 ? COLOR_AGAINST : COLOR_BAR_TRACK }}
        />
      </div>
    </div>
  )
}

// ─── Treasury Header ───

function TreasuryHeader({
  ip,
  tokenAddress,
  tokenSymbol,
  isPrimaryToken,
  canCreate,
  createDisabledReason,
  onCreateClick,
  totalFeesEarnedUsd,
}: {
  ip: Ip
  tokenAddress: string
  tokenSymbol: string
  isPrimaryToken: boolean
  canCreate: boolean
  createDisabledReason: string
  onCreateClick: () => void
  totalFeesEarnedUsd: number
}) {
  const safeAddress = ip.safe_address as Address
  const ipPrice = useIpPrice()
  const liveMetrics = useTokenMetricsLive(tokenAddress)

  const { data: nativeIpBalance } = useBalance({
    address: safeAddress,
    query: { enabled: !!safeAddress && isPrimaryToken },
  })

  // Read current page token balance of the safe on-chain
  const { data: tokenBalanceRaw } = useReadContract({
    address: tokenAddress as Address,
    abi: IPTokenABI,
    functionName: "balanceOf",
    args: [safeAddress],
    query: { enabled: !!safeAddress && !!tokenAddress },
  })

  const stats = useMemo(() => {
    const ipBalance = isPrimaryToken && nativeIpBalance ? parseFloat(formatUnits(nativeIpBalance.value, 18)) : 0
    const tokenBalance = tokenBalanceRaw ? parseFloat(formatUnits(tokenBalanceRaw as bigint, 18)) : 0

    const ipUsd = ipBalance * (ipPrice || 0)
    const tokenPriceUsd = Number(liveMetrics?.price_usd ?? "0")
    const tokenUsd = tokenBalance * tokenPriceUsd

    const totalUsd = ipUsd + tokenUsd

    const breakdownItems: { label: string; amount: number }[] = []
    if (ipBalance > 0) {
      breakdownItems.push({ label: `${formatNumberWithSuffix(ipBalance)} $IP`, amount: ipBalance })
    }
    if (tokenBalance > 0) {
      breakdownItems.push({ label: `${formatNumberWithSuffix(tokenBalance)} $${tokenSymbol}`, amount: tokenBalance })
    }

    return { totalUsd, breakdownItems }
  }, [isPrimaryToken, nativeIpBalance, tokenBalanceRaw, ipPrice, liveMetrics, tokenSymbol])

  const splitAmount = (value: number) => {
    const formatted = formatNumberWithSuffix(value, 2)
    const dotIdx = formatted.indexOf(".")
    if (dotIdx === -1) return { whole: formatted, decimal: ".00" }
    return { whole: formatted.slice(0, dotIdx), decimal: formatted.slice(dotIdx) }
  }

  const treasury = splitAmount(stats.totalUsd)
  const owner_rewards_usd = splitAmount(totalFeesEarnedUsd)

  return (
    <div className="flex flex-col gap-4 overflow-clip rounded-[12px] border-[0.6px] border-[#242424] bg-chessboard p-4 sm:p-5">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-6 sm:gap-24">
          {/* Community Treasury */}
          <div className="flex flex-col gap-3 sm:gap-6">
            <span className="text-[10px] sm:text-[12px] font-medium uppercase text-[#797979]">
              Community Treasury
            </span>
            <div className="flex flex-col gap-2 sm:gap-4">
              <span className="font-mono text-[24px] sm:text-[32px] font-normal leading-none text-white" style={{ fontFeatureSettings: "'lnum' 1, 'tnum' 1" }}>
                ${treasury.whole}<span className="text-[#494949]">{treasury.decimal}</span>
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {stats.breakdownItems.length > 0 ? (
                  stats.breakdownItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {i > 0 && <div className="h-1 w-1 rounded-full bg-[#494949]" />}
                      <span className="font-mono text-[11px] sm:text-[12px] text-[#b3b3b3]" style={{ fontFeatureSettings: "'lnum' 1, 'tnum' 1" }}>{item.label}</span>
                    </div>
                  ))
                ) : (
                  <span className="font-mono text-[11px] sm:text-[12px] text-[#b3b3b3]">No tokens yet</span>
                )}
              </div>
            </div>
          </div>
          {/* Total Fees Earned */}
          <div className="flex flex-col items-end gap-3 sm:gap-6">
            <span className="text-[10px] sm:text-[12px] font-medium uppercase text-[#797979]">
              Total Fees Earned
            </span>
            <div className="flex flex-col items-end gap-2 sm:gap-4">
              <span className="font-mono text-[18px] sm:text-[24px] font-normal leading-none text-white" style={{ fontFeatureSettings: "'lnum' 1, 'tnum' 1" }}>
                ${owner_rewards_usd.whole}<span className="text-[#494949]">{owner_rewards_usd.decimal}</span>
              </span>
              <span className="font-mono text-[10px] sm:text-[12px] font-semibold text-[#494949]" style={{ fontFeatureSettings: "'lnum' 1, 'tnum' 1" }}>ALL TIME</span>
            </div>
          </div>
        </div>
        {canCreate ? (
          <button
            onClick={onCreateClick}
            className="w-full rounded-[8px] border-[0.5px] border-[#313131] px-5 py-3 text-[14px] font-medium text-[#797979] transition-colors hover:border-[#797979] hover:text-white sm:w-auto sm:py-4"
          >
            New Proposal
          </button>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <button
                    disabled
                    className="w-full !cursor-not-allowed rounded-[8px] border-[0.5px] border-[#313131] px-5 py-3 text-[14px] font-medium text-[#494949] sm:w-auto sm:py-4"
                  >
                    New Proposal
                  </button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">{createDisabledReason}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  )
}

// ─── Active Proposal Card ───

function ActiveProposalCard({
  proposal,
  onClick,
  onVote,
  hasVoted,
  userVoteLabel,
  voting,
  canVote,
  voteDisabledReason,
}: {
  proposal: Proposal
  onClick: () => void
  onVote: (proposal: Proposal, choice: 1 | 2 | 3) => Promise<{ success: boolean }>
  hasVoted: boolean
  userVoteLabel: string | null
  voting: string | null
  canVote: boolean
  voteDisabledReason: string
}) {
  return (
    <div
      onClick={onClick}
      className="flex cursor-pointer flex-col gap-4 rounded-[16px] border-[0.5px] border-[#242424] bg-[#121212] px-[18px] py-[19px] transition-colors hover:border-[#313131]"
    >
      {/* Content area */}
      <div className="flex flex-col gap-6 sm:gap-9 px-3 sm:px-5 pb-4 sm:pb-6 pt-3 sm:pt-4">
        {/* Header + title + description */}
        <div className="flex flex-col gap-4 sm:gap-5">
          {/* ID + status row */}
          <div className="flex items-center justify-between gap-2">
            <span className="shrink-0 font-mono text-[12px] sm:text-[14px] font-semibold text-[#494949]" style={{ fontFeatureSettings: "'lnum' 1, 'tnum' 1" }}>{truncateSnapshotId(proposal.snapshotId)}</span>
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <StatusBadge status={proposal.status} />
              <span className="font-mono text-[10px] text-[#797979]" style={{ fontFeatureSettings: "'lnum' 1, 'tnum' 1" }}>{getTimeRemaining(proposal.votingEndsAt)}</span>
              <ExecutionBadge proposal={proposal} />
            </div>
          </div>

          {/* Title + author + description */}
          <div className="flex flex-col gap-3">
            <h4 className="text-[16px] sm:text-[20px] font-medium text-white" style={{ fontFeatureSettings: "'lnum' 1, 'tnum' 1" }}>{proposal.title}</h4>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-[#797979]" style={{ fontFeatureSettings: "'lnum' 1, 'tnum' 1" }}>Proposed by</span>
              <AuthorInfo address={proposal.createdBy} />
            </div>
            <p className="line-clamp-2 text-[14px] leading-relaxed text-[#b3b3b3]" style={{ fontFeatureSettings: "'lnum' 1, 'tnum' 1" }}>{stripMarkdown(proposal.description)}</p>
          </div>
        </div>

        {/* Vote bars */}
        <VoteBar scores={proposal.scores} />
      </div>

      {/* Footer bar */}
      <div
        className="flex items-center justify-between rounded-[12px] border-[0.5px] border-[#242424] bg-[#121212] px-3 sm:px-5 py-3"
        onClick={(e) => e.stopPropagation()}
      >
        <VoterAvatars proposalId={proposal.snapshotId} totalVotes={proposal.voterCount || 0} />
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            {proposal.status === "active" && !hasVoted && canVote && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); onVote(proposal, VOTE_CHOICES.FOR) }}
                  disabled={voting === proposal.id}
                  className="flex items-center justify-center rounded-full border-[0.5px] border-[#578017] bg-[#233309] p-2 text-[#AFFF2E] transition-colors hover:bg-[#2d4410]"
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onVote(proposal, VOTE_CHOICES.AGAINST) }}
                  disabled={voting === proposal.id}
                  className="flex items-center justify-center rounded-full border-[0.5px] border-[#80214b] bg-[#401026] p-2 text-[#FF4297] transition-colors hover:bg-[#551533]"
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                </button>
              </>
            )}
            {proposal.status === "active" && !hasVoted && !canVote && voteDisabledReason && (
              <span className="font-mono text-[10px] text-[#494949]">{voteDisabledReason}</span>
            )}
            {hasVoted && (
              <span className="rounded-[6px] bg-[#A572ED]/20 px-2 py-1 font-mono text-[10px] text-[#A572ED]">
                Voted: {userVoteLabel}
              </span>
            )}
          </div>
          <button
            onClick={onClick}
            className="shrink-0 rounded-[8px] border-[0.5px] border-[#313131] px-3 sm:px-5 py-2.5 sm:py-3 text-[13px] sm:text-[14px] font-medium text-[#797979] transition-colors hover:border-[#797979] hover:text-white"
          >
            Read More
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Past Proposal Card (compact) ───

function PastStatusBadge({ status }: { status: Proposal["status"] }) {
  const config: Record<string, { label: string; bg: string; text: string }> = {
    passed: { label: "PASSED", bg: "bg-[#afff2e]", text: "text-[#4b6b17]" },
    failed: { label: "FAILED", bg: "bg-[#ff4297]", text: "text-[#4a123b]" },
    executed: { label: "EXECUTED", bg: "bg-[#afff2e]", text: "text-[#4b6b17]" },
  }
  const c = config[status] || { label: status.toUpperCase(), bg: "bg-[#494949]", text: "text-[#D9D9D9]" }
  return (
    <span className={cn("shrink-0 rounded-[6px] px-2 py-1.5 font-mono text-[12px] font-semibold leading-none", c.bg, c.text)} style={{ fontFeatureSettings: "'lnum' 1, 'tnum' 1" }}>
      {c.label}
    </span>
  )
}

function PastProposalCard({
  proposal,
  onClick,
}: {
  proposal: Proposal
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className="flex cursor-pointer flex-col rounded-[16px] border-[0.5px] border-[#242424] bg-[#0d0d0d] px-[18px] py-[19px] transition-colors hover:border-[#313131]"
    >
      <div className="flex flex-col gap-6">
        {/* Title + vote bars */}
        <div className="flex flex-col gap-4">
          {/* ID + status row */}
          <div className="flex items-center justify-between gap-2">
            <span className="shrink-0 font-mono text-[16px] sm:text-[20px] font-medium text-[#494949]" style={{ fontFeatureSettings: "'lnum' 1, 'tnum' 1" }}>{truncateSnapshotId(proposal.snapshotId)}</span>
            <div className="flex shrink-0 flex-wrap items-center gap-1.5">
              <PastStatusBadge status={proposal.status} />
              <ExecutionBadge proposal={proposal} size="md" />
            </div>
          </div>
          {/* Title */}
          <h4 className="text-[16px] sm:text-[20px] font-medium text-white" style={{ fontFeatureSettings: "'lnum' 1, 'tnum' 1" }}>{proposal.title}</h4>

          {/* Vote bars */}
          <VoteBar scores={proposal.scores} />
        </div>

        {/* Footer bar */}
        <div className="flex items-center justify-between rounded-[12px] border-[0.5px] border-[#242424] bg-[#121212] px-3 sm:px-5 py-3">
          <VoterAvatars proposalId={proposal.snapshotId} totalVotes={proposal.voterCount || 0} />
          <button
            onClick={onClick}
            className="shrink-0 rounded-[8px] border-[0.5px] border-[#313131] px-3 sm:px-5 py-2.5 sm:py-3 text-[13px] sm:text-[14px] font-medium text-[#797979] transition-colors hover:border-[#797979] hover:text-white"
          >
            Read More
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Proposals Component ───

const Proposals = ({ remix, ip }: { remix: Remix; ip: Ip }) => {
  const { address } = useAccount()
  const tokenAddress = remix.token_address
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const {
    proposals,
    loading,
    voting,
    canCreateProposal,
    canVote,
    vetoProposal,
    executeProposal,
    voteOnProposal,
    mutateProposals,
    hasUserVoted,
    getUserVoteLabel,
    createProposalDisabledReason,
    voteDisabledReason,
  } = useCommunityGovernance(ip.id, ip, tokenAddress)

  const isIpOwner = address && ip.owner_address?.toLowerCase() === address.toLowerCase()
  const safeAddress = ip.safe_address
  const { data: rewards } = useGetRewards(tokenAddress)

  // Primary token = the one chosen during verification (remixes.default_remix).
  // Fallback to earliest-created token if governance hasn't finalized yet.
  const isPrimaryToken = useMemo(() => {
    if (!ip.remixes || ip.remixes.length === 0) return false
    const defaultRemix = ip.remixes.find((r) => r.default_remix)
    if (defaultRemix) {
      return tokenAddress.toLowerCase() === defaultRemix.token_address.toLowerCase()
    }
    const sorted = [...ip.remixes].sort((a, b) =>
      new Date(a.token_created_at || a.created_at).getTime() -
      new Date(b.token_created_at || b.created_at).getTime()
    )
    return tokenAddress.toLowerCase() === sorted[0].token_address.toLowerCase()
  }, [ip.remixes, tokenAddress])

  // Primary token shows IP-level fees (aggregated); non-primary shows token-level only
  const totalFeesEarnedUsd = useMemo(() => {
    if (!rewards) return 0
    const treasuryFees = isPrimaryToken ? rewards.ip_treasury_fees_usd : rewards.token_treasury_fees_usd
    if (ip.type === "community") {
      return rewards.owner_rewards_usd + treasuryFees
    }
    return treasuryFees
  }, [rewards, ip.type, isPrimaryToken])

  // Derive selectedProposal from the fresh proposals array
  const selectedProposal = useMemo(
    () => (selectedProposalId ? proposals.find((p) => p.id === selectedProposalId || p.snapshotId === selectedProposalId) ?? null : null),
    [proposals, selectedProposalId]
  )

  // Split proposals into active / past
  const activeProposals = useMemo(
    () => proposals.filter((p) => p.status === "active" || p.status === "pending"),
    [proposals]
  )
  const pastProposals = useMemo(
    () => proposals.filter((p) => ["passed", "failed", "executed"].includes(p.status)),
    [proposals]
  )

  if (!safeAddress) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-[#797979]">
        <p className="text-sm">Governance is not yet set up for this Treasury.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pl-6 pr-4 py-4 min-h-[500px]">
      {/* Proposal detail dialog (renders as overlay when a proposal is selected) */}
      {selectedProposal && (
        <ProposalDetail
          proposal={selectedProposal}
          ip={ip}
          isOwner={!!isIpOwner}
          onBack={() => setSelectedProposalId(null)}
          onVeto={vetoProposal}
          onExecute={executeProposal}
          onVote={voteOnProposal}
          hasVoted={hasUserVoted(selectedProposal)}
          userVoteLabel={getUserVoteLabel(selectedProposal)}
          mutateProposals={mutateProposals}
          canVote={canVote()}
          voteDisabledReason={voteDisabledReason}
        />
      )}
      {/* Treasury header */}
      <TreasuryHeader
        ip={ip}
        tokenAddress={tokenAddress}
        tokenSymbol={remix.symbol}
        isPrimaryToken={isPrimaryToken}
        canCreate={canCreateProposal()}
        createDisabledReason={createProposalDisabledReason}
        onCreateClick={() => setShowCreate(true)}
        totalFeesEarnedUsd={totalFeesEarnedUsd}
      />

      {/* Divider */}
      <div className="h-px w-full bg-[#242424]" />

      {/* Loading */}
      {loading && proposals.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#494949] border-t-white" />
        </div>
      ) : proposals.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-[#797979]">
          <p className="text-sm">No proposals yet for this token.</p>
          {canCreateProposal() && (
            <button onClick={() => setShowCreate(true)} className="mt-2 text-sm text-[#A572ED] hover:underline">
              Create the first proposal
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Active section */}
          {activeProposals.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-1.5">
                <h3 className="text-[16px] sm:text-[20px] font-medium text-white">Active</h3>
                <span className="font-mono text-[16px] sm:text-[20px] font-medium text-[#797979]">{activeProposals.length}</span>
              </div>
              <div className="flex flex-col gap-3">
                {activeProposals.map((proposal) => (
                  <ActiveProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    onClick={() => setSelectedProposalId(proposal.snapshotId || proposal.id)}
                    onVote={voteOnProposal}
                    hasVoted={hasUserVoted(proposal)}
                    userVoteLabel={getUserVoteLabel(proposal)}
                    voting={voting}
                    canVote={canVote()}
                    voteDisabledReason={voteDisabledReason}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Past section */}
          {pastProposals.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-1.5">
                <h3 className="text-[16px] sm:text-[20px] font-medium text-white">Past</h3>
                <span className="font-mono text-[16px] sm:text-[20px] font-medium text-[#797979]">{pastProposals.length}</span>
              </div>
              <div className="flex flex-col gap-3">
                {pastProposals.map((proposal) => (
                  <PastProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    onClick={() => setSelectedProposalId(proposal.snapshotId || proposal.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <CreateProposalDialog
          ip={ip}
          tokenAddress={tokenAddress}
          safeAddress={safeAddress}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false)
            mutateProposals()
          }}
        />
      )}
    </div>
  )
}

export default Proposals
