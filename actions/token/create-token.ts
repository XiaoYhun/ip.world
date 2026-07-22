"use server"

import { env } from "@/config"
import { HttpMethod } from "@/lib/http-utils"
import { createContext } from "@/lib/logger"
import fetchWithJWTCheck from "@/lib/server/fetcher"
import { ErrHandler } from "@/lib/server-errors"

export async function createToken(
  formData: Record<string, string | boolean | number>,
  jwtToken?: string,
  context = createContext("createToken", __filename, {})
) {
  const { name, symbol, image, description, socials, creator_address, token_address, ip_id, tx_hash } = formData

  try {
    const URL_PATTERN = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/\S*)?$/
    const isValidUrl = (value: string) => URL_PATTERN.test(value.trim())

    const socialObject: Record<string, string> = {}

    if (socials) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let parsed: any = socials
      if (typeof socials === "string") {
        try {
          parsed = JSON.parse(socials)
        } catch {
          parsed = null
        }
      }

      if (Array.isArray(parsed)) {
        // Array format: [{ type: "twitter", url: "..." }, ...]
        parsed.forEach((social: { type: string; url: string }) => {
          const platform = social.type.toLowerCase()
          if (social.url?.trim() && isValidUrl(social.url)) {
            socialObject[platform] = social.url
          }
        })
      } else if (typeof parsed === "object" && parsed !== null) {
        // Object format: { twitter: "...", tiktok: "...", ... }
        for (const [platform, url] of Object.entries(parsed as Record<string, string>)) {
          if (typeof url === "string" && url.trim() && isValidUrl(url)) {
            socialObject[platform.toLowerCase()] = url
          }
        }
      }
    }
    const response = await fetchWithJWTCheck(
      `${env.NEXT_PUBLIC_API_BASE_URL}/remixes`,
      {
        method: HttpMethod.POST,
        body: JSON.stringify(
          Object.assign({
            name,
            symbol,
            decimals: 18,
            chain: "story",
            token_address,
            image,
            creator: creator_address,
            creator_fee: 1,
            description,
            token_created_at: new Date().toISOString(),
            tx_hash,
            socials: socialObject,
            ip_id: ip_id,
          })
        ),
      },
      jwtToken
    )

    if (!response.ok) {
      return await response.json()
    }

    return await response.json()
  } catch (error) {
    return ErrHandler.handleGenericError(error as Error, context)
  }
}
