"use server"

import { env } from "@/config"

export type EndorseRemixPayload = {
  token_address: string
  endorsement_type: "official" | "liked"
}

export async function endorseRemix(payload: EndorseRemixPayload, authToken?: string) {
  try {
    const response = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/remixes/${payload.token_address}/endorse`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
      body: JSON.stringify({
        endorsement_type: payload.endorsement_type,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Failed to endorse remix: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error endorsing remix:", error)
    throw error
  }
}

export async function unendorseRemix(tokenAddress: string, authToken?: string) {
  try {
    const response = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/remixes/${tokenAddress}/unendorse`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Failed to unendorse remix: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error unendorsing remix:", error)
    throw error
  }
}
