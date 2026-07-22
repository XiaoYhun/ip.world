"use server"

import { revalidatePath } from "next/cache"
import { env } from "@/config"
import { HttpMethod } from "@/lib/http-utils"
import { createContext } from "@/lib/logger"
import fetchWithJWTCheck from "@/lib/server/fetcher"
import { ErrHandler } from "@/lib/server-errors"

export async function createIp(
  formData: Record<string, string | boolean | number>,
  jwtToken?: string,
  context = createContext("createIp", __filename, {})
) {
  const { title, description, image, owner_account, owner_account_type, alias, type, is_licensed, category, socials } =
    formData

  const socialObject: Record<string, string> = {}

  if (socials) {
    if (Array.isArray(socials)) {
      // Array format: [{ type: "twitter", url: "..." }, ...]
      socials.forEach((social: { type: string; url: string }) => {
        const platform = social.type.toLowerCase()
        if (social.url?.trim()) {
          socialObject[platform] = social.url
        }
      })
    } else if (typeof socials === "object" && socials !== null) {
      // Object format: { twitter: "...", tiktok: "...", ... }
      for (const [platform, url] of Object.entries(socials as Record<string, string>)) {
        if (typeof url === "string" && url.trim()) {
          socialObject[platform.toLowerCase()] = url
        }
      }
    }
  }

  try {
    const response = await fetchWithJWTCheck(
      `${env.NEXT_PUBLIC_API_BASE_URL}/ips`,
      {
        method: HttpMethod.POST,
        body: JSON.stringify({
          title,
          description,
          alias,
          allocation: 0,
          image: image,
          owner_account,
          owner_account_type,
          socials: socialObject,
          is_licensed,
          type,
          category,
        }),
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
