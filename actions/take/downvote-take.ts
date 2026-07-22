"use server"

import { env } from "@/config"
import { HttpMethod } from "@/lib/http-utils"
import { createContext } from "@/lib/logger"
import fetchWithJWTCheck from "@/lib/server/fetcher"
import { ErrHandler } from "@/lib/server-errors"

export async function downvoteTake(
  {
    ip_id,
    take_id,
  }: {
    ip_id: string
    take_id: string
  },
  jwtToken?: string,
  context = createContext("downvoteTake", __filename, {})
) {
  try {
    const response = await fetchWithJWTCheck(
      `${env.NEXT_PUBLIC_API_BASE_URL}/ips/${ip_id}/takes/${take_id}/downvote`,
      {
        method: HttpMethod.POST,
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      },
      jwtToken
    )

    if (!response.ok) {
      return ErrHandler.handleResponseError(response, context)
    }

    return { success: true }
  } catch (error) {
    return ErrHandler.handleGenericError(error as Error, context)
  }
}
