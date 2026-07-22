import { redirect } from "next/navigation"
import { withRetry } from "@/lib/retry-utils"
import { Remix } from "@/types/remix"
import TokenContent from "./content"
import { TokenMetrics, selectTokenMetricsSchema } from "@/lib/schema/token-metrics-schema"
import { getAPIRootUrl } from "@/lib/utils"

const TokenDetailPage = async (props: { params: Promise<{ tokenAddress: string }> }) => {
  const params = await props.params
  const [remix, tokenMetrics] = await Promise.all([getRemix(params.tokenAddress), getTokenMetrics(params.tokenAddress)])

  if (!remix) {
    redirect("/create")
  }

  return <TokenContent initialRemix={remix} initialTokenMetrics={tokenMetrics} />
}

const getTokenMetrics = async (tokenAddress: string): Promise<TokenMetrics | undefined> => {
  const result = await withRetry(async () => {
    const response = await fetch(`${getAPIRootUrl()}/token-metrics/${tokenAddress}`, {
      next: { revalidate: 20 },
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    // Validate and transform response safely to avoid hard-failing the token page.
    const parsed = selectTokenMetricsSchema.safeParse(data)
    return parsed.success ? parsed.data : undefined
  })

  return result.data ?? undefined
}

const getRemix = async (tokenAddress: string): Promise<Remix | null> => {
  const result = await withRetry(
    async () => {
      const response = await fetch(`${getAPIRootUrl()}/remixes/${tokenAddress}`, {
        next: { revalidate: 300 },
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = (await response.json()) as Remix
      return data
    },
    {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 4000,
      shouldRetry: (error: Error, attempt: number) => {
        // Don't retry on final attempt
        if (attempt >= 3) return false

        const errorMessage = error.message.toLowerCase()

        // Don't retry on 4xx errors (token not found)
        if (
          errorMessage.includes("400") ||
          errorMessage.includes("401") ||
          errorMessage.includes("403") ||
          errorMessage.includes("404") ||
          errorMessage.includes("410")
        ) {
          return false
        }

        // Retry on 5xx errors, network failures, timeouts
        return (
          errorMessage.includes("5") ||
          errorMessage.includes("network") ||
          errorMessage.includes("timeout") ||
          errorMessage.includes("408") ||
          errorMessage.includes("429")
        )
      },
    }
  )

  return result.data ?? null
}

export default TokenDetailPage
