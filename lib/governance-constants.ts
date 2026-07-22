export const SNAPSHOT_PROPOSAL_MIN_SCORE = 1_000_000
export const SNAPSHOT_VOTE_MIN_SCORE = 500_000
export const SNAPSHOT_QUORUM = 80_000_000
export const GOVERNANCE_TOKEN_DECIMALS = 18

const ONE_HOUR_SECONDS = 60 * 60
const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60

export function getVotingPeriodSeconds(): number {
  const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "1514")
  return chainId === 1315 ? ONE_HOUR_SECONDS : SEVEN_DAYS_SECONDS
}
