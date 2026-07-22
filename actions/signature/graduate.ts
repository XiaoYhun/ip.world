"use server"

import { env } from "@/config"
import { HttpMethod } from "@/lib/http-utils"
import { createContext } from "@/lib/logger"
import fetchWithJWTCheck from "@/lib/server/fetcher"
import { ErrHandler } from "@/lib/server-errors"

export async function getGraduateSig(
  {
    sender,
    token,
    ipa_hash,
    nonce,
  }: {
    sender: string
    token: string
    ipa_hash: string
    nonce: number
  },
  jwtToken?: string,
  context = createContext("getGraduateSig", __filename, {})
) {
  try {
    const response = await fetchWithJWTCheck(
      `${env.NEXT_PUBLIC_API_BASE_URL}/signature/graduate`,
      {
        method: HttpMethod.POST,
        body: JSON.stringify({
          sender,
          token,
          ipa_hash,
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
