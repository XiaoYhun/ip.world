"use server"

import { env } from "@/config"
import { HttpMethod } from "@/lib/http-utils"
import { createContext } from "@/lib/logger"
import fetchWithJWTCheck from "@/lib/server/fetcher"
import { ErrHandler } from "@/lib/server-errors"

export async function unlinkTikTok(jwtToken?: string, context = createContext("unlinkTikTok", __filename, {})) {
  try {
    const response = await fetchWithJWTCheck(
      `${env.NEXT_PUBLIC_API_BASE_URL}/tiktok-verification/unlink-tiktok`,
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
