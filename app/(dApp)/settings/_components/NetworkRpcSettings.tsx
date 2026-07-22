"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { env } from "@/config"
import {
  STORY_RPC_CHANGED_EVENT,
  type StoryRpcAuthPreset,
  buildAuthHeaders,
  getEffectiveStoryRpcUrl,
  notifyStoryRpcChanged,
  parseStoryRpcOverride,
  probeStoryRpc,
  readStoryRpcStored,
  writeStoryRpcStored,
} from "@/lib/story-rpc-override"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const DEFAULT_RPC = env.NEXT_PUBLIC_JSON_RPC_URL
const DEFAULT_RPC_PARSED = parseStoryRpcOverride(DEFAULT_RPC)
const EXPECTED_CHAIN_ID = BigInt(env.NEXT_PUBLIC_CHAIN_ID)

const PRESETS: { value: StoryRpcAuthPreset; label: string }[] = [
  { value: "none", label: "None" },
  { value: "bearer", label: "Bearer (Authorization)" },
  { value: "x-api-key", label: "X-API-Key" },
  { value: "custom", label: "Custom header" },
]

const inputClassName =
  "rounded-[10px] border border-neutral-600 bg-neutral-900 px-3 py-2.5 font-mono text-sm text-white placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"

function matchesDeployDefault(parsed: string): boolean {
  if (DEFAULT_RPC_PARSED !== null) return parsed === DEFAULT_RPC_PARSED
  return parsed.trim() === DEFAULT_RPC.trim()
}

const NetworkRpcSettings = () => {
  const [rpcUrl, setRpcUrl] = useState(DEFAULT_RPC)
  const [authPreset, setAuthPreset] = useState<StoryRpcAuthPreset>("none")
  const [authHeaderName, setAuthHeaderName] = useState("")
  const [authSecret, setAuthSecret] = useState("")
  const [isTesting, setIsTesting] = useState(false)

  const syncFromStorage = () => {
    const s = readStoryRpcStored()
    setRpcUrl(getEffectiveStoryRpcUrl())
    setAuthPreset(s.authPreset)
    setAuthHeaderName(s.authHeaderName)
    setAuthSecret(s.authSecret)
  }

  useEffect(() => {
    syncFromStorage()
  }, [])

  useEffect(() => {
    const onChange = () => syncFromStorage()
    window.addEventListener("storage", onChange)
    window.addEventListener(STORY_RPC_CHANGED_EVENT, onChange)
    return () => {
      window.removeEventListener("storage", onChange)
      window.removeEventListener(STORY_RPC_CHANGED_EVENT, onChange)
    }
  }, [])

  const validateAuth = (): boolean => {
    if (authPreset === "none") return true
    if (!authSecret.trim()) {
      toast.error("Enter an API key or token for the selected auth type")
      return false
    }
    if (authPreset === "custom" && !authHeaderName.trim()) {
      toast.error("Enter a custom header name")
      return false
    }
    return true
  }

  const apply = () => {
    if (!validateAuth()) return

    const trimmed = rpcUrl.trim()
    if (!trimmed) {
      writeStoryRpcStored({
        v: 2,
        url: null,
        authPreset,
        authHeaderName: authPreset === "custom" ? authHeaderName : "",
        authSecret: authPreset === "none" ? "" : authSecret,
      })
      notifyStoryRpcChanged()
      syncFromStorage()
      toast.success("Story RPC settings updated")
      return
    }

    const parsed = parseStoryRpcOverride(trimmed)
    if (!parsed) {
      toast.error("Enter a valid http(s) RPC URL")
      return
    }

    const url: string | null = matchesDeployDefault(parsed) ? null : parsed

    writeStoryRpcStored({
      v: 2,
      url,
      authPreset,
      authHeaderName: authPreset === "custom" ? authHeaderName : "",
      authSecret: authPreset === "none" ? "" : authSecret,
    })
    notifyStoryRpcChanged()
    syncFromStorage()
    toast.success("Story RPC settings updated")
  }

  const resetToDefault = () => {
    writeStoryRpcStored({
      v: 2,
      url: null,
      authPreset: "none",
      authHeaderName: "",
      authSecret: "",
    })
    notifyStoryRpcChanged()
    syncFromStorage()
    toast.success("Reset to default Story RPC")
  }

  const testRpc = async () => {
    if (!validateAuth()) return

    const trimmed = rpcUrl.trim()
    if (!trimmed) {
      toast.error("Enter an RPC URL to test")
      return
    }
    const parsed = parseStoryRpcOverride(trimmed)
    if (!parsed) {
      toast.error("Enter a valid http(s) RPC URL before testing")
      return
    }

    const headers = buildAuthHeaders({
      v: 2,
      url: parsed,
      authPreset,
      authHeaderName,
      authSecret,
    })

    setIsTesting(true)
    try {
      const { chainId, blockNumberHex } = await probeStoryRpc(parsed, headers)
      const chainOk = chainId === EXPECTED_CHAIN_ID
      const blockDec = BigInt(blockNumberHex).toString()
      if (chainOk) {
        toast.success(`RPC OK · chain ${chainId.toString()} · block ${blockDec}`)
      } else {
        toast.warning(
          `RPC responded but wrong chain: got ${chainId.toString()}, expected ${EXPECTED_CHAIN_ID.toString()} · block ${blockDec}`,
        )
      }
    } catch (e) {
      const aborted =
        (typeof DOMException !== "undefined" && e instanceof DOMException && e.name === "AbortError") ||
        (e instanceof Error && e.name === "AbortError")
      if (aborted) {
        toast.error("RPC test timed out")
      } else {
        const msg = e instanceof Error ? e.message : String(e)
        toast.error(`RPC test failed: ${msg}`)
      }
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-base font-medium">Story RPC</h1>
        <p className="text-xs text-neutral-400">
          Default RPC for Story in this browser. Many providers put the key in the URL; otherwise use optional auth below.
          Stored locally only.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs text-neutral-300">Default RPC</span>
        <input
          type="url"
          value={rpcUrl}
          onChange={(e) => setRpcUrl(e.target.value)}
          className={inputClassName}
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs text-neutral-300">RPC auth</span>
        <select
          value={authPreset}
          onChange={(e) => setAuthPreset(e.target.value as StoryRpcAuthPreset)}
          className={cn(inputClassName, "cursor-pointer appearance-none bg-neutral-900 pr-8")}
          aria-label="RPC authentication preset"
        >
          {PRESETS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {authPreset === "custom" && (
        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-300">Header name</span>
          <input
            type="text"
            value={authHeaderName}
            onChange={(e) => setAuthHeaderName(e.target.value)}
            className={inputClassName}
            placeholder="e.g. Authorization"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      )}

      {authPreset !== "none" && (
        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-300">
            {authPreset === "bearer" ? "Token or full Bearer value" : "API key / secret"}
          </span>
          <input
            type="password"
            value={authSecret}
            onChange={(e) => setAuthSecret(e.target.value)}
            className={inputClassName}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="primary" className="rounded-full px-5" onClick={apply} disabled={isTesting}>
          Apply
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-9 min-w-[7.25rem] shrink-0 rounded-full border-neutral-600 bg-transparent px-5 text-neutral-200 hover:bg-white/10 hover:text-white"
          onClick={testRpc}
          disabled={isTesting}
        >
          <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
            {isTesting ? (
              <>
                <Loader2 className="size-4 shrink-0 animate-spin" />
                Testing
              </>
            ) : (
              "Test RPC"
            )}
          </span>
        </Button>
        <Button type="button" variant="secondary" className="rounded-full px-5" onClick={resetToDefault} disabled={isTesting}>
          Reset to default
        </Button>
      </div>
    </div>
  )
}

export default NetworkRpcSettings
