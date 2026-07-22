// hooks/useReportIp.ts
import { useCallback } from "react"
import { getAuthToken } from "@/lib/dynamic"

interface ReportData {
  entity: "take" | "feed" | "token" | "ip"
  entity_id: string
  type: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any>
}

interface ReportResponse {
  success: boolean
  message?: string
  data?: {
    id: string
    type: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: Record<string, any>
  }
  error?: string
}

export const useReport = () => {
  // entity -> take/feed/token/ip
  // entity_id -> above uuid
  // type ->
  // if entity is take -> spam, inapropriate content
  // feed -> off topic, inapropriate content
  // token -> wrong ip, irrelevancy, spam, inapropriate content
  // ip -> incorect ip, inapropriate content, wrong ip category
  // metadata:
  // description: put anything here
  const reportIp = useCallback(async (data: ReportData): Promise<ReportResponse> => {
    try {
      const response = await fetch(`/api/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Authorization": `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: result.message || "Failed to submit report",
        }
      }

      return result
    } catch (error) {
      console.error("Error reporting IP:", error)
      return {
        success: false,
        error: "Network error occurred while submitting report",
      }
    }
  }, [])

  return { reportIp }
}
