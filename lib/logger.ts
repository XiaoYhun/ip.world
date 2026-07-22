import { env } from "@/config"

export function createContext(
  action: string,
  filename: string,
  additionalContext: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    filename,
    action,
    ...additionalContext,
  }
}

// Simple console-based logger to avoid pino bundling issues
const isDev = env.NEXT_PUBLIC_ENVIRONMENT !== "production"
const shouldLog = (level: string) => {
  if (!isDev && level === "debug") return false
  return true
}

export const logger = {
  info: (obj: Record<string, unknown> | string, msg?: string) => {
    if (!shouldLog("info")) return
    if (typeof obj === "string") {
      console.log(`[INFO]`, obj)
    } else {
      console.log(`[INFO]`, msg || "", obj)
    }
  },
  error: (obj: Record<string, unknown> | string, msg?: string) => {
    if (!shouldLog("error")) return
    if (typeof obj === "string") {
      console.error(`[ERROR]`, obj)
    } else {
      console.error(`[ERROR]`, msg || "", obj)
    }
  },
  warn: (obj: Record<string, unknown> | string, msg?: string) => {
    if (!shouldLog("warn")) return
    if (typeof obj === "string") {
      console.warn(`[WARN]`, obj)
    } else {
      console.warn(`[WARN]`, msg || "", obj)
    }
  },
  debug: (obj: Record<string, unknown> | string, msg?: string) => {
    if (!shouldLog("debug")) return
    if (typeof obj === "string") {
      console.debug(`[DEBUG]`, obj)
    } else {
      console.debug(`[DEBUG]`, msg || "", obj)
    }
  },
}
