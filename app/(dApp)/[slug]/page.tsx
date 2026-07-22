import { notFound } from "next/navigation"
import { PAGINATION_LIMIT } from "@/lib/constants"
import { UserProfile } from "@/types/profile"
import {
  fetchProfile,
  fetchUserHoldings,
  fetchUserIps,
  fetchUserReferrals,
  fetchUserRemixes,
  fetchUserTakes,
} from "../profile/[slug]/actions"
import { fetchUserStats } from "../leaderboard/actions"
import ProfileContent from "../profile/[slug]/_components/ProfileContent"

const PROFILE_INITIAL_LIMIT = 100

type Params = Promise<{ slug: string }>
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export const dynamic = "force-dynamic"
export const revalidate = 30

export default async function AtUsernamePage({
  params,
  searchParams,
}: {
  params: Params
  searchParams: SearchParams
}) {
  const { slug } = await params
  const decoded = decodeURIComponent(slug)

  // Only handle @username patterns
  if (!decoded.startsWith("@")) {
    notFound()
  }

  const username = decoded.slice(1)
  if (!username) notFound()

  const profile = await fetchProfile({ userIdentifier: username })

  if (!profile?.user) {
    notFound()
  }

  const searchParamsData = await searchParams
  const walletAddress = profile.user.wallet_address
  const currentPage = Number(searchParamsData.referrals_page) || 1
  const offset = (currentPage - 1) * PAGINATION_LIMIT

  const [holdingsResponse, remixesResponse, ipsResponse, takesResponse, referralsResponse, userStatsResponse] =
    await Promise.all([
      fetchUserHoldings({ userAddress: walletAddress, limit: PROFILE_INITIAL_LIMIT, offset: 0 }),
      fetchUserRemixes({ userAddress: walletAddress, limit: PROFILE_INITIAL_LIMIT, offset: 0 }),
      fetchUserIps({ userAddress: walletAddress, limit: PAGINATION_LIMIT, offset: 0 }),
      fetchUserTakes({ userAddress: walletAddress, limit: PAGINATION_LIMIT, offset: 0 }),
      fetchUserReferrals({ userAddress: walletAddress, limit: PAGINATION_LIMIT, offset: offset }),
      fetchUserStats(walletAddress),
    ])

  return (
    <ProfileContent
      profile={profile as unknown as UserProfile}
      holdingsResponse={holdingsResponse}
      remixesResponse={remixesResponse}
      ipsResponse={ipsResponse}
      takesResponse={takesResponse}
      referralsResponse={referralsResponse}
      referralsCurrentPage={currentPage}
      statsResponse={userStatsResponse}
      addressFromUrl={walletAddress}
    />
  )
}
