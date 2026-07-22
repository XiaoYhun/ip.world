"use server"

import { env } from "@/config"
import { HttpMethod } from "@/lib/http-utils"
import { createContext } from "@/lib/logger"
import fetchWithJWTCheck from "@/lib/server/fetcher"
import { ErrHandler } from "@/lib/server-errors"
import { TikTokVerificationRequest } from "@/types/tiktok-verification"

export async function createTikTokVerification(
  data: TikTokVerificationRequest,
  jwtToken?: string,
  context = createContext("createTikTokVerification", __filename, {})
) {
  try {
    const response = await fetchWithJWTCheck(
      `${env.NEXT_PUBLIC_API_BASE_URL}/tiktok-verification/request`,
      {
        method: HttpMethod.POST,
        body: JSON.stringify(data),
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
