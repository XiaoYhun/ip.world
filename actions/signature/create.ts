"use server"

import { env } from "@/config"
import { HttpMethod } from "@/lib/http-utils"
import { createContext } from "@/lib/logger"
import fetchWithJWTCheck from "@/lib/server/fetcher"
import { ErrHandler } from "@/lib/server-errors"

export async function getCreateSig(
  creator: string,
  nonce: number,
  antiSnipe: boolean,
  jwtToken?: string,
  context = createContext("getCreateSig", __filename, {})
) {
  try {
    const response = await fetchWithJWTCheck(
      `${env.NEXT_PUBLIC_API_BASE_URL}/signature/create`,
      {
        method: HttpMethod.POST,
        body: JSON.stringify({
          creator,
          nonce,
          anti_snipe: antiSnipe,
        }),
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
