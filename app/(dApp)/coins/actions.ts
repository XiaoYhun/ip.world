"use server"

import { env } from "@/config"
import { HIDDEN_TRENDING_REMIXES } from "@/lib/constants"
import { Remix } from "@/types/remix"
import { ListResponse } from "@/types/response"

export const fetchRemixes = async ({
  query,
  sort,
  sort_order,
  limit,
  offset,
  licensed,
  community,
  verified,
  socials,
  claimed,
  category,
  is_graduated,
  hide_spam,
}: {
  query: string
  sort: string
  sort_order: string
  limit: number
  offset: number
  licensed: boolean
  community: boolean
  verified: boolean
  socials: boolean
  claimed: boolean
  category: string
  is_graduated?: boolean
  hide_spam?: boolean
}): Promise<ListResponse<Remix>> => {
  // Map frontend sort params to backend params
  const backendSort = sort === "featured" ? "is_featured" : sort

  const response = await fetch(
    `${env.NEXT_PUBLIC_API_BASE_URL}/remixes${query ? `/search?tag=${query}&` : "?"}sort_by=${backendSort}&sort_order=${sort_order}&category=${category}` +
      (licensed ? "&ip_type=creator" : community ? "&ip_type=community" : "") +
      (verified ? "&is_verified=true" : "") +
      (socials ? "&has_socials_attached=true" : "") +
      (claimed ? "&is_claimed=true" : "") +
      (is_graduated === false ? "&is_graduated=false" : "") +
      (hide_spam === false ? "&hide_spam=false" : "") +
      `&limit=${limit}&offset=${offset}`
  )

  if (!response.ok) {
    return {
      results: [],
      total: 0,
      limit,
      offset,
    }
  }

  const data = (await response.json()) as ListResponse<Remix>

  // Filter out hidden remixes from results
  if (data?.results) {
    data.results = data.results.filter((remix: Remix) => !HIDDEN_TRENDING_REMIXES.includes(remix.id))
  }

  return data
}
