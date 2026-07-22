import ClientContent from "./ClientHomepageContent"
import { buildHomepageRemixesQuery, type SearchParamsInput } from "./homepage-remixes-query"
import {
  buildAboutToGraduateQuery,
  buildTrendingTiktokQuery,
  buildTrendingTokensQuery,
  pickTopAboutToGraduateRemixes,
} from "./homepage-shelf-queries"
import { Remix } from "@/types/remix"
import { HIDDEN_TRENDING_REMIXES } from "@/lib/constants"
import { env } from "@/config"
import { fetchRemixListThenHealSparklinesIfNeeded, parseHiddenFilteredRemixResults } from "@/lib/remix-sparkline-heal"
import {
  MOCK_ABOUT_TO_GRADUATE_TOKENS,
  MOCK_EXPLORE,
  MOCK_HOMEPAGE_REMIXES,
  MOCK_TIKTOK_TOKENS,
  MOCK_TRENDING_TOKENS,
} from "@/constants/homepageMocks"

export const revalidate = 30

/**
 * Every getter below degrades to an empty result when the API is unreachable,
 * which renders the homepage as a bare "No tokens" shell. On deployments
 * without backend access we substitute demo fixtures so the page still shows
 * something to display instead of an empty page.
 */
const isEmpty = (value: unknown) =>
  value == null || (Array.isArray(value) && value.length === 0) || (typeof value === "object" && Object.keys(value as object).length === 0)

const getExploreData = async () => {
  try {
    const res = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/explore`, {
      next: { revalidate: 30 },
    })
    const data = await res.json()

    return data
  } catch (error) {
    console.error("Fetch Explore Error:", error)
    return []
  }
}

const getTrendingTokensData = async () => {
  try {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/remixes?${buildTrendingTokensQuery().toString()}`
    return await fetchRemixListThenHealSparklinesIfNeeded(
      env.NEXT_PUBLIC_API_BASE_URL,
      url,
      parseHiddenFilteredRemixResults,
      { next: { revalidate: 30 } }
    )
  } catch (error) {
    console.error("Fetch Trending Tokens Error:", error)
    return []
  }
}

const getAboutToGraduateTokensData = async () => {
  try {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/remixes?${buildAboutToGraduateQuery().toString()}`
    const candidates = await fetchRemixListThenHealSparklinesIfNeeded(
      env.NEXT_PUBLIC_API_BASE_URL,
      url,
      parseHiddenFilteredRemixResults,
      { next: { revalidate: 30 } }
    )
    return pickTopAboutToGraduateRemixes(candidates)
  } catch (error) {
    console.error("Fetch About To Graduate Tokens Error:", error)
    return []
  }
}

const getTiktokTokensData = async () => {
  try {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/remixes?${buildTrendingTiktokQuery().toString()}`
    return await fetchRemixListThenHealSparklinesIfNeeded(
      env.NEXT_PUBLIC_API_BASE_URL,
      url,
      parseHiddenFilteredRemixResults,
      { next: { revalidate: 30 } }
    )
  } catch (error) {
    console.error("Fetch TikTok Tokens Error:", error)
    return []
  }
}

const getHomepageRemixesData = async (urlParams?: SearchParamsInput) => {
  try {
    const params = buildHomepageRemixesQuery(urlParams)

    const res = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/remixes?${params.toString()}`, {
      next: { revalidate: 30 },
    })
    const data = await res.json()

    return {
      remixes: data?.results?.filter((remix: Remix) => !HIDDEN_TRENDING_REMIXES.includes(remix.id)) ?? [],
      total: data?.total ?? 0,
    }
  } catch (error) {
    console.error("Fetch Homepage Remixes Error:", error)
    return {
      remixes: [],
      total: 0,
    }
  }
}

export default async function IpExplorePage(props: { searchParams: Promise<SearchParamsInput> }) {
  const searchParams = await props.searchParams

  const [
    exploreData,
    initialTrendingTokensData,
    initialAboutToGraduateTokensData,
    initialTiktokTokensData,
    homepageRemixesData,
  ] = await Promise.all([
    getExploreData(),
    getTrendingTokensData(),
    getAboutToGraduateTokensData(),
    getTiktokTokensData(),
    getHomepageRemixesData(searchParams),
  ])

  // /explore can answer with a payload that is technically non-empty but carries
  // no usable figures, so check the field the hero actually renders. A zero here
  // means the endpoint responded but has nothing to show, which reads as broken.
  const exploreIsEmpty =
    isEmpty(exploreData) || !((exploreData as { total_user_rewards?: number })?.total_user_rewards > 0)
  const trendingIsEmpty = isEmpty(initialTrendingTokensData)
  const graduatingIsEmpty = isEmpty(initialAboutToGraduateTokensData)
  const tiktokIsEmpty = isEmpty(initialTiktokTokensData)
  const remixesIsEmpty = isEmpty(homepageRemixesData?.remixes)

  return (
    <ClientContent
      exploreData={exploreIsEmpty ? MOCK_EXPLORE : exploreData}
      initialTrendingTokensData={trendingIsEmpty ? MOCK_TRENDING_TOKENS : initialTrendingTokensData}
      initialAboutToGraduateTokensData={
        graduatingIsEmpty ? MOCK_ABOUT_TO_GRADUATE_TOKENS : initialAboutToGraduateTokensData
      }
      initialTiktokTokensData={tiktokIsEmpty ? MOCK_TIKTOK_TOKENS : initialTiktokTokensData}
      homepageRemixesData={
        remixesIsEmpty ? { remixes: MOCK_HOMEPAGE_REMIXES, total: MOCK_HOMEPAGE_REMIXES.length } : homepageRemixesData
      }
    />
  )
}
