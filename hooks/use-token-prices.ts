import { useQuery } from "@tanstack/react-query"
import { fetchJSON } from "@/lib/client/fetcher"

export type TokenPriceData = {
  token_prices: Record<string, string>
  market_cap_usd: Record<string, string>
}

type TokenPriceResponse = {
  data: { attributes: TokenPriceData }
}

const useTokenPrices = (tokenAddresses: string[]) => {
  const { data, error, isLoading } = useQuery({
    queryKey: ["token-prices", tokenAddresses],
    queryFn: () =>
      fetchJSON<TokenPriceResponse>(
        `https://api.geckoterminal.com/api/v2/simple/networks/story/token_price/${tokenAddresses.join(",")}?include_market_cap=true`
      ),
    enabled: tokenAddresses?.length > 0,
    refetchInterval: 5000,
    placeholderData: (previousData) => previousData,
  })

  return { data, isLoading, isError: !!error }
}

export default useTokenPrices
