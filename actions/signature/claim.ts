"use server"

import { env } from "@/config"
import { HttpMethod } from "@/lib/http-utils"
import { createContext } from "@/lib/logger"
import fetchWithJWTCheck from "@/lib/server/fetcher"
import { ErrHandler } from "@/lib/server-errors"

export async function getClaimSig(
  {
    sender,
    ipa_id,
    claimer,
    nonce,
    tokens,
  }: {
    sender: string
    ipa_id: string
    claimer: string
    nonce: number
    tokens: string[]
  },
  jwtToken?: string,
  context = createContext("getClaimSig", __filename, {})
) {
  try {
    const response = await fetchWithJWTCheck(
      `${env.NEXT_PUBLIC_API_BASE_URL}/signature/claim`,
      {
        method: HttpMethod.POST,
        body: JSON.stringify({
          sender,
          ipa_id,
          claimer,
          nonce,
          tokens,
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
