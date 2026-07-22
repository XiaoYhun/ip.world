"use server"

import { env } from "@/config"
import { HttpMethod } from "@/lib/http-utils"
import { createContext } from "@/lib/logger"
import fetchWithJWTCheck from "@/lib/server/fetcher"
import { ErrHandler } from "@/lib/server-errors"

export async function createReply(
  {
    remix_id,
    body,
    user_address,
    parent_id,
  }: {
    remix_id: string
    body: string
    user_address: string
    parent_id: string
  },
  jwtToken?: string,
  context = createContext("createReply", __filename, {})
) {
  try {
    const response = await fetchWithJWTCheck(
      `${env.NEXT_PUBLIC_API_BASE_URL}/comments`,
      {
        method: HttpMethod.POST,
        body: JSON.stringify({
          remix_id,
          body,
          user_address,
          parent_id,
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
