"use server"

import { env } from "@/config"

export async function flagRemix(tokenAddress: string, authToken?: string) {
  try {
    const response = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/remixes/${tokenAddress}/flag`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Failed to flag remix: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error flagging remix:", error)
    throw error
  }
}

export async function unflagRemix(tokenAddress: string, authToken?: string) {
  try {
    const response = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/remixes/${tokenAddress}/unflag`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Failed to unflag remix: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error unflagging remix:", error)
    throw error
  }
}
