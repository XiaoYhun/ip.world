import { z } from "zod"

export const eventTypeSchema = z.enum([
  "trade",
  "create_ip",
  "create_token",
  "claim",
  "link",
  "like",
  "favorite",
  "report",
  "comment",
  "take",
])

export const eventSubtypeSchema = z.enum([
  "buy",
  "sell",
  "swap",
  "approve",
  "reject",
  "add",
  "remove",
  "create",
  "update",
  "delete",
])

export const ipMetadataSchema = z.object({
  ip_id: z.string(),
  ip_type: z.string(),
  ip_image: z.string(),
  ip_owner: z.string(),
  ip_title: z.string(),
  ip_handle: z.string(),
  ip_status: z.string(),
  ip_creator: z.string(),
  ip_category: z.string(),
  ip_description: z.string(),
  ip_is_licensed: z.boolean(),
  ip_is_verified: z.boolean(),
})

export const remixMetadataSchema = z.object({
  remix_id: z.string(),
  remix_name: z.string(),
  remix_chain: z.string(),
  remix_image: z.string(),
  remix_symbol: z.string(),
  remix_creator: z.string(),
  remix_price_usd: z.number(),
  remix_market_cap: z.number(),
  remix_description: z.string(),
  remix_is_endorsed: z.boolean(),
  remix_is_featured: z.boolean(),
  remix_is_verified: z.boolean(),
  remix_daily_volume: z.number(),
  remix_token_address: z.string(),
  remix_ip_link_status: z.string(),
  remix_number_of_holders: z.number(),
})

export const userEventMetadataSchema = z.object({
  ip_metadata: ipMetadataSchema.optional(),
  remix_metadata: remixMetadataSchema.optional(),
  event_description: z.string(),
  // Additional metadata fields that can be present
  entity_type: z.string().optional(),
  entity_id: z.string().optional(),
  is_like: z.boolean().optional(),
  is_favorite: z.boolean().optional(),
  report_type: z.string().optional(),
})

export const userEventSchema = z.object({
  id: z.string(),
  user_wallet_address: z.string(),
  event_type: eventTypeSchema,
  event_subtype: eventSubtypeSchema.nullable(),
  amount_usd: z.number().nullable(),
  token_address: z.string().nullable(),
  ip_id: z.string().nullable(),
  remix_id: z.string().nullable(),
  transaction_hash: z.string().nullable(),
  metadata: userEventMetadataSchema,
  created_at: z.string(),
  updated_at: z.string(),
})

export const selectUserEventSchema = userEventSchema

export type EventType = z.infer<typeof eventTypeSchema>
export type EventSubtype = z.infer<typeof eventSubtypeSchema>
export type IPMetadata = z.infer<typeof ipMetadataSchema>
export type RemixMetadata = z.infer<typeof remixMetadataSchema>
export type UserEventMetadata = z.infer<typeof userEventMetadataSchema>
export type UserEvent = z.infer<typeof userEventSchema>

export const userEventColumns = [
  "id",
  "user_wallet_address",
  "event_type",
  "event_subtype",
  "amount_usd",
  "token_address",
  "ip_id",
  "remix_id",
  "transaction_hash",
  "metadata",
  "created_at",
  "updated_at",
] as const
