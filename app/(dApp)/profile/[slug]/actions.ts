"use server"

import { env } from "@/config"
import { Holding } from "@/types/holding"
import { Ip } from "@/types/ip"
import { UserProfile } from "@/types/profile"
import { Referral } from "@/types/referral"
import { Remix } from "@/types/remix"
import { ListResponse } from "@/types/response"
import { Take } from "@/types/take"

export const fetchProfile = async ({
  userIdentifier,
  userAddress,
}: {
  userIdentifier?: string
  userAddress?: string
}): Promise<UserProfile | null> => {
  const id = userIdentifier || userAddress
  if (!id) return null
  const response = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/users/${id}/profile`, {
    next: { revalidate: 30 },
  })

  if (!response.ok) {
    return null
  }

  const data = (await response.json()).data as UserProfile
  return data
}

export const fetchUserHoldings = async ({
  userAddress,
  limit,
  offset,
}: {
  userAddress: string
  limit: number
  offset: number
}): Promise<ListResponse<Holding>> => {
  const response = await fetch(
    `${env.NEXT_PUBLIC_API_BASE_URL}/users/${userAddress}/holdings?limit=${limit}&offset=${offset}`,
    { next: { revalidate: 30 } }
  )

  if (!response.ok) {
    return {
      results: [],
      total: 0,
      limit,
      offset,
    }
  }

  const data = (await response.json()) as ListResponse<Holding>

  return data
}

export const fetchUserRemixes = async ({
  userAddress,
  limit,
  offset,
}: {
  userAddress: string
  limit: number
  offset: number
}): Promise<ListResponse<Remix>> => {
  const response = await fetch(
    `${env.NEXT_PUBLIC_API_BASE_URL}/users/${userAddress}/remixes?limit=${limit}&offset=${offset}`,
    { next: { revalidate: 30 } }
  )

  if (!response.ok) {
    return {
      results: [],
      total: 0,
      limit,
      offset,
    }
  }

  const data = (await response.json()) as ListResponse<Remix>

  return data
}

export const fetchUserIps = async ({
  userAddress,
  limit,
  offset,
}: {
  userAddress: string
  limit: number
  offset: number
}): Promise<ListResponse<Ip>> => {
  const response = await fetch(
    `${env.NEXT_PUBLIC_API_BASE_URL}/users/${userAddress}/ips?limit=${limit}&offset=${offset}`,
    { next: { revalidate: 30 } }
  )

  if (!response.ok) {
    return {
      results: [],
      total: 0,
      limit,
      offset,
    }
  }

  const data = (await response.json()) as ListResponse<Ip>

  return data
}

export const fetchUserTakes = async ({
  userAddress,
  limit,
  offset,
}: {
  userAddress: string
  limit: number
  offset: number
}): Promise<ListResponse<Take>> => {
  const response = await fetch(
    `${env.NEXT_PUBLIC_API_BASE_URL}/users/${userAddress}/takes?limit=${limit}&offset=${offset}`,
    { next: { revalidate: 30 } }
  )

  if (!response.ok) {
    return {
      results: [],
      total: 0,
      limit,
      offset,
    }
  }

  const data = (await response.json()) as ListResponse<Take>

  return data
}

export const fetchUserReferrals = async ({
  userAddress,
  limit,
  offset,
}: {
  userAddress: string
  limit: number
  offset: number
}): Promise<ListResponse<Referral>> => {
  const response = await fetch(
    `${env.NEXT_PUBLIC_API_BASE_URL}/users/${userAddress}/referrals?limit=${limit}&offset=${offset}`,
    { next: { revalidate: 30 } }
  )

  if (!response.ok) {
    return {
      results: [],
      total: 0,
      limit,
      offset,
    }
  }

  const data = (await response.json()) as ListResponse<Referral>

  return data
}
