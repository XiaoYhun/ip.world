"use client"

import { useQuery } from "@tanstack/react-query"
import { getAPIRootUrl } from "@/lib/utils"

export type PnlPosition = {
  token_address: string
  symbol?: string
  image_url?: string
  quantity_bought: string
  quantity_sold: string
  quantity_held: string
  total_quantity?: string
  total_quantity_bought?: string
  total_quantity_sold?: string
  bought_usd: string
  sold_usd: string
  holding_usd: string
  total_bought_usd?: string
  total_sold_usd?: string
  total_holding_usd?: string
  realized_pnl_ip: string
  unrealized_pnl_ip: string
  pnl_ip: string
  pnl_usd: string
  pnl_percentage: string
}

export type UserPnl = {
  user_address: string
  total_bought_usd: string
  total_sold_usd: string
  total_holding_usd: string
  total_quantity_bought: string
  total_quantity_sold: string
  total_realized_pnl_ip: string
  total_unrealized_pnl_ip: string
  total_pnl_ip: string
  total_pnl_usd: string
  total_pnl_percentage: string
  total_unrealized_pnl_usd: string
  total_unrealized_pnl_percentage: string
  positions: PnlPosition[]
}

export function useUserPnl(userAddress: string | undefined) {
  const { data, isLoading, isError, refetch } = useQuery<UserPnl | null>({
    queryKey: ["user-pnl", userAddress],
    queryFn: () =>
      fetch(`${getAPIRootUrl()}/users/${userAddress}/pnl`).then((res) => {
        if (!res.ok) return null
        return res.json() as Promise<UserPnl>
      }),
    enabled: !!userAddress,
    refetchInterval: 60_000,
  })

  return {
    data: data ?? null,
    isLoading,
    isError,
    refetch,
  }
}
