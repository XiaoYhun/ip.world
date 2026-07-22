import { TabProps } from "@/components/ui/mobile-sort-by"

export const exploreTabOptions: TabProps[] = [
  { key: "trending_score_24h_desc", value: { sort: "trending_score_24h", order: "desc" }, label: "TRENDING" },
  { key: "featured_desc", value: { sort: "featured", order: "desc" }, label: "FEATURED" },
  {
    key: "created_at_desc",
    value: { sort: "created_at", order: "desc" },
    label: "NEWEST",
  },
  // {
  //   key: "created_at_asc",
  //   value: { sort: "created_at", order: "asc" },
  //   label: "OLDEST",
  // },
  {
    key: "market_cap_desc",
    value: { sort: "market_cap", order: "desc" },
    label: "MCAP",
  },
  // {
  //   key: "market_cap_asc",
  //   value: { sort: "market_cap", order: "asc" },
  //   label: "MCAP: LOW TO HIGH",
  // },
]
