/**
 * Token detail page: offset for elements that stick under the main navbar + TokenDataTabBar.
 * 3.5rem = top-14 (navbar). Tab strip height is `--token-sticky-tab-bar-height` (measured in TokenDataTabBar).
 */
export const TOKEN_STICKY_BELOW_MAIN_TABS = "top-[calc(3.5rem+var(--token-sticky-tab-bar-height))]" as const

/** Em-dash / missing-value glyphs: matches main dark panel bg (#121212) so empty states don’t read as bright content */
export const TOKEN_TABLE_NULL_PLACEHOLDER_CLASS = "text-[#121212] select-none" as const

/** Right-hand rail (How it works / trade sidebar below tabs) — adds ~12px below tab strip so content isn’t clipped by the bar border */
export const TOKEN_STICKY_RIGHT_RAIL_BELOW_TABS =
  "top-[calc(3.5rem+var(--token-sticky-tab-bar-height)+0.75rem)]" as const

/** Sticky under navbar only (`top-14` / 56px) — chart + trade row (tab bar is below in DOM, not above trade) */
export const TOKEN_STICKY_BELOW_NAV_ONLY = "top-14" as const

/** Navbar + 16px gap — desktop trade column beside chart */
export const TOKEN_STICKY_TRADE_CHART_ROW = "top-[calc(3.5rem+1rem)]" as const

/** Sticky offset: mobile (nav-only), md+ (nav + TokenData tab bar) */
export const TOKEN_STICKY_SUBNAV_TOP_RESPONSIVE =
  "top-14 md:top-[calc(3.5rem+var(--token-sticky-tab-bar-height))]" as const

/** Full-bleed sub-bar (edge stroke + bg like main nav); pair with TOKEN_SUBNAV_INNER */
export const TOKEN_SUBNAV_BAR =
  "w-screen max-w-[100vw] shrink-0 ml-[calc(50%-50vw)] border-b border-neutral-500 bg-[#111111]/90 backdrop-blur-md transition-all duration-500" as const

/** Full-width inner aligned with flushed token page (no max-width shell) */
export const TOKEN_SUBNAV_INNER = "w-full px-0" as const

/** Bar surface — extend with TOKEN_SUBNAV_BREAKOUT_* so backgrounds hit column edges while controls stay in gutters */
export const TOKEN_SUBNAV_BAR_SURFACE =
  "shrink-0 border-b border-neutral-500 bg-[#111111]/90 backdrop-blur-md transition-all duration-500" as const

/** Same surface as TOKEN_SUBNAV_BAR_SURFACE but no rule under the bar (holders / transactions table headers) */
export const TOKEN_SUBNAV_BAR_SURFACE_TABLE =
  "shrink-0 border-b-0 bg-[#111111]/90 backdrop-blur-md transition-all duration-500" as const

/** Feeds row: flushed to token page edges */
export const TOKEN_SUBNAV_BREAKOUT_FEEDS = "w-full" as const

export const TOKEN_SUBNAV_INNER_FEEDS = "px-0 py-1.5" as const

/** Holders: flushed width */
export const TOKEN_SUBNAV_BREAKOUT_HOLDERS = "w-full" as const

/** Fixed height (px) for right-rail carousel slides (UGC Rewards / Top Earners / Trend). */
export const TOKEN_RAIL_CARD_HEIGHT_PX = 503

/** Right-rail carousel cards (UGC Rewards, Top Earners, Trend) — fixed height so slides don’t jump */
export const TOKEN_RAIL_CARD_SURFACE =
  "font-sf-pro-rounded flex h-[503px] min-h-0 w-full flex-col gap-6 rounded-[16px] border-[0.5px] border-[#242424] bg-[#121212] p-3 shadow-[0_4px_11.7px_rgba(0,0,0,0.25)]" as const

/** Non-scrolling body below the card header (pair with TOKEN_RAIL_CARD_SURFACE) */
export const TOKEN_RAIL_CARD_SCROLL_BODY =
  "flex min-h-0 flex-1 flex-col overflow-hidden" as const

/** Comments: flushed */
export const TOKEN_SUBNAV_BREAKOUT_COMMENTS = "w-full" as const

export const TOKEN_SUBNAV_INNER_COMMENTS = "px-0 pt-2 pb-0.5 md:pt-2.5" as const

/** SwapTable: full width on mobile subnav */
export const TOKEN_SUBNAV_BREAKOUT_SWAP_MOBILE = "w-full" as const

export const TOKEN_SUBNAV_INNER_SWAP_MOBILE = "px-0 py-1.5" as const
