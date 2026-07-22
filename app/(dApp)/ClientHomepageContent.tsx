"use client"
import { Remix } from "@/types/remix"
import IPHero from "./components/ip-hero"
import TiktokTokens from "./components/tiktok-tokens"
import TrendingTokens from "./components/trending-tokens"
import HomepageRemixes from "./components/homepage-remixes"
import { Explore } from "@/types/ip"

export default function ClientHomepageContent({
  exploreData,
  initialTrendingTokensData,
  initialAboutToGraduateTokensData,
  initialTiktokTokensData,
  homepageRemixesData,
}: {
  exploreData: Explore
  initialTrendingTokensData: Remix[]
  initialAboutToGraduateTokensData: Remix[]
  initialTiktokTokensData: Remix[]
  homepageRemixesData: {
    remixes: Remix[]
    total: number
  }
}) {
  return (
    <div className="flex h-full w-full flex-col gap-6 overflow-x-clip px-3 pt-0 pb-12 text-sm sm:gap-10 sm:px-4 sm:text-base">
      <IPHero exploreData={exploreData} />
      <TrendingTokens trendingTokens={initialTrendingTokensData} aboutToGraduateTokens={initialAboutToGraduateTokensData} />
      <div className="hidden sm:block">
        <TiktokTokens tokens={initialTiktokTokensData} customTitle="Trending On TikTok" />
      </div>
      <HomepageRemixes initialRemixes={homepageRemixesData.remixes} total={homepageRemixesData.total} />
    </div>
  )
}
