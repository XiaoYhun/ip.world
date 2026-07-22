"use client"

import { createCollection, eq, gte, useLiveQuery } from "@tanstack/react-db"
import { electricCollectionOptions } from "@tanstack/electric-db-collection"
import { startOfDay, subDays } from "date-fns"

import { env } from "@/config"
import { userEventColumns, selectUserEventSchema, UserEvent, EventType } from "@/lib/schema/user-events-schema"

const columns = userEventColumns as unknown as string[]

export const userEventsCollection = createCollection(
  electricCollectionOptions({
    id: "user_events",
    shapeOptions: {
      url: env.NEXT_PUBLIC_METRICS_SYNC_CLOUDFLARE_URL,
      params: {
        table: "user_events",
        columns,
      },
    },
    schema: selectUserEventSchema,
    getKey: (item) => item.id,
  })
)

/**
 * Hook to watch user events from the last 24 hours, limited to 200 results
 */
export function useWatchUserEvent(): UserEvent[] | undefined {
  const twentyFourHoursAgo = startOfDay(subDays(new Date(), 1)).toISOString()

  const { data: userEvents } = useLiveQuery((q) =>
    q
      .from({ userEventsCollection })
      .where(({ userEventsCollection }) => gte(userEventsCollection.updated_at, twentyFourHoursAgo))
      .orderBy(({ userEventsCollection }) => [userEventsCollection.created_at, "desc"])
      .limit(200)
  )

  return userEvents
}

/**
 * Hook to watch user events by wallet address (last 24 hours only)
 */
export function useWatchUserEventsByWallet(walletAddress: string): UserEvent[] | undefined {
  const twentyFourHoursAgo = startOfDay(subDays(new Date(), 1)).toISOString()

  const { data: userEvents } = useLiveQuery((q) =>
    q
      .from({ userEventsCollection })
      .where(
        ({ userEventsCollection }) =>
          eq(userEventsCollection.user_wallet_address, walletAddress.toLowerCase()) &&
          gte(userEventsCollection.updated_at, twentyFourHoursAgo)
      )
      .orderBy(({ userEventsCollection }) => [userEventsCollection.created_at, "desc"])
  )

  return userEvents
}

/**
 * Hook to watch user events by event type (last 24 hours only)
 */
export function useWatchUserEventsByType(eventType: EventType): UserEvent[] | undefined {
  const twentyFourHoursAgo = startOfDay(subDays(new Date(), 1)).toISOString()

  const { data: userEvents } = useLiveQuery((q) =>
    q
      .from({ userEventsCollection })
      .where(
        ({ userEventsCollection }) =>
          eq(userEventsCollection.event_type, eventType) && gte(userEventsCollection.updated_at, twentyFourHoursAgo)
      )
      .orderBy(({ userEventsCollection }) => [userEventsCollection.created_at, "desc"])
  )

  return userEvents
}

/**
 * Hook to watch user events for a specific token (last 24 hours only)
 */
export function useWatchUserEventsByToken(tokenAddress: string): UserEvent[] | undefined {
  const twentyFourHoursAgo = startOfDay(subDays(new Date(), 1)).toISOString()

  const { data: userEvents } = useLiveQuery((q) =>
    q
      .from({ userEventsCollection })
      .where(
        ({ userEventsCollection }) =>
          eq(userEventsCollection.token_address, tokenAddress.toLowerCase()) &&
          gte(userEventsCollection.updated_at, twentyFourHoursAgo)
      )
      .orderBy(({ userEventsCollection }) => [userEventsCollection.created_at, "desc"])
  )

  return userEvents
}

/**
 * Hook to watch user events for a specific IP (last 24 hours only)
 */
export function useWatchUserEventsByIP(ipId: string): UserEvent[] | undefined {
  const twentyFourHoursAgo = startOfDay(subDays(new Date(), 1)).toISOString()

  const { data: userEvents } = useLiveQuery((q) =>
    q
      .from({ userEventsCollection })
      .where(
        ({ userEventsCollection }) =>
          eq(userEventsCollection.ip_id, ipId) && gte(userEventsCollection.updated_at, twentyFourHoursAgo)
      )
      .orderBy(({ userEventsCollection }) => [userEventsCollection.created_at, "desc"])
  )

  return userEvents
}

/**
 * Hook to get all user events (last 24 hours only)
 */
export function useWatchAllUserEvents(): UserEvent[] | undefined {
  const twentyFourHoursAgo = startOfDay(subDays(new Date(), 1)).toISOString()

  const { data: userEvents } = useLiveQuery((q) =>
    q
      .from({ userEventsCollection })
      .where(({ userEventsCollection }) => gte(userEventsCollection.updated_at, twentyFourHoursAgo))
      .orderBy(({ userEventsCollection }) => [userEventsCollection.created_at, "desc"])
  )

  return userEvents
}
