"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchJSONWithAuth } from "@/lib/client/fetcher"
import { getAPIRootUrl } from "@/lib/utils"

type TokenReward = {
  ip_owner_rewards_usd: string
  total_rewards_usd: string
  wip_to_ip_owner_usd: string
  vesting_claimed_amount_usd: string
  token_to_ip_treasury_usd: string
}

type IPReward = {
  ip_owner_rewards_usd: string
  total_rewards_usd: string
  token_to_ip_treasury_usd: string
}

type RewardsAPIResponse = {
  token_address: string
  token_reward: TokenReward
  ip_reward: IPReward | null
}

export type RewardsResponse = {
  token_address: string
  owner_rewards_usd: number
  owner_rewards_ip: number
  total_rewards_usd: number
  total_rewards_ip: number
  ip_treasury_fees_usd: number
  token_treasury_fees_usd: number
}

function mapResponse(raw: RewardsAPIResponse): RewardsResponse {
  const tokenReward = raw.token_reward
  const ipReward = raw.ip_reward
  return {
    token_address: raw.token_address,
    owner_rewards_usd: parseFloat(ipReward?.ip_owner_rewards_usd ?? tokenReward?.ip_owner_rewards_usd ?? "0"),
    owner_rewards_ip: parseFloat(tokenReward?.wip_to_ip_owner_usd ?? "0"),
    total_rewards_usd: parseFloat(tokenReward?.total_rewards_usd ?? "0"),
    total_rewards_ip: 0,
    ip_treasury_fees_usd: parseFloat(ipReward?.token_to_ip_treasury_usd ?? "0"),
    token_treasury_fees_usd: parseFloat(tokenReward?.token_to_ip_treasury_usd ?? "0"),
  }
}

export function useGetRewards(tokenAddress: string | undefined) {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["rewards", tokenAddress],
    queryFn: async () => {
      const raw = await fetchJSONWithAuth<RewardsAPIResponse>(
        `${getAPIRootUrl()}/rewards/${tokenAddress}`
      )
      return mapResponse(raw)
    },
    enabled: !!tokenAddress,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    staleTime: 30_000,
  })

  return {
    data: data ?? null,
    isLoading,
    isError: !!error,
    refetch,
  }
}
