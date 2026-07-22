import {
  CategoryArt,
  CategoryBrand,
  CategoryCharacter,
  CategoryGame,
  CategoryMeme,
  CategoryMisc,
  CategoryMovement,
  CategoryPerson,
  CategoryPet,
  CategoryTechnology,
  CategoryTrend,
} from "@/components/icons"
import normieImage from "@/public/images/normie.png"
import casualImage from "@/public/images/casual.png"
import trencherImage from "@/public/images/trencher.png"
import legendImage from "@/public/images/legend.png"
import badgeNormie from "@/public/images/badge-normie.png"
import badgeCasual from "@/public/images/badge-casual.png"
import badgeDegen from "@/public/images/badge-degen.png"
import badgeTrencher from "@/public/images/badge-trencher.png"
import badgeLegend from "@/public/images/badge-legend.png"

export const PAGINATION_LIMIT = 12

export const NUMBER_OF_HOLDERS_DEADLINE = 1000
export const DURATION_DEADLINE = 1000 * 60 * 60 * 24 * 10 // 10 days
export const MARKETCAP_DEADLINE = 750000

export const VOTES_THRESHOLD = 100

export const TOTAL_SUPPLY = 1000000000

export const FEED_LIMIT = 6
export const FEED_REFETCH_INTERVAL = 60000

export const TAKE_LIMIT = 10
export const TAKE_REFETCH_INTERVAL = 60000

export const REMIX_LIMIT = 10
export const REMIX_REFETCH_INTERVAL = 60000

export const USERNAME_MIN_LENGTH = 3
export const USERNAME_MAX_LENGTH = 30

export const BIO_MAX_LENGTH = 180

export const MOBILE_BREAKPOINT = 768

export const X_USERNAME_REGEX = /^https?:\/\/(www\.)?(x\.com|twitter\.com)\/([A-Za-z0-9_.]{1,32})\/?$/
export const TIKTOK_USERNAME_REGEX = /^https?:\/\/(www\.)?tiktok\.com\/@([A-Za-z0-9_.]{1,32})\/?$/
export const TELEGRAM_USERNAME_REGEX = /^https?:\/\/(www\.)?tiktok\.com\/@([A-Za-z0-9_.]{1,32})\/?$/
export const YOUTUBE_USERNAME_REGEX = /^https?:\/\/(www\.)?tiktok\.com\/@([A-Za-z0-9_.]{1,32})\/?$/
export const INSTAGRAM_USERNAME_REGEX = /^https?:\/\/(www\.)?tiktok\.com\/@([A-Za-z0-9_.]{1,32})\/?$/
export const URL_REGEX = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/\S*)?$/

export const CATEGORIES = [
  {
    key: "pet",
    label: "Pet",
    icon: CategoryPet,
    description: "A real or fictional pet that has gained widespread online recognition",
    examples: "Eg. Moodeng, Pnut, Punch",
    images: ["/images/categories/pet/1.jpg", "/images/categories/pet/2.jpg", "/images/categories/pet/3.jpg"],
  },
  {
    key: "person",
    label: "Person",
    icon: CategoryPerson,
    description: "A real or fictional person that has become well-known on the internet",
    examples: "Eg. Trump, ASU Frat Leader, Jackie Chan",
    images: ["/images/categories/person/1.jpg", "/images/categories/person/2.jpg", "/images/categories/person/3.jpg"]
  },
  {
    key: "trend",
    label: "Trend",
    icon: CategoryTrend,
    description: "A popular topic or cultural phenomena that has gained widespread attention",
    examples: "Eg. 67, Jet2 Holiday, Agartha",
    images: ["/images/categories/trend/1.jpg", "/images/categories/trend/2.jpg", "/images/categories/trend/3.jpg"]
  },
  {
    key: "game",
    label: "Game",
    icon: CategoryGame,
    description: "A widely played or viewed online, mobile, or console game",
    examples: "Eg. Among Us, GTA V, Fortnite",
    images: ["/images/categories/game/1.jpg", "/images/categories/game/2.jpg", "/images/categories/game/3.jpg"]
  },
  {
    key: "technology",
    label: "Technology",
    icon: CategoryTechnology,
    description: "A popular digital or physical product, AI system, or tool that is widely used",
    examples: "Eg. OpenClaw, Rizzbot, Hatsune Miku",
    images: ["/images/categories/technology/1.jpg", "/images/categories/technology/2.jpg", "/images/categories/technology/3.jpg"]
  },
  {
    key: "meme",
    label: "Meme",
    icon: CategoryMeme,
    description: "An image, video, or other type of media with viral recognition",
    examples: "Eg. Triple T, Wojak, Doge",
    images: ["/images/categories/meme/1.jpg", "/images/categories/meme/2.jpg", "/images/categories/meme/3.jpg"]
  },
  {
    key: "movement",
    label: "Movement",
    icon: CategoryMovement,
    description: "A shared idea or cause that people collectively support",
    examples: "Eg. America, World Peace, Looksmaxxing",
    images: ["/images/categories/movement/1.jpg", "/images/categories/movement/2.jpg", "/images/categories/movement/3.jpg"]
  },
  {
    key: "brand",
    label: "Brand",
    icon: CategoryBrand,
    description: "A company or organization with a recognizable public identity",
    examples: "Eg. Supreme, Punks, Story",
    images: ["/images/categories/brand/1.jpg", "/images/categories/brand/2.jpg", "/images/categories/brand/3.jpg"]
  },
  {
    key: "character",
    label: "Character",
    icon: CategoryCharacter,
    description: "A fictional or stylized persona with an established public identity",
    examples: "Eg. Chiikawa, Labubu, Hello Kitty",
    images: ["/images/categories/character/1.jpg", "/images/categories/character/2.jpg", "/images/categories/character/3.jpg"]
  },
  {
    key: "art",
    label: "Art",
    icon: CategoryArt,
    description: "A well-established creative or artistic work that is widely known",
    examples: "Eg. Rubber Duck, Comedian, Mona Lisa",
    images: ["/images/categories/art/1.jpg", "/images/categories/art/2.jpg", "/images/categories/art/3.jpg"]
  },
  {
    key: "misc",
    label: "Misc",
    icon: CategoryMisc,
    description: "A recognizable intellectual property not fitting one of the above categories",
    examples: "Eg. The Backrooms, Ohio, The Singularity",
    images: ["/images/categories/misc/1.jpg", "/images/categories/misc/2.jpg", "/images/categories/misc/3.jpg"]
  },
]

export const LICENSE_URL = "https://github.com/ipdotworld/protocol/blob/main/ip-token-license-v1.0.pdf"

// IP Claim Constants
export const SIGNATURE_LENGTH = 132
export const SIGNATURE_V_LENGTH = 2
export const SIGNATURE_R_LENGTH = 66
export const SIGNATURE_S_LENGTH = 66

// Contract Function Selectors
export const ATTACH_LICENSE_TERMS_SELECTOR = "0x2a4130c0"
export const SET_LICENSING_CONFIG_SELECTOR = "0xb33f673e"
export const ATTACH_LICENSE_TERMS_FUNC = "attachLicenseTerms(address,address,uint256)"

export const HIDDEN_TRENDING_IPS = [
  "52d08cb0-f59f-42d8-b318-47015fa8ca22",
  "62eeb236-b3eb-40a0-b338-7443031e693a",
  "83dc1ca0-a30f-4569-aace-42c7fb4c9004",
  "0b842f07-2c59-435c-9c34-ccb5f2d49584", // Pinkfong
]
export const HIDDEN_TRENDING_REMIXES = [
  "d4c72471-675d-4386-9504-4397451c5861", // Pinkfong
  "49a3ab26-2e9b-4dbe-9de0-26a2aeab0bbb", // Pinkfong
]

// User Tier Configuration
export const TIER_CONFIG = {
  Normie: {
    name: "Normie",
    icon: normieImage,
    badge: badgeNormie,
    alt: "normie",
  },
  "Weird Face": {
    name: "Weird Face",
    icon: casualImage,
    badge: badgeCasual,
    alt: "casual",
  },
  Degen: {
    name: "Degen",
    icon: casualImage,
    badge: badgeDegen,
    alt: "degen",
  },
  Trencher: {
    name: "Trencher",
    icon: trencherImage,
    badge: badgeTrencher,
    alt: "trencher",
  },
  Legend: {
    name: "Legend",
    icon: legendImage,
    badge: badgeLegend,
    alt: "legend",
  },
} as const
