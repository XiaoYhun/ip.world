"use server"

import { revalidatePath } from "next/cache"
import { env } from "@/config"
import { HttpMethod } from "@/lib/http-utils"
import { createContext } from "@/lib/logger"
import fetchWithJWTCheck from "@/lib/server/fetcher"
import { ErrHandler } from "@/lib/server-errors"

export async function deleteIp(ipId: string, jwtToken?: string, context = createContext("deleteIp", __filename, {})) {
  try {
    const response = await fetchWithJWTCheck(
      `${env.NEXT_PUBLIC_API_BASE_URL}/ips/${ipId}`,
      {
        method: HttpMethod.DELETE,
      },
      jwtToken
    )

    if (!response.ok) {
      return await response.json()
    }

    revalidatePath("/remixes")

    return await response.json()
  } catch (error) {
    return ErrHandler.handleGenericError(error as Error, context)
  }
}
