import { useQuery } from "@tanstack/react-query"
import { fetchJSONWithAuth } from "@/lib/client/fetcher"
import { Ip } from "@/types/ip"
import { Suggestion } from "@/types/suggestion"
import { Vote } from "@/types/vote"

/**
 * Hook to find the correct suggestion ID that matches the current IP owner
 * This fixes the issue where owner_account_suggestion_id may point to the wrong suggestion
 * when there's a mismatch between the active suggestion and IP owner account/type
 */
export function useOwnerSuggestion(ip: Ip, userAddress?: string) {
  // Fetch all suggestions for this IP
  const {
    data: allSuggestionsData,
    error,
    isLoading,
    refetch,
  } = useQuery<{ results?: Suggestion[] } | null>({
    queryKey: ["ip-suggestions", ip.id],
    queryFn: () => fetchJSONWithAuth<{ results?: Suggestion[] }>(`/api/ips/${ip.id}/suggestions`),
    enabled: !!ip.id,
  })

  // Find the suggestion that matches the current IP owner account and type
  const ownerSuggestion = allSuggestionsData?.results?.find((suggestion: Suggestion) => {
    if (!ip.owner_account || !ip.owner_account_type) return false

    // Normalize usernames for comparison (remove @ if present)
    const normalizeUsername = (username: string) => (username.startsWith("@") ? username.slice(1) : username)

    return (
      normalizeUsername(suggestion.account) === normalizeUsername(ip.owner_account) &&
      suggestion.account_type === ip.owner_account_type
    )
  })

  // Use the found suggestion ID, fallback to the IP's suggestion ID if not found
  const targetSuggestionId = ownerSuggestion?.id || ip.owner_account_suggestion_id

  // Check if the user has voted on the target suggestion
  const userVote =
    userAddress && ownerSuggestion
      ? ownerSuggestion.votes?.find((vote: Vote) => vote.user_address?.toLowerCase() === userAddress?.toLowerCase())
      : undefined

  const hasUserVoted = !!userVote
  const userVoteIsValid = userVote?.is_valid === true

  return {
    targetSuggestionId,
    ownerSuggestion,
    allSuggestions: allSuggestionsData?.results,
    hasUserVoted,
    userVoteIsValid,
    userVote,
    isLoading,
    error,
    mutate: refetch,
  }
}
