import { bigint, jsonb, numeric, pgTable, timestamp, varchar } from "drizzle-orm/pg-core"
import { createSchemaFactory } from "drizzle-zod"
import { z } from "zod"

const { createInsertSchema } = createSchemaFactory({
  zodInstance: z,
})

export const topHolderSchema = z.object({
  fungible_id: z.string(),
  owner_address: z.string(),
  quantity: z.string(),
  quantity_string: z.string(),
  first_transferred_date: z.date().optional(),
  last_transferred_date: z.date().optional(),
  role: z.string().optional(),
  username: z.string().optional(),
  display_name: z.string().optional(),
  bio: z.string().optional(),
  avatar_url: z.string().optional(),
  // Position and PnL enrichment from backend
  holdings_tokens: z.string().optional(),
  holdings_usd: z.string().optional(),
  realized_pnl_usd: z.string().optional(),
  unrealized_pnl_usd: z.string().optional(),
  pnl_usd: z.string().optional(),
  holder_rewards_amount_usd: z.string().optional(),
  total_tokens_bought: z.string().optional(),
  total_tokens_sold: z.string().optional(),
  total_bought_usd: z.string().optional(),
  total_sold_usd: z.string().optional(),
  held_since: z.string().optional(),
  held_seconds: z.number().optional(),
})

export type TopHolder = z.infer<typeof topHolderSchema>

export const tokenMetricsTable = pgTable("token_metrics", {
  token_address: varchar("token_address", { length: 255 }).primaryKey(),
  pool_address: varchar("pool_address", { length: 255 }).notNull(),
  total_market_cap_usd: numeric("total_market_cap_usd"),
  total_market_cap_ip: numeric("total_market_cap_ip"),
  total_value_locked_usd: numeric("total_value_locked_usd"),
  total_value_locked_ip: numeric("total_value_locked_ip"),
  volume_usd: numeric("volume_usd"),
  volume_ip: numeric("volume_ip"),
  holder_count: bigint("holder_count", { mode: "number" }),
  tx_count: bigint("tx_count", { mode: "number" }),
  top_holders: jsonb("top_holders").$type<TopHolder[]>(),
  price_usd: numeric("price_usd"),
  price_ip: numeric("price_ip"),
  net_in_to_owner_vault: numeric("net_in_to_owner_vault"),
  net_out_from_owner_vault: numeric("net_out_from_owner_vault"),
  block_number: bigint("block_number", { mode: "number" }),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  price_24h_ago: numeric("price_24h_ago"),
  price_change_24h: numeric("price_change_24h"),
  market_cap_24h_ago: numeric("market_cap_24h_ago"),
  market_cap_change_24h: numeric("market_cap_change_24h"),
  graduation_progress: numeric("graduation_progress"),
  volume_24h_usd: numeric("volume_24h_usd"),
  volume_24h_ip: numeric("volume_24h_ip"),
  price_change_5m: numeric("price_change_5m"),
  price_change_1h: numeric("price_change_1h"),
  price_change_6h: numeric("price_change_6h"),
  reward_chest_usd: numeric("reward_chest_usd"),
})

export const selectTokenMetricsSchema = z.object({
  token_address: z.string(),
  pool_address: z.union([z.string(), z.undefined()]).optional().transform((val) => {
    return val || ""
  }),
  top_holders: z
    .union([z.array(topHolderSchema), z.string(), z.null(), z.undefined()])
    .optional()
    .transform((val) => {
      if (val == null) return []
      if (typeof val === "string") {
        try {
          const parsed = JSON.parse(val)
          const result = z.array(topHolderSchema).safeParse(parsed)
          return result.success ? result.data : []
        } catch {
          return []
        }
      }
      return val
    }),
  // Transform numeric types to string for all numeric fields, allow undefined
  total_market_cap_usd: z.union([z.string(), z.number(), z.bigint(), z.null(), z.undefined()]).optional().transform((val) => {
    if (typeof val === "bigint" || typeof val === "number") {
      return val.toString()
    }
    return val
  }),
  total_market_cap_ip: z.union([z.string(), z.number(), z.bigint(), z.null(), z.undefined()]).optional().transform((val) => {
    if (typeof val === "bigint" || typeof val === "number") {
      return val.toString()
    }
    return val
  }),
  total_value_locked_usd: z
    .union([z.string(), z.number(), z.bigint(), z.null(), z.undefined()])
    .optional()
    .transform((val) => {
      if (typeof val === "bigint" || typeof val === "number") {
        return val.toString()
      }
      return val
    }),
  total_value_locked_ip: z
    .union([z.string(), z.number(), z.bigint(), z.null(), z.undefined()])
    .optional()
    .transform((val) => {
      if (typeof val === "bigint" || typeof val === "number") {
        return val.toString()
      }
      return val
    }),
  volume_usd: z
    .union([z.string(), z.number(), z.bigint(), z.null(), z.undefined()])
    .optional()
    .transform((val) => {
      if (typeof val === "bigint" || typeof val === "number") {
        return val.toString()
      }
      return val
    }),
  volume_ip: z
    .union([z.string(), z.number(), z.bigint(), z.null(), z.undefined()])
    .optional()
    .transform((val) => {
      if (typeof val === "bigint" || typeof val === "number") {
        return val.toString()
      }
      return val
    }),
  price_usd: z.union([z.string(), z.number(), z.bigint(), z.null(), z.undefined()]).optional().transform((val) => {
    if (typeof val === "bigint" || typeof val === "number") {
      return val.toString()
    }
    return val
  }),
  price_ip: z.union([z.string(), z.number(), z.bigint(), z.null(), z.undefined()]).optional().transform((val) => {
    if (typeof val === "bigint" || typeof val === "number") {
      return val.toString()
    }
    return val
  }),
  net_in_to_owner_vault: z
    .union([z.string(), z.number(), z.bigint(), z.null(), z.undefined()])
    .optional()
    .transform((val) => {
      if (typeof val === "bigint" || typeof val === "number") {
        return val.toString()
      }
      return val
    }),
  net_out_from_owner_vault: z
    .union([z.string(), z.number(), z.bigint(), z.null(), z.undefined()])
    .optional()
    .transform((val) => {
      if (typeof val === "bigint" || typeof val === "number") {
        return val.toString()
      }
      return val
    }),
  // Transform bigint/string to number for count fields, allow undefined
  holder_count: z.union([z.number(), z.string(), z.bigint(), z.null(), z.undefined()]).optional().transform((val) => {
    if (val == null) return 0
    if (typeof val === "string") return parseInt(val, 10) || 0
    if (typeof val === "bigint") return Number(val)
    return val
  }),
  tx_count: z.union([z.number(), z.string(), z.bigint(), z.null(), z.undefined()]).optional().transform((val) => {
    if (val == null) return 0
    if (typeof val === "string") return parseInt(val, 10) || 0
    if (typeof val === "bigint") return Number(val)
    return val
  }),
  block_number: z
    .union([z.number(), z.string(), z.bigint(), z.null(), z.undefined()])
    .optional()
    .transform((val) => {
      if (val == null) return 0
      if (typeof val === "string") return parseInt(val, 10) || 0
      if (typeof val === "bigint") return Number(val)
      return val
    }),
  price_24h_ago: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .optional()
    .transform((val) => {
      if (val == null) return 0
      return typeof val === "string" ? parseFloat(val) || 0 : Number(val)
    }),
  price_change_24h: z.union([z.string(), z.number(), z.null(), z.undefined()]).optional().transform((val) => {
    if (val == null) return 0
    return typeof val === "string" ? parseFloat(val) || 0 : Number(val)
  }),
  market_cap_24h_ago: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .optional()
    .transform((val) => {
      if (val == null) return 0
      return typeof val === "string" ? parseFloat(val) || 0 : Number(val)
    }),
  market_cap_change_24h: z.union([z.string(), z.number(), z.null(), z.undefined()]).optional().transform((val) => {
    if (val == null) return 0
    return typeof val === "string" ? parseFloat(val) || 0 : Number(val)
  }),
  graduation_progress: z.union([z.string(), z.number(), z.null(), z.undefined()]).optional().transform((val) => {
    if (val == null) return 0
    return typeof val === "string" ? parseFloat(val) || 0 : Number(val)
  }),
  volume_24h_usd: z.union([z.string(), z.number(), z.bigint(), z.null(), z.undefined()]).optional().transform((val) => {
    if (typeof val === "bigint" || typeof val === "number") {
      return val.toString()
    }
    return val
  }),
  volume_24h_ip: z
    .union([z.string(), z.number(), z.bigint(), z.null(), z.undefined()])
    .optional()
    .transform((val) => {
      if (typeof val === "bigint" || typeof val === "number") {
        return val.toString()
      }
      return val
    }),
  price_change_5m: z.union([z.string(), z.number(), z.null(), z.undefined()]).optional().transform((val) => {
    if (val == null) return 0
    return typeof val === "string" ? parseFloat(val) || 0 : Number(val)
  }),
  price_change_1h: z.union([z.string(), z.number(), z.null(), z.undefined()]).optional().transform((val) => {
    if (val == null) return 0
    return typeof val === "string" ? parseFloat(val) || 0 : Number(val)
  }),
  price_change_6h: z.union([z.string(), z.number(), z.null(), z.undefined()]).optional().transform((val) => {
    if (val == null) return 0
    return typeof val === "string" ? parseFloat(val) || 0 : Number(val)
  }),
  vol_5m_usd: z.union([z.string(), z.number(), z.null(), z.undefined()]).optional().transform((val) => {
    if (val == null) return 0
    return typeof val === "string" ? parseFloat(val) || 0 : Number(val)
  }),
  vol_1h_usd: z.union([z.string(), z.number(), z.null(), z.undefined()]).optional().transform((val) => {
    if (val == null) return 0
    return typeof val === "string" ? parseFloat(val) || 0 : Number(val)
  }),
  vol_6h_usd: z.union([z.string(), z.number(), z.null(), z.undefined()]).optional().transform((val) => {
    if (val == null) return 0
    return typeof val === "string" ? parseFloat(val) || 0 : Number(val)
  }),
  trending_score_5m: z.union([z.string(), z.number(), z.null(), z.undefined()]).optional().transform((val) => {
    if (val == null) return 0
    return typeof val === "string" ? parseFloat(val) || 0 : Number(val)
  }),
  trending_score_1h: z.union([z.string(), z.number(), z.null(), z.undefined()]).optional().transform((val) => {
    if (val == null) return 0
    return typeof val === "string" ? parseFloat(val) || 0 : Number(val)
  }),
  trending_score_6h: z.union([z.string(), z.number(), z.null(), z.undefined()]).optional().transform((val) => {
    if (val == null) return 0
    return typeof val === "string" ? parseFloat(val) || 0 : Number(val)
  }),
  trending_score_24h: z.union([z.string(), z.number(), z.null(), z.undefined()]).optional().transform((val) => {
    if (val == null) return 0
    return typeof val === "string" ? parseFloat(val) || 0 : Number(val)
  }),
  reward_chest_usd: z.union([z.string(), z.number(), z.null(), z.undefined()]).optional().transform((val) => {
    if (val == null) return 0
    return typeof val === "string" ? parseFloat(val) || 0 : Number(val)
  }),
  // Transform string to Date for timestamps, allow undefined
  timestamp: z
    .union([z.date(), z.string(), z.undefined()])
    .optional()
    .transform((val) => {
      if (typeof val === "string") {
        return new Date(val)
      }
      if (typeof val === "undefined") {
        return new Date()
      }
      return val
    }),
  created_at: z
    .union([z.date(), z.string(), z.undefined()])
    .optional()
    .transform((val) => {
      if (typeof val === "string") {
        return new Date(val)
      }
      if (typeof val === "undefined") {
        return new Date()
      }
      return val
    }),
})

export const insertTokenMetricsSchema = createInsertSchema(tokenMetricsTable)
  .extend({
    top_holders: z
      .array(topHolderSchema)
      .nullable()
      .optional()
      .transform((val) => val ?? []),
    created_at: z.date().optional().default(new Date()),
  })
  .omit({
    created_at: true,
  })

export type TokenMetrics = z.infer<typeof selectTokenMetricsSchema>
export type InsertTokenMetrics = z.infer<typeof insertTokenMetricsSchema>

export type TokenMetricsPatched = TokenMetrics & {
  total_market_cap_usd_int: number
  volume_usd_int: number
  volume_24h_usd_int: number
  price_change_5m_pct: number
  price_change_1h_pct: number
  price_change_6h_pct: number
  trending_score_24h: number
  reward_chest_usd?: number
}

/** All columns — used on token detail page */
export const metricsColumns = [
  "token_address",
  "pool_address",
  "total_market_cap_usd",
  "total_market_cap_ip",
  "total_value_locked_usd",
  "total_value_locked_ip",
  "volume_usd",
  "volume_ip",
  "holder_count",
  "tx_count",
  "top_holders",
  "price_usd",
  "price_ip",
  "net_in_to_owner_vault",
  "net_out_from_owner_vault",
  "block_number",
  "timestamp",
  "created_at",
  "price_24h_ago",
  "price_change_24h",
  "market_cap_24h_ago",
  "market_cap_change_24h",
  "graduation_progress",
  "volume_24h_usd",
  "volume_24h_ip",
  "price_change_5m",
  "price_change_1h",
  "price_change_6h",
  "reward_chest_usd",
] as const

/** Lean columns for homepage — only what cards need. Drops top_holders (64% of payload). */
export const homepageColumns = [
  "token_address",
  "pool_address",
  "total_market_cap_usd",
  "total_market_cap_ip",
  "price_usd",
  "price_ip",
  "market_cap_change_24h",
  "graduation_progress",
  "volume_24h_usd",
  "holder_count",
  "tx_count",
  "price_change_5m",
  "price_change_1h",
  "price_change_6h",
  "price_change_24h",
  "vol_5m_usd",
  "vol_1h_usd",
  "vol_6h_usd",
  "trending_score_5m",
  "trending_score_1h",
  "trending_score_6h",
  "trending_score_24h",
  "reward_chest_usd",
] as const

export type TokenMetricsColumn = (typeof metricsColumns)[number]
