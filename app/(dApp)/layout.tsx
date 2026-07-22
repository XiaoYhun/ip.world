import MobileSearchPopover from "@/components/navigation/mobile-search-popover"
import MobileDrawer from "@/components/sidebar/mobile-drawer"
import AppProviders from "./providers"
import { getAPIRootUrl } from "@/lib/utils"
import { LayoutShell } from "@/components/layout-shell"
import { fetchRemixListThenHealSparklinesIfNeeded, parseHiddenFilteredRemixResults } from "@/lib/remix-sparkline-heal"

export const revalidate = 10

const getTrendingTokensData = async () => {
  try {
    const root = getAPIRootUrl()
    const url = `${root}/remixes?sort_by=trending_score_24h&sort_order=desc&limit=10&offset=0`
    return await fetchRemixListThenHealSparklinesIfNeeded(root, url, parseHiddenFilteredRemixResults, {
      next: { revalidate: 10 },
    })
  } catch (error) {
    console.error("Fetch Trending Tokens Error:", error)
    return []
  }
}

/**
 * Main app layout - uses min-h-screen (scrollable content)
 * For full viewport height pages (no scroll), add h-screen to that route's layout
 * Example: app/(dApp)/create/layout.tsx uses h-screen
 */
const Layout = async ({ children }: { children: React.ReactNode }) => {
  const trendingTokens = await getTrendingTokensData()
  return (
    <AppProviders>
      <LayoutShell trendingTokens={trendingTokens}>{children}</LayoutShell>

      <MobileDrawer />
      {/* Mobile Search Popover */}
      <div className="md:hidden">
        <MobileSearchPopover />
      </div>
    </AppProviders>
  )
}

export default Layout
