/**
 * Retry utilities for handling API failures with exponential backoff
 * Used across IP and token pages to prevent false redirects on temporary API issues
 */

export interface RetryOptions {
  maxAttempts?: number
  baseDelay?: number
  maxDelay?: number
  shouldRetry?: (error: Error, attempt: number) => boolean
}

export interface RetryResult<T> {
  data: T | null
  error: Error | null
  attempts: number
}

/**
 * Default retry configuration matching existing patterns in the codebase
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 4000, // 4 seconds max delay
  shouldRetry: (error: Error, attempt: number) => {
    // Don't retry on final attempt
    if (attempt >= 3) return false

    // Check if it's a fetch error with status
    const errorMessage = error.message.toLowerCase()

    // Don't retry on 4xx errors (except 408 timeout, 429 rate limit)
    if (
      errorMessage.includes("400") ||
      errorMessage.includes("401") ||
      errorMessage.includes("403") ||
      errorMessage.includes("404") ||
      errorMessage.includes("410")
    ) {
      return false
    }

    // Retry on 5xx errors, network failures, timeouts, rate limits
    if (
      errorMessage.includes("5") ||
      errorMessage.includes("network") ||
      errorMessage.includes("timeout") ||
      errorMessage.includes("408") ||
      errorMessage.includes("429") ||
      errorMessage.includes("fetch")
    ) {
      console.log("should retry", error)
      return true
    }

    // Default to retry for unknown errors (could be network issues)
    console.log("default to retry", error)
    return true
  },
}

/**
 * Calculate exponential backoff delay with jitter
 */
export function calculateRetryDelay(attempt: number, baseDelay: number, maxDelay: number): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt - 1)
  const delayWithJitter = exponentialDelay + Math.random() * 1000 // Add up to 1s jitter
  return Math.min(delayWithJitter, maxDelay)
}

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Retry an async function with exponential backoff
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<RetryResult<T>> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options }
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      const data = await fn()
      return { data, error: null, attempts: attempt }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Check if we should retry
      if (!config.shouldRetry(lastError, attempt)) {
        break
      }

      // Don't delay after the last attempt
      if (attempt < config.maxAttempts) {
        const delay = calculateRetryDelay(attempt, config.baseDelay, config.maxDelay)
        await sleep(delay)
      }
    }
  }

  return { data: null, error: lastError, attempts: config.maxAttempts }
}

/**
 * Enhanced fetch with retry logic
 */
export async function fetchWithRetry(url: string, init?: RequestInit, options: RetryOptions = {}): Promise<Response> {
  const result = await withRetry(async () => {
    const response = await fetch(url, init)

    // Throw error for non-ok responses to trigger retry logic
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response
  }, options)

  if (result.error) {
    throw result.error
  }

  return result.data!
}

/**
 * Check if an error should trigger a retry (used by components)
 */
export function shouldRetryError(error: Error): boolean {
  return DEFAULT_RETRY_OPTIONS.shouldRetry(error, 1)
}
