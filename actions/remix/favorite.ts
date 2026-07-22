"use server"

import { env } from "@/config"
import { HttpMethod } from "@/lib/http-utils"
import { createContext } from "@/lib/logger"
import fetchWithJWTCheck from "@/lib/server/fetcher"
import { ErrHandler } from "@/lib/server-errors"

export async function favoriteRemixes(
  remix_id: string,
  jwtToken?: string,
  context = createContext("favoriteRemixes", __filename, {})
) {
  try {
    const response = await fetchWithJWTCheck(
      `${env.NEXT_PUBLIC_API_BASE_URL}/remixes/${remix_id}/favorite`,
      {
        method: HttpMethod.POST,
      },
      jwtToken
    )

    if (!response.ok) {
      return ErrHandler.handleResponseError(response, context)
    }

    return await response.json()
  } catch (error) {
    return ErrHandler.handleGenericError(error as Error, context)
  }
}

export async function unFavoriteRemixes(
  remix_id: string,
  jwtToken?: string,
  context = createContext("favoriteRemixes", __filename, {})
) {
  try {
    const response = await fetchWithJWTCheck(
      `${env.NEXT_PUBLIC_API_BASE_URL}/remixes/${remix_id}/unfavorite`,
      {
        method: HttpMethod.POST,
      },
      jwtToken
    )
    if (!response.ok) {
      return ErrHandler.handleResponseError(response, context)
    }

    return await response.json()
  } catch (error) {
    return ErrHandler.handleGenericError(error as Error, context)
  }
}

export async function getIsRemixesFavorited(
  remix_id: string,
  jwtToken?: string,
  context = createContext("getIsRemixesFavorited", __filename, {})
) {
  try {
    const response = await fetchWithJWTCheck(
      `${env.NEXT_PUBLIC_API_BASE_URL}/users/favorites/remixes/${remix_id}`,
      {
        method: HttpMethod.GET,
      },
      jwtToken
    )

    if (!response.ok) {
      return ErrHandler.handleResponseError(response, context)
    }

    return await response.json()
  } catch (error) {
    return ErrHandler.handleGenericError(error as Error, context)
  }
}
