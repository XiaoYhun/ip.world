"use server"

import { Address } from "viem"
import { env } from "@/config"
import { HttpMethod } from "@/lib/http-utils"
import { createContext } from "@/lib/logger"
import fetchWithJWTCheck from "@/lib/server/fetcher"
import { ErrHandler } from "@/lib/server-errors"

export async function refreshMetrics(
  {
    tokenAddresses,
  }: {
    tokenAddresses: Address[]
  },
  jwtToken?: string,
  context = createContext("refreshMetrics", __filename, {})
) {
  try {
    const response = await fetchWithJWTCheck(
      `${env.NEXT_PUBLIC_API_BASE_URL}/refresh/tokens`,
      {
        method: HttpMethod.POST,
        body: JSON.stringify({
          tokenAddresses,
        }),
        cache: "no-store",
      },
      jwtToken
    )

    if (!response.ok) {
      return ErrHandler.handleResponseError(response, context)
    }

    return {
      status: 200,
      data: true,
    }
  } catch (error) {
    return ErrHandler.handleGenericError(error as Error, context)
  }
}
