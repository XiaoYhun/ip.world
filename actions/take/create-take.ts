"use server"

import { revalidatePath } from "next/cache"
import { env } from "@/config"
import { HttpMethod } from "@/lib/http-utils"
import { createContext } from "@/lib/logger"
import fetchWithJWTCheck from "@/lib/server/fetcher"
import { ErrHandler } from "@/lib/server-errors"

export async function createTake(
  {
    ip_id,
    rating,
    content,
  }: {
    ip_id: string
    rating: number
    content: string
  },
  jwtToken?: string,
  context = createContext("createTake", __filename, {})
) {
  try {
    const response = await fetchWithJWTCheck(
      `${env.NEXT_PUBLIC_API_BASE_URL}/ips/${ip_id}/takes`,
      {
        method: HttpMethod.POST,
        body: JSON.stringify({
          ip_id,
          rating,
          content,
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

    revalidatePath(`/ip/${ip_id}`)
    return await response.json()
  } catch (error) {
    return ErrHandler.handleGenericError(error as Error, context)
  }
}
