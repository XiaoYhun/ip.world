"use server"

import { env } from "@/config"
import { HttpMethod } from "@/lib/http-utils"
import { createContext } from "@/lib/logger"
import fetchWithJWTCheck from "@/lib/server/fetcher"
import { ErrHandler } from "@/lib/server-errors"

export async function claimIp(
  ip_id: string,
  owner_address: string,
  jwtToken?: string,
  context = createContext("claimIp", __filename, {})
) {
  try {
    const response = await fetchWithJWTCheck(
      `${env.NEXT_PUBLIC_API_BASE_URL}/ips/${ip_id}/claim`,
      {
        method: HttpMethod.POST,
        body: JSON.stringify({
          owner_address: owner_address,
        }),
      },
      jwtToken
    )

    if (!response.ok) {
      return ErrHandler.handleResponseError(response, context)
    }

    const responseData = await response.json()
    return responseData
  } catch (error) {
    return ErrHandler.handleGenericError(error as Error, context)
  }
}
