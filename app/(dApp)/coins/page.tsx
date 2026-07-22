import FeaturedRemixCard from "@/components/remixes/featured"
import EmptyState from "@/components/ui/empty-state"
import { env } from "@/config"
import { PAGINATION_LIMIT } from "@/lib/constants"
import { Remix } from "@/types/remix"
import { fetchRemixes } from "./actions"
import RemixesClient from "./remixes-client"

const DEFAULT_SORT = "trending_score_24h"
const DEFAULT_ORDER = "desc"

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export const dynamic = "force-dynamic"
export const revalidate = 60

export default async function ExplorePage(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams

  const query = searchParams["query"] as string
  const sort = searchParams["sort_by"] as string
  const sort_order = searchParams["sort_order"] as string
  const licensed = searchParams["licensed"] as string
  const community = searchParams["community"] as string
  const claimed = searchParams["claimed"] as string
  const verified = searchParams["verified"] as string
  const socials = searchParams["socials"] as string
  const category = searchParams["category"] as string
  const is_graduated = searchParams["is_graduated"] as string
  const hide_spam = searchParams["hide_spam"] as string

  // Fetch initial data
  const response = await fetchRemixes({
    query: query ?? "",
    sort: sort ?? DEFAULT_SORT,
    sort_order: sort_order ?? DEFAULT_ORDER,
    limit: PAGINATION_LIMIT,
    offset: 0,
    licensed: licensed === "true",
    community: community === "true",
    claimed: claimed === "true",
    verified: verified === "true",
    socials: socials === "true",
    category: category ?? "",
    is_graduated: is_graduated === "false" ? false : undefined,
    hide_spam: hide_spam !== "false",
  })

  const remixes = response.results ?? []

  const featuredRemix = await getFeaturedRemix()
  // Fall back to highest mcap token if no featured/bonded token
  const heroRemix = featuredRemix ?? (remixes.length > 0
    ? remixes.reduce((top, r) => (r.market_cap || 0) > (top.market_cap || 0) ? r : top, remixes[0])
    : null)
  return (
    <div className="relative mt-14 w-full md:mt-0">
      <section className="relative">
        {!!heroRemix && !!heroRemix.token_address && (
          <div className="hidden sm:block">
            <FeaturedRemixCard data={heroRemix} />
          </div>
        )}

        <div className="w-full px-3 sm:px-4">
          {remixes ? (
            <RemixesClient initialRemixes={remixes} total={response.total} />
          ) : (
            <EmptyState />
          )}
        </div>
      </section>
    </div>
  )
}

const getFeaturedRemix = async (): Promise<Remix | null> => {
  try {
    const response = await fetch(
      `${env.NEXT_PUBLIC_API_BASE_URL}/remixes?is_graduated=true&sort_by=graduated_at&sort_order=desc&limit=1&offset=0`
    )
    if (!response.ok) return null
    const data = await response.json()
    return data?.results?.[0] ?? null
  } catch {
    return null
  }
}
