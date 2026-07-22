export type Holding = {
  token_address: string
  token_image: string
  token_name: string
  token_ticker: string
  decimals: number
  amount: string
  value: number
  market_cap: number
  volume: number
  liquidity: number
  market_cap_change: number
  volume_change: number
  liquidity_change: number
  ip: {
    alias: string
    type: string
    title: string
    image?: string
  }
  favorited_remix: boolean
  // New fields for the updated table format
  claimable_amount?: number
  claimable_total?: number
  total_supply?: number
  claimable_percentage?: number
  is_ip_row?: boolean
  remaining?: number
  vesting_percentage?: number
  token_price?: number
  owed_ip?: number
  claimed_ip?: number // remix.total_weth_to_ip_owner
  claimed_tokens?: number // IPOwnerVault.released(remixAddress)
}
