import { env } from "@/config"

export const STORY_RPC_OVERRIDE_STORAGE_KEY = "ip.world.storyRpcOverride"

export const STORY_RPC_CHANGED_EVENT = "ip-world-story-rpc-changed"

const STORAGE_VERSION = 2

export type StoryRpcAuthPreset = "none" | "bearer" | "x-api-key" | "custom"

export interface StoryRpcStoredConfig {
  v: number
  /** `null` = use deploy default URL */
  url: string | null
  authPreset: StoryRpcAuthPreset
  /** Used when `authPreset === "custom"` */
  authHeaderName: string
  /** API key or token (local only) */
  authSecret: string
}

function defaultStored(): StoryRpcStoredConfig {
  return {
    v: STORAGE_VERSION,
    url: null,
    authPreset: "none",
    authHeaderName: "",
    authSecret: "",
  }
}

function normalizeStored(input: Record<string, unknown>): StoryRpcStoredConfig {
  const urlRaw = input.url
  const url =
    urlRaw === null || urlRaw === undefined
      ? null
      : typeof urlRaw === "string"
        ? parseStoryRpcOverride(urlRaw)
        : null
  const preset = input.authPreset
  const authPreset: StoryRpcAuthPreset =
    preset === "bearer" || preset === "x-api-key" || preset === "custom" || preset === "none"
      ? preset
      : "none"
  const authHeaderName = typeof input.authHeaderName === "string" ? input.authHeaderName : ""
  const authSecret = typeof input.authSecret === "string" ? input.authSecret : ""
  return { v: STORAGE_VERSION, url, authPreset, authHeaderName, authSecret }
}

/**
 * Reads persisted Story RPC config (v2 JSON). Migrates legacy plain-URL string values.
 */
export function readStoryRpcStored(): StoryRpcStoredConfig {
  if (typeof window === "undefined") return defaultStored()
  const raw = localStorage.getItem(STORY_RPC_OVERRIDE_STORAGE_KEY)
  if (!raw) return defaultStored()

  try {
    const parsed: unknown = JSON.parse(raw)
    if (parsed && typeof parsed === "object" && parsed !== null && "v" in parsed) {
      return normalizeStored(parsed as Record<string, unknown>)
    }
  } catch {
    const url = parseStoryRpcOverride(raw)
    return { ...defaultStored(), url }
  }

  return defaultStored()
}

export function writeStoryRpcStored(config: StoryRpcStoredConfig): void {
  if (typeof window === "undefined") return
  const normalized: StoryRpcStoredConfig = {
    ...defaultStored(),
    ...config,
    v: STORAGE_VERSION,
  }
  const empty =
    normalized.url === null &&
    normalized.authPreset === "none" &&
    !normalized.authHeaderName?.trim() &&
    !normalized.authSecret?.trim()
  if (empty) {
    localStorage.removeItem(STORY_RPC_OVERRIDE_STORAGE_KEY)
    return
  }
  localStorage.setItem(STORY_RPC_OVERRIDE_STORAGE_KEY, JSON.stringify(normalized))
}

export function parseStoryRpcOverride(raw: string | null | undefined): string | null {
  if (raw == null) return null
  const t = raw.trim()
  if (!t) return null
  try {
    const u = new URL(t)
    if (u.protocol !== "http:" && u.protocol !== "https:") return null
    return u.href.replace(/\/$/, "")
  } catch {
    return null
  }
}

/** @deprecated use readStoryRpcStored */
export function readStoryRpcOverride(): string | null {
  return readStoryRpcStored().url
}

/** @deprecated use writeStoryRpcStored */
export function writeStoryRpcOverride(url: string | null): void {
  const cur = readStoryRpcStored()
  writeStoryRpcStored({ ...cur, url: url ? parseStoryRpcOverride(url) : null })
}

export function getEffectiveStoryRpcUrl(): string {
  return readStoryRpcStored().url ?? env.NEXT_PUBLIC_JSON_RPC_URL
}

export function hasStoryRpcOverride(): boolean {
  const s = readStoryRpcStored()
  if (s.url !== null) return true
  if (s.authPreset === "none") return false
  return Boolean(s.authSecret.trim())
}

/** Extra fetch headers for JSON-RPC (auth). Omits Content-Type; callers merge. */
export function getStoryRpcAuthHeaders(): Record<string, string> {
  return buildAuthHeaders(readStoryRpcStored())
}

export function buildAuthHeaders(s: StoryRpcStoredConfig): Record<string, string> {
  const secret = s.authSecret.trim()
  if (!secret || s.authPreset === "none") return {}

  switch (s.authPreset) {
    case "bearer":
      return {
        Authorization: secret.startsWith("Bearer ") ? secret : `Bearer ${secret}`,
      }
    case "x-api-key":
      return { "X-API-Key": secret }
    case "custom": {
      const name = s.authHeaderName.trim()
      if (!name) return {}
      return { [name]: secret }
    }
    default:
      return {}
  }
}

export function notifyStoryRpcChanged(): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(STORY_RPC_CHANGED_EVENT))
}

export interface StoryRpcProbeResult {
  chainId: bigint
  blockNumberHex: string
}

const PROBE_TIMEOUT_MS = 15_000

function mergeJsonRpcHeaders(auth: Record<string, string>): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...auth,
  }
}

/**
 * Lightweight JSON-RPC probe (eth_chainId + eth_blockNumber). Runs in the browser; may fail if the RPC blocks CORS.
 */
export async function probeStoryRpc(httpUrl: string, authHeaders: Record<string, string> = {}): Promise<StoryRpcProbeResult> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS)

  const post = async (method: string, params: unknown[]): Promise<string> => {
    const res = await fetch(httpUrl, {
      method: "POST",
      headers: mergeJsonRpcHeaders(authHeaders),
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      signal: controller.signal,
    })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }
    const json: { error?: { message?: string }; result?: string } = await res.json()
    if (json.error) {
      throw new Error(typeof json.error.message === "string" ? json.error.message : "RPC error")
    }
    if (json.result === undefined) {
      throw new Error("Invalid RPC response")
    }
    return json.result
  }

  try {
    const chainHex = await post("eth_chainId", [])
    const blockHex = await post("eth_blockNumber", [])
    return {
      chainId: BigInt(chainHex),
      blockNumberHex: blockHex,
    }
  } finally {
    window.clearTimeout(timeoutId)
  }
}
