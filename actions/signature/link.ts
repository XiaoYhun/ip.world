"use server"

import { env } from "@/config"
import { HttpMethod } from "@/lib/http-utils"
import { createContext } from "@/lib/logger"
import fetchWithJWTCheck from "@/lib/server/fetcher"
import { ErrHandler } from "@/lib/server-errors"

export async function getLinkSig(
  {
    sender,
    ipa_id,
    token,
    nonce,
  }: {
    sender: string
    ipa_id: string
    token: string
    nonce: number
  },
  jwtToken?: string,
  context = createContext("getLinkSig", __filename, {})
) {
  try {
    const response = await fetchWithJWTCheck(
      `${env.NEXT_PUBLIC_API_BASE_URL}/signature/link`,
      {
        method: HttpMethod.POST,
        body: JSON.stringify({
          sender,
          ipa_id,
          token,
          nonce,
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
