"use client"

function pushMessage(messages: string[], value: unknown) {
  if (typeof value !== "string") return
  const normalized = value.trim()
  if (!normalized) return
  if (!messages.includes(normalized)) {
    messages.push(normalized)
  }
}

function collectMessages(value: unknown, messages: string[], seen: WeakSet<object>) {
  if (value == null) return

  if (typeof value === "string") {
    pushMessage(messages, value)
    return
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectMessages(item, messages, seen)
    }
    return
  }

  if (typeof value !== "object") return
  if (seen.has(value)) return
  seen.add(value)

  const record = value as Record<string, unknown>

  pushMessage(messages, record.shortMessage)
  pushMessage(messages, record.message)
  pushMessage(messages, record.details)
  pushMessage(messages, record.reason)

  if (typeof record.code === "string" || typeof record.code === "number") {
    pushMessage(messages, String(record.code))
  }

  if (Array.isArray(record.metaMessages)) {
    for (const item of record.metaMessages) {
      pushMessage(messages, item)
    }
  }

  collectMessages(record.cause, messages, seen)
  collectMessages(record.error, messages, seen)
  collectMessages(record.data, messages, seen)
  collectMessages(record.info, messages, seen)
  collectMessages(record.response, messages, seen)
  collectMessages(record.responseBody, messages, seen)
}

export function extractTransactionErrorMessages(error: unknown): string[] {
  const messages: string[] = []
  collectMessages(error, messages, new WeakSet<object>())
  return messages
}

export function parseTransactionErrorMessage(error: unknown, fallback = "Transaction failed"): string {
  const messages = extractTransactionErrorMessages(error)
  const raw = messages.join(" | ")
  const normalized = raw.toLowerCase()

  if (
    normalized.includes("user rejected") ||
    normalized.includes("user denied") ||
    normalized.includes("rejected the request") ||
    normalized.includes("request rejected") ||
    normalized.includes("transaction cancelled") ||
    normalized.includes("4001")
  ) {
    return "Transaction cancelled."
  }

  if (
    normalized.includes("insufficient funds") ||
    normalized.includes("insufficient balance") ||
    normalized.includes("transfer amount exceeds balance") ||
    normalized.includes("exceeds balance") ||
    normalized.includes("not enough balance") ||
    normalized.includes("gas required exceeds allowance")
  ) {
    return "Insufficient balance to complete this transaction."
  }

  if (
    normalized.includes("quote") ||
    normalized.includes("no route") ||
    normalized.includes("no pool") ||
    normalized.includes("pool unavailable")
  ) {
    return "Unable to get a swap quote right now."
  }

  if (normalized.includes("\ntf") || /(?:^|[\s|:])tf(?:$|[\s|])/.test(normalized)) {
    return "Anti-snipe limit exceeded."
  }

  if (normalized.includes("nonce")) {
    return "Transaction nonce error. Please try again."
  }

  if (normalized.includes("gas")) {
    return "Transaction failed while estimating gas."
  }

  const preferredMessage = messages.find(
    (message) =>
      !message.toLowerCase().startsWith("execution reverted") &&
      !message.toLowerCase().startsWith("rpc request failed")
  )

  if (preferredMessage) {
    return preferredMessage
  }

  const rawMessage = messages[0]
  if (rawMessage) {
    return rawMessage
  }

  return fallback
}
