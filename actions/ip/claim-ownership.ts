"use server"

import { env } from "@/config"
import { HttpMethod } from "@/lib/http-utils"
import { createContext } from "@/lib/logger"
import fetchWithJWTCheck from "@/lib/server/fetcher"
import { ErrHandler } from "@/lib/server-errors"

// export async function claimOwnership(
//   {
//     ip_id,
//     user_address,
//   }: {
//     ip_id: string
//     user_address: string
//   },
//   jwtToken?: string,
//   context = createContext("claimOwnership", __filename, {})
// ) {
//   try {
//     const requestBody = {
//       owner_address: user_address,
//     }

//     const apiUrl = `${env.NEXT_PUBLIC_API_BASE_URL}/ips/${ip_id}/claim`

//     const response = await fetchWithJWTCheck(
//       apiUrl,
//       {
//         method: HttpMethod.POST,
//         body: JSON.stringify(requestBody),
//         headers: {
//           "Content-Type": "application/json",
//         },
//         cache: "no-store",
//       },
//       jwtToken
//     )

//     if (!response.ok) {
//       return ErrHandler.handleResponseError(response, context)
//     }

//     const responseData = await response.json()
//     return responseData
//   } catch (error) {
//     console.error("Claim ownership error:", error)
//     return ErrHandler.handleGenericError(error as Error, context)
//   }
// }

export async function claimAndRegisterOwnership(
  {
    ip_id,
    user_address,
    ipa_id,
  }: {
    ip_id: string
    user_address: string
    ipa_id: string
  },
  jwtToken?: string,
  context = createContext("claimAndRegisterOwnership", __filename, {})
) {
  try {
    const requestBody = {
      owner_address: user_address,
      ipa_id: ipa_id,
    }

    const apiUrl = `${env.NEXT_PUBLIC_API_BASE_URL}/ips/${ip_id}/claim-and-register`

    const response = await fetchWithJWTCheck(
      apiUrl,
      {
        method: HttpMethod.POST,
        body: JSON.stringify(requestBody),
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

    const responseData = await response.json()
    return responseData
  } catch (error) {
    console.error("Claim and register ownership error:", error)
    return ErrHandler.handleGenericError(error as Error, context)
  }
}
