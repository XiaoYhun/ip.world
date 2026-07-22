"use server"

import { env } from "@/config"
import { HttpMethod } from "@/lib/http-utils"
import { createContext } from "@/lib/logger"
import fetchWithJWTCheck from "@/lib/server/fetcher"
import { ErrHandler } from "@/lib/server-errors"

export async function getRegisterSig(
  {
    creator,
    ipa_hash,
    nonce,
  }: {
    creator: string
    ipa_hash: string
    nonce: number
  },
  jwtToken?: string,
  context = createContext("getRegisterSig", __filename, {})
) {
  try {
    const response = await fetchWithJWTCheck(
      `${env.NEXT_PUBLIC_API_BASE_URL}/signature/register`,
      {
        method: HttpMethod.POST,
        body: JSON.stringify({
          creator,
          ipa_hash,
          tokens: [],
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
