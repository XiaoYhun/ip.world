import React, { useEffect } from "react"
import { act } from "react-dom/test-utils"
import { createRoot, Root } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useUgcClaims } from "./use-ugc-claims"

vi.mock("@/lib/utils", () => ({
  getAPIRootUrl: () => "https://dev-api.test/api/v1",
}))

type HookResult = ReturnType<typeof useUgcClaims>

function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

function Harness({ onResult }: { onResult: (result: HookResult) => void }) {
  const result = useUgcClaims(
    "0x204Cb20EF4AfD40AC77F8C2f4288a17061FBAf24",
    "0xc137ddf4e4b358c9af2a5a2230a5cb8df331e156",
    "LABUBU",
    20
  )

  useEffect(() => {
    onResult(result)
  }, [onResult, result])

  return null
}

describe("useUgcClaims", () => {
  let container: HTMLDivElement
  let root: Root
  let queryClient: QueryClient

  beforeEach(() => {
    container = document.createElement("div")
    document.body.appendChild(container)
    root = createRoot(container)
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            id: "0xc378-3",
            wallet: "0xc137ddf4e4b358c9af2a5a2230a5cb8df331e156",
            token: "0x204cb20ef4afd40ac77f8c2f4288a17061fbaf24",
            ugc_meme_token_claimed: "9911.61179549",
            ugc_meme_token_claimed_usd: "0.8003609283219142124849534087594778",
            ugc_wip_claimed: "1.0113799",
            ugc_wip_claimed_usd: "1.0113799",
            block_number: "17691199",
            claimed_timestamp: "1777738655",
            transaction_hash: "0xc378",
          },
        ],
        limit: 20,
        offset: 0,
        has_more: false,
        total_ugc_meme_token_claimed: "9911.61179549",
        total_ugc_wip_claimed: "1.0113799",
        total_claimed_usd: "1.8117408283219142124849534087594778",
        total_ugc_meme_token_claimed_usd: "0.8003609283219142124849534087594778",
        total_ugc_wip_claimed_usd: "1.0113799",
        total_claim_count: 1,
      }),
    } as Response)
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
    vi.restoreAllMocks()
  })

  it("maps decimal backend claim amounts and claimed_timestamp into payout history rows", async () => {
    const results: HookResult[] = []

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <Harness onResult={(result) => results.push(result)} />
        </QueryClientProvider>
      )
    })

    // Poll until the query settles instead of guessing a fixed number of ticks,
    // so the assertions don't race the fetch/json resolution chain.
    await act(async () => {
      for (let i = 0; i < 50; i++) {
        const current = results.at(-1)
        if (current?.totalUsd != null || current?.isError) break
        await flushPromises()
      }
    })

    const latest = results.at(-1)
    expect(latest?.isError).toBe(false)
    expect(latest?.totalUsd).toBeCloseTo(1.8117408283)
    expect(latest?.payouts?.[0]?.amountUsd).toBeCloseTo(1.8117408283)
    expect(latest?.payouts?.[0]).toEqual(
      expect.objectContaining({
        id: "0xc378-3",
        tokenAmount: "9.91K $LABUBU",
        ipAmount: "1.01 $IP",
        rangeLabel: "MAY 02, 2026",
        txHash: "0xc378",
      })
    )
  })
})
