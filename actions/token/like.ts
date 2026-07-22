"use server"

import { revalidatePath } from "next/cache"
import { env } from "@/config"
import { HttpMethod } from "@/lib/http-utils"
import { createContext } from "@/lib/logger"
import fetchWithJWTCheck from "@/lib/server/fetcher"
import { ErrHandler } from "@/lib/server-errors"

export async function likeToken(
  ip_id: string,
  token_address: string,
  is_liked: boolean,
  jwtToken?: string,
  context = createContext("likeToken", __filename, {})
) {
  try {
    const response = await fetchWithJWTCheck(
      `${env.NEXT_PUBLIC_API_BASE_URL}/remixes/${token_address}/like`,
      {
        method: HttpMethod.POST,
        body: JSON.stringify({
          is_liked,
        }),
      },
      jwtToken
    )

    if (!response.ok) {
      return ErrHandler.handleResponseError(response, context)
    }

    revalidatePath(`/ip/${ip_id}`)
    return await response.json()
  } catch (error) {
    return ErrHandler.handleGenericError(error as Error, context)
  }
}
