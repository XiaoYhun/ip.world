"use server"

import { env } from "@/config"
import { HttpMethod } from "@/lib/http-utils"
import { createContext } from "@/lib/logger"
import fetchWithJWTCheck from "@/lib/server/fetcher"
import { ErrHandler } from "@/lib/server-errors"

export async function sendVote(
  {
    ip_id,
    is_valid,
    user_address,
    account,
    account_type,
    reason,
    suggestion_id,
  }: {
    ip_id: string
    is_valid: boolean
    user_address: string
    suggestion_id?: string
    account?: string
    account_type?: string
    reason?: string
  },
  jwtToken?: string,
  context = createContext("sendVote", __filename, {})
) {
  try {
    const response = await fetchWithJWTCheck(
      `${env.NEXT_PUBLIC_API_BASE_URL}/ips/${ip_id}/suggestions`,
      {
        method: HttpMethod.POST,
        body: JSON.stringify({
          is_valid,
          user_address,
          account,
          account_type,
          reason,
          suggestion_id,
        }),
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

    return await response.json()
  } catch (error) {
    return ErrHandler.handleGenericError(error as Error, context)
  }
}
