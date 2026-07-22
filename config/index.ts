import { createEnv } from "@t3-oss/env-nextjs"
import { Address } from "viem"
import { z } from "zod"

const envs = ["development", "production"] as const
const envSchema = z.enum(envs).default("development")
export type Env = z.infer<typeof envSchema>

const addressSchema = z
  .string()
  .startsWith("0x")
  .regex(/^0x[a-fA-F0-9]{40}$/)
  .transform((val) => val as Address)

export const env = createEnv({
  /*
   * Serverside Environment variables, not available on the client.
   * Will throw if you access these variables on the client.
   */
  server: {
    REPLICATE_API_TOKEN: z.string().default(""),
  },

  /*
   * Environment variables available on the client (and server).
   */
  client: {
    NEXT_PUBLIC_VERCEL_URL: z.string().optional(),
    NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID: z.string(),
    NEXT_PUBLIC_CHAIN_NAME: z.string(),
    NEXT_PUBLIC_V3_FEE: z.coerce.number().default(3000),
    NEXT_PUBLIC_CHAIN_ID: z.coerce.number(),
    NEXT_PUBLIC_TWITTER_URL: z.string().url().default(""),
    NEXT_PUBLIC_TELEGRAM_URL: z.string().url().default(""),
    NEXT_PUBLIC_API_BASE_URL: z.string().url(),
    NEXT_PUBLIC_JSON_RPC_URL: z.string().url(),
    NEXT_PUBLIC_EXPLORER_URL: z.string().url(),
    NEXT_PUBLIC_STORYHUNT_V3_FACTORY: addressSchema,
    NEXT_PUBLIC_STORYHUNT_SWAP_ROUTER: addressSchema,
    NEXT_PUBLIC_IP_WORLD_ADDRESS: addressSchema,
    NEXT_PUBLIC_OPERATOR_ADDRESS: addressSchema,
    NEXT_PUBLIC_WRAPPED_IP_TOKEN_ADDRESS: addressSchema,
    NEXT_PUBLIC_QUOTER_ADDRESS: addressSchema,
    NEXT_PUBLIC_ENVIRONMENT: envSchema,
    NEXT_PUBLIC_METRICS_SYNC_CLOUDFLARE_URL: z.string().url(),
    NEXT_PUBLIC_HALLIDAY_PUBLIC_API_KEY: z.string().default(""),
    NEXT_PUBLIC_RELAY_API_KEY: z.string().optional(),
    NEXT_PUBLIC_USDC_ADDRESS: addressSchema.optional(),
    NEXT_PUBLIC_SOLANA_RPC_URL: z.string().url().optional(),
    NEXT_PUBLIC_JSON_RPC_URL_FALLBACK: z.string().url().optional(),
  },

  /*
   * Due to how Next.js bundles environment variables on Edge and Client,
   * these need to all be explicitly reference from process.env to be included in the bundles
   */
  runtimeEnv: {
    NEXT_PUBLIC_ENVIRONMENT: process.env.ENVIRONMENT,
    REPLICATE_API_TOKEN: process.env.REPLICATE_API_TOKEN,
    NEXT_PUBLIC_TWITTER_URL: process.env.NEXT_PUBLIC_TWITTER_URL,
    NEXT_PUBLIC_TELEGRAM_URL: process.env.NEXT_PUBLIC_TELEGRAM_URL,
    NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_V3_FEE: process.env.NEXT_PUBLIC_V3_FEE,
    NEXT_PUBLIC_CHAIN_NAME: process.env.NEXT_PUBLIC_CHAIN_NAME,
    NEXT_PUBLIC_JSON_RPC_URL: process.env.NEXT_PUBLIC_JSON_RPC_URL,
    NEXT_PUBLIC_EXPLORER_URL: process.env.NEXT_PUBLIC_EXPLORER_URL,
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
    NEXT_PUBLIC_IP_WORLD_ADDRESS: process.env.NEXT_PUBLIC_IP_WORLD_ADDRESS,
    NEXT_PUBLIC_OPERATOR_ADDRESS: process.env.NEXT_PUBLIC_OPERATOR_ADDRESS,
    NEXT_PUBLIC_WRAPPED_IP_TOKEN_ADDRESS: process.env.NEXT_PUBLIC_WRAPPED_IP_TOKEN_ADDRESS,
    NEXT_PUBLIC_QUOTER_ADDRESS: process.env.NEXT_PUBLIC_QUOTER_ADDRESS,
    NEXT_PUBLIC_STORYHUNT_V3_FACTORY: process.env.NEXT_PUBLIC_STORYHUNT_V3_FACTORY,
    NEXT_PUBLIC_STORYHUNT_SWAP_ROUTER: process.env.NEXT_PUBLIC_STORYHUNT_SWAP_ROUTER,
    NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL,
    NEXT_PUBLIC_METRICS_SYNC_CLOUDFLARE_URL: process.env.NEXT_PUBLIC_METRICS_SYNC_CLOUDFLARE_URL,
    NEXT_PUBLIC_HALLIDAY_PUBLIC_API_KEY: process.env.NEXT_PUBLIC_HALLIDAY_PUBLIC_API_KEY,
    NEXT_PUBLIC_RELAY_API_KEY: process.env.NEXT_PUBLIC_RELAY_API_KEY,
    NEXT_PUBLIC_USDC_ADDRESS: process.env.NEXT_PUBLIC_USDC_ADDRESS,
    NEXT_PUBLIC_SOLANA_RPC_URL: process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
    NEXT_PUBLIC_JSON_RPC_URL_FALLBACK: process.env.NEXT_PUBLIC_JSON_RPC_URL_FALLBACK,
  },

  emptyStringAsUndefined: true,
})

export const MULTICALL3_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11" as Address
