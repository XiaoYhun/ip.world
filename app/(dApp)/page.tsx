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

export const revalidate = 30

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

  return (
    <ClientContent
      exploreData={exploreData}
      initialTrendingTokensData={initialTrendingTokensData}
      initialAboutToGraduateTokensData={initialAboutToGraduateTokensData}
      initialTiktokTokensData={initialTiktokTokensData}
      homepageRemixesData={homepageRemixesData}
    />
  )
}
