import { env } from "@/config"
import { tradeTimer } from "@/lib/trade-timer"
import type { RelayStatusResponse, StatusCallback } from "./types"
import { formatRelayHttpErrorBody } from "./relay-errors"
import { RELAY_API_URL } from "./quote"

const STATUS_POLL_INTERVAL_MS = 250
const STATUS_POLL_TIMEOUT_MS = 120_000

/**
 * Polls Relay's intent status endpoint until the transaction reaches
 * a terminal state (success, failure, refund) or times out.
 */
export async function pollRelayStatus(
  requestId: string,
  onStatusUpdate?: StatusCallback
): Promise<RelayStatusResponse> {
  const label = `[relay] pollStatus (${requestId.slice(0, 12)}…)`
  tradeTimer.start(label)
  let pollCount = 0
  const headers: Record<string, string> = {}
  if (env.NEXT_PUBLIC_RELAY_API_KEY) {
    headers["x-api-key"] = env.NEXT_PUBLIC_RELAY_API_KEY
  }

  const deadline = Date.now() + STATUS_POLL_TIMEOUT_MS

  while (Date.now() < deadline) {
    pollCount++
    const statusUrl = `${RELAY_API_URL}/intents/status/v3?requestId=${requestId}`
    const response = await fetch(statusUrl, { headers })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error")
      tradeTimer.end(label)
      throw new Error(formatRelayHttpErrorBody(response.status, errorText))
    }

    const status = (await response.json()) as RelayStatusResponse
    onStatusUpdate?.(status)

    if (status.status === "success" || status.status === "failure" || status.status === "refund") {
      tradeTimer.log(`[relay] pollStatus: "${status.status}" after ${pollCount} polls`)
      tradeTimer.end(label)
      return status
    }

    await new Promise((resolve) => setTimeout(resolve, STATUS_POLL_INTERVAL_MS))
  }

  tradeTimer.log(`[relay] pollStatus: timed out after ${pollCount} polls`)
  tradeTimer.end(label)
  throw new Error("[Relay] Transaction timed out after 2 minutes")
}
