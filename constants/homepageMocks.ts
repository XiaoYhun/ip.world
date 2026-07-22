import { MOCK_IP, MOCK_TOKEN } from "@/constants/mockData"
import type { Explore } from "@/types/ip"
import type { Remix } from "@/types/remix"

/**
 * Demo fixtures for the public showcase deployment.
 *
 * The homepage shelves are populated server-side from NEXT_PUBLIC_API_BASE_URL.
 * When that backend is unreachable, every fetch in app/(dApp)/page.tsx falls
 * back to an empty array and the page renders as a bare "No tokens" shell.
 * These fixtures give the public deployment something representative to show.
 *
 * Every figure below is fabricated. Nothing here reflects real market data,
 * real tokens, or real holders.
 */

const img = (seed: string) => `https://picsum.photos/seed/${seed}/400/400`

const addressFor = (group: string, index: number) =>
  `0x${(group.length * 7919 + index * 104729).toString(16).padStart(40, "0").slice(0, 40)}`

/**
 * Deterministic 7-day price series driving the sparklines. Values are derived
 * from a fixed seed and a fixed base date so server and client renders agree —
 * Math.random()/Date.now() here would cause hydration mismatches.
 */
const PRICE_SERIES_POINTS = 28
const PRICE_SERIES_BASE_MS = Date.UTC(2026, 6, 22)

/**
 * Spread creation dates so cards don't all render the same "358d ago" age.
 * Fixed base date, same reason as the price series.
 */
const createdAtFor = (group: string, index: number) => {
  const daysAgo = 2 + ((group.length * 5 + index * 11) % 84)
  return new Date(PRICE_SERIES_BASE_MS - daysAgo * 86_400_000).toISOString()
}

const makePrice7d = (endPrice: number, changePct: number, seed: number) => {
  const startPrice = endPrice / (1 + changePct / 100 || 1)
  let state = seed * 9301 + 49297
  const rand = () => {
    state = (state * 9301 + 49297) % 233280
    return state / 233280
  }
  return Array.from({ length: PRICE_SERIES_POINTS }, (_, i) => {
    const t = i / (PRICE_SERIES_POINTS - 1)
    const trend = startPrice + (endPrice - startPrice) * t
    const noise = (rand() - 0.5) * endPrice * 0.08
    const value = Math.max(endPrice * 0.01, trend + noise)
    return {
      close_price_usd: value.toPrecision(8),
      timestamp: new Date(PRICE_SERIES_BASE_MS - (PRICE_SERIES_POINTS - 1 - i) * 6 * 3_600_000).toISOString(),
    }
  })
}

type TokenSeed = {
  name: string
  symbol: string
  marketCap: number
  holders: number
  priceUsd: number
  marketCapChange: number
  dailyVolume: number
  dailyVolumeChange: number
  comments: number
  graduationProgress: number
}

const makeToken = (seed: TokenSeed, index: number, group: string): Remix => ({
  ...MOCK_TOKEN,
  id: `${group}-${index}`,
  name: seed.name,
  symbol: seed.symbol,
  token_address: addressFor(group, index),
  image: img(`${group}-${seed.symbol}`),
  description: `${seed.name} is a demo entry used to populate this showcase deployment. It is not a real token.`,
  market_cap: seed.marketCap,
  market_cap_change: seed.marketCapChange,
  number_of_holders: seed.holders,
  price_usd: seed.priceUsd,
  price_usd_change: seed.marketCapChange,
  daily_volume: seed.dailyVolume,
  daily_volume_change: seed.dailyVolumeChange,
  total_volume_usd: seed.dailyVolume * 128,
  pool_size: Math.round(seed.marketCap * 0.06),
  number_of_comments: seed.comments,
  daily_tx_count: Math.max(12, Math.round(seed.dailyVolume / 90)),
  is_graduated: seed.graduationProgress >= 100,
  graduation_progress: seed.graduationProgress,
  is_featured: index < 3,
  is_verified: index % 3 === 0,
  price_7d: makePrice7d(seed.priceUsd, seed.marketCapChange, group.length + index + seed.symbol.length),
  created_at: createdAtFor(group, index),
  token_created_at: createdAtFor(group, index),
  ip: {
    ...MOCK_TOKEN.ip,
    id: `${group}-ip-${index}`,
    title: seed.name,
    image: img(`${group}-ip-${seed.symbol}`),
    market_cap: seed.marketCap,
    remixes: [],
  },
})

const TRENDING_SEEDS: TokenSeed[] = [
  { name: "Pixel Otter", symbol: "OTTR", marketCap: 4210000, holders: 18420, priceUsd: 0.00421, marketCapChange: 18.4, dailyVolume: 412000, dailyVolumeChange: 22.6, comments: 342, graduationProgress: 100 },
  { name: "Midnight Tapes", symbol: "TAPE", marketCap: 2870000, holders: 12310, priceUsd: 0.00287, marketCapChange: 9.2, dailyVolume: 298000, dailyVolumeChange: 11.4, comments: 210, graduationProgress: 100 },
  { name: "Neon Koi", symbol: "KOI", marketCap: 1940000, holders: 9870, priceUsd: 0.00194, marketCapChange: -4.7, dailyVolume: 187000, dailyVolumeChange: -8.1, comments: 168, graduationProgress: 100 },
  { name: "Cloud Sheep", symbol: "SHEEP", marketCap: 1420000, holders: 7640, priceUsd: 0.00142, marketCapChange: 31.8, dailyVolume: 224000, dailyVolumeChange: 44.2, comments: 291, graduationProgress: 100 },
  { name: "Retro Arcade", symbol: "ARCD", marketCap: 986000, holders: 5210, priceUsd: 0.000986, marketCapChange: 6.5, dailyVolume: 96000, dailyVolumeChange: 3.9, comments: 124, graduationProgress: 100 },
  { name: "Paper Crane", symbol: "CRANE", marketCap: 742000, holders: 4180, priceUsd: 0.000742, marketCapChange: -2.3, dailyVolume: 71000, dailyVolumeChange: -6.4, comments: 88, graduationProgress: 100 },
  { name: "Glitch Cat", symbol: "GLCH", marketCap: 615000, holders: 3620, priceUsd: 0.000615, marketCapChange: 14.1, dailyVolume: 83000, dailyVolumeChange: 19.7, comments: 143, graduationProgress: 100 },
  { name: "Sunset Vinyl", symbol: "VNYL", marketCap: 498000, holders: 2940, priceUsd: 0.000498, marketCapChange: 2.8, dailyVolume: 54000, dailyVolumeChange: 1.2, comments: 76, graduationProgress: 100 },
]

const ABOUT_TO_GRADUATE_SEEDS: TokenSeed[] = [
  { name: "Tiny Dino", symbol: "DINO", marketCap: 61200, holders: 812, priceUsd: 0.0000612, marketCapChange: 47.3, dailyVolume: 28400, dailyVolumeChange: 62.1, comments: 96, graduationProgress: 94 },
  { name: "Lo-Fi Fox", symbol: "LOFI", marketCap: 54800, holders: 703, priceUsd: 0.0000548, marketCapChange: 38.6, dailyVolume: 22100, dailyVolumeChange: 41.8, comments: 74, graduationProgress: 88 },
  { name: "Bubble Whale", symbol: "BUBL", marketCap: 47300, holders: 618, priceUsd: 0.0000473, marketCapChange: 26.9, dailyVolume: 18700, dailyVolumeChange: 29.4, comments: 61, graduationProgress: 81 },
  { name: "Copper Bee", symbol: "BEE", marketCap: 39900, holders: 524, priceUsd: 0.0000399, marketCapChange: 19.4, dailyVolume: 14200, dailyVolumeChange: 17.6, comments: 48, graduationProgress: 73 },
]

const TIKTOK_SEEDS: TokenSeed[] = [
  { name: "Dance Ghost", symbol: "GHST", marketCap: 3120000, holders: 22800, priceUsd: 0.00312, marketCapChange: 52.7, dailyVolume: 684000, dailyVolumeChange: 78.3, comments: 1842, graduationProgress: 100 },
  { name: "Chef Raccoon", symbol: "CHEF", marketCap: 2240000, holders: 16400, priceUsd: 0.00224, marketCapChange: 34.1, dailyVolume: 471000, dailyVolumeChange: 46.9, comments: 1203, graduationProgress: 100 },
  { name: "Sleepy Capybara", symbol: "CAPY", marketCap: 1780000, holders: 13900, priceUsd: 0.00178, marketCapChange: 21.6, dailyVolume: 362000, dailyVolumeChange: 25.8, comments: 964, graduationProgress: 100 },
  { name: "Skate Pigeon", symbol: "PGN", marketCap: 1130000, holders: 9200, priceUsd: 0.00113, marketCapChange: 12.9, dailyVolume: 218000, dailyVolumeChange: 14.2, comments: 587, graduationProgress: 100 },
  { name: "Karaoke Frog", symbol: "FROG", marketCap: 864000, holders: 7100, priceUsd: 0.000864, marketCapChange: -6.2, dailyVolume: 143000, dailyVolumeChange: -11.5, comments: 412, graduationProgress: 100 },
  { name: "Gym Hamster", symbol: "HMSTR", marketCap: 692000, holders: 5800, priceUsd: 0.000692, marketCapChange: 8.4, dailyVolume: 119000, dailyVolumeChange: 9.8, comments: 336, graduationProgress: 100 },
]

const REMIX_SEEDS: TokenSeed[] = [
  { name: "Velvet Moth", symbol: "MOTH", marketCap: 318000, holders: 2410, priceUsd: 0.000318, marketCapChange: 7.9, dailyVolume: 42000, dailyVolumeChange: 10.3, comments: 64, graduationProgress: 100 },
  { name: "Iron Tulip", symbol: "TLIP", marketCap: 276000, holders: 2180, priceUsd: 0.000276, marketCapChange: -3.4, dailyVolume: 36000, dailyVolumeChange: -5.7, comments: 52, graduationProgress: 100 },
  { name: "Static Owl", symbol: "OWL", marketCap: 241000, holders: 1930, priceUsd: 0.000241, marketCapChange: 15.2, dailyVolume: 39000, dailyVolumeChange: 18.9, comments: 71, graduationProgress: 100 },
  { name: "Marble Yeti", symbol: "YETI", marketCap: 198000, holders: 1640, priceUsd: 0.000198, marketCapChange: 4.6, dailyVolume: 27000, dailyVolumeChange: 6.1, comments: 43, graduationProgress: 100 },
  { name: "Amber Squid", symbol: "SQUID", marketCap: 164000, holders: 1420, priceUsd: 0.000164, marketCapChange: -8.8, dailyVolume: 21000, dailyVolumeChange: -12.4, comments: 38, graduationProgress: 100 },
  { name: "Rusty Comet", symbol: "CMET", marketCap: 139000, holders: 1210, priceUsd: 0.000139, marketCapChange: 23.7, dailyVolume: 31000, dailyVolumeChange: 27.5, comments: 59, graduationProgress: 100 },
  { name: "Quiet Lantern", symbol: "LNTN", marketCap: 112000, holders: 1040, priceUsd: 0.000112, marketCapChange: 1.9, dailyVolume: 17000, dailyVolumeChange: 2.4, comments: 29, graduationProgress: 100 },
  { name: "Feral Mango", symbol: "MNGO", marketCap: 94000, holders: 880, priceUsd: 0.000094, marketCapChange: 11.3, dailyVolume: 19000, dailyVolumeChange: 13.7, comments: 34, graduationProgress: 100 },
  { name: "Hollow Drum", symbol: "DRUM", marketCap: 78000, holders: 742, priceUsd: 0.000078, marketCapChange: -1.6, dailyVolume: 12000, dailyVolumeChange: -2.9, comments: 22, graduationProgress: 100 },
  { name: "Coral Bandit", symbol: "CRL", marketCap: 63000, holders: 618, priceUsd: 0.000063, marketCapChange: 6.8, dailyVolume: 10000, dailyVolumeChange: 8.2, comments: 18, graduationProgress: 96 },
  { name: "Onyx Sparrow", symbol: "SPRW", marketCap: 51000, holders: 504, priceUsd: 0.000051, marketCapChange: 17.4, dailyVolume: 14000, dailyVolumeChange: 21.1, comments: 26, graduationProgress: 89 },
  { name: "Salt Compass", symbol: "CMPS", marketCap: 42000, holders: 431, priceUsd: 0.000042, marketCapChange: -5.1, dailyVolume: 8000, dailyVolumeChange: -7.3, comments: 15, graduationProgress: 84 },
]

export const MOCK_TRENDING_TOKENS: Remix[] = TRENDING_SEEDS.map((s, i) => makeToken(s, i, "trending"))
export const MOCK_ABOUT_TO_GRADUATE_TOKENS: Remix[] = ABOUT_TO_GRADUATE_SEEDS.map((s, i) => makeToken(s, i, "graduating"))
export const MOCK_TIKTOK_TOKENS: Remix[] = TIKTOK_SEEDS.map((s, i) => makeToken(s, i, "tiktok"))
export const MOCK_HOMEPAGE_REMIXES: Remix[] = REMIX_SEEDS.map((s, i) => makeToken(s, i, "remix"))

/**
 * Everything above, combined, for the /coins grid. Group prefixes keep ids and
 * token addresses unique across the concatenation.
 */
export const MOCK_COINS: Remix[] = [
  ...MOCK_TRENDING_TOKENS,
  ...MOCK_TIKTOK_TOKENS,
  ...MOCK_HOMEPAGE_REMIXES,
  ...MOCK_ABOUT_TO_GRADUATE_TOKENS,
]

const VIRAL_IP_SEEDS = [
  { title: "Pixel Otter", category: "pet", viralScore: 96.2, remixes: 1284, marketCap: 4210000 },
  { title: "Dance Ghost", category: "character", viralScore: 91.7, remixes: 968, marketCap: 3120000 },
  { title: "Chef Raccoon", category: "character", viralScore: 88.3, remixes: 742, marketCap: 2240000 },
  { title: "Midnight Tapes", category: "music", viralScore: 84.9, remixes: 613, marketCap: 2870000 },
  { title: "Sleepy Capybara", category: "pet", viralScore: 81.4, remixes: 559, marketCap: 1780000 },
  { title: "Neon Koi", category: "art", viralScore: 77.8, remixes: 431, marketCap: 1940000 },
]

export const MOCK_EXPLORE: Explore = {
  total_remixes: 48213,
  total_user_rewards: 12847392.65,
  viral_ips: {
    total: VIRAL_IP_SEEDS.length,
    limit: VIRAL_IP_SEEDS.length,
    offset: 0,
    results: VIRAL_IP_SEEDS.map((s, i) => ({
      ...MOCK_IP,
      id: `viral-ip-${i}`,
      title: s.title,
      alias: s.title.toLowerCase().replace(/\s+/g, "-"),
      image: img(`viral-${s.title}`),
      category: s.category,
      viral_score: s.viralScore,
      viral_rank: i + 1,
      remixes_count: s.remixes,
      market_cap: s.marketCap,
    })),
  },
  top_takes: [],
}
