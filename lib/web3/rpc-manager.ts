import { createPublicClient, http, type PublicClient, type Chain } from "viem"
import { createStoryChain } from "@/lib/client/wagmi"
import { env } from "@/config"

const FAILURE_THRESHOLD = 3
const HEALTH_WINDOW_MS = 30_000

interface RpcHealth {
  failures: number
  lastFailureAt: number
}

class RpcManager {
  private primaryClient: PublicClient
  private fallbackClient: PublicClient | null
  private primaryUrl: string
  private fallbackUrl: string | null
  private chain: Chain
  private primaryHealth: RpcHealth = { failures: 0, lastFailureAt: 0 }
  private fallbackHealth: RpcHealth = { failures: 0, lastFailureAt: 0 }

  constructor() {
    this.primaryUrl = env.NEXT_PUBLIC_JSON_RPC_URL
    this.chain = createStoryChain(this.primaryUrl)
    this.primaryClient = createPublicClient({
      chain: this.chain,
      transport: http(this.primaryUrl),
    })

    this.fallbackUrl = env.NEXT_PUBLIC_JSON_RPC_URL_FALLBACK ?? null
    this.fallbackClient = this.fallbackUrl
      ? createPublicClient({
          chain: this.chain,
          transport: http(this.fallbackUrl),
        })
      : null
  }

  /**
   * Re-point RPC clients after Story RPC override changes (browser).
   * Resets health counters for the new endpoints.
   */
  configure(primaryUrl: string, fallbackUrl: string | null, primaryAuthHeaders?: Record<string, string>): void {
    this.primaryUrl = primaryUrl
    this.fallbackUrl = fallbackUrl
    this.chain = createStoryChain(primaryUrl)
    const headers = primaryAuthHeaders && Object.keys(primaryAuthHeaders).length > 0 ? primaryAuthHeaders : undefined
    this.primaryClient = createPublicClient({
      chain: this.chain,
      transport: headers
        ? http(primaryUrl, {
            fetchOptions: { headers },
          })
        : http(primaryUrl),
    })
    this.primaryHealth = { failures: 0, lastFailureAt: 0 }

    this.fallbackClient = fallbackUrl
      ? createPublicClient({
          chain: this.chain,
          transport: http(fallbackUrl),
        })
      : null
    this.fallbackHealth = { failures: 0, lastFailureAt: 0 }
  }

  getPrimaryClient(): PublicClient {
    return this.primaryClient
  }

  getFallbackClient(): PublicClient | null {
    return this.fallbackClient
  }

  /**
   * Returns the primary client if healthy, otherwise the fallback.
   * Falls back to primary if both are unhealthy or no fallback exists.
   */
  getHealthyClient(): PublicClient {
    if (this.isHealthy(this.primaryHealth)) {
      return this.primaryClient
    }
    if (this.fallbackClient && this.isHealthy(this.fallbackHealth)) {
      return this.fallbackClient
    }
    return this.primaryClient
  }

  /**
   * Returns [primary, fallback] in priority order for broadcast attempts.
   * If primary is unhealthy, fallback comes first.
   */
  getClientsInPriorityOrder(): PublicClient[] {
    const clients: PublicClient[] = []

    if (this.isHealthy(this.primaryHealth)) {
      clients.push(this.primaryClient)
      if (this.fallbackClient) clients.push(this.fallbackClient)
    } else if (this.fallbackClient) {
      clients.push(this.fallbackClient)
      clients.push(this.primaryClient)
    } else {
      clients.push(this.primaryClient)
    }

    return clients
  }

  recordSuccess(client: PublicClient): void {
    const health = this.getHealthRef(client)
    if (health) {
      health.failures = 0
    }
  }

  recordFailure(client: PublicClient): void {
    const health = this.getHealthRef(client)
    if (health) {
      health.failures++
      health.lastFailureAt = Date.now()
    }
  }

  private isHealthy(health: RpcHealth): boolean {
    if (health.failures < FAILURE_THRESHOLD) return true
    // Reset after the health window expires
    if (Date.now() - health.lastFailureAt > HEALTH_WINDOW_MS) {
      health.failures = 0
      return true
    }
    return false
  }

  getLabel(client: PublicClient): string {
    if (client === this.primaryClient) return `primary (${this.primaryUrl})`
    if (client === this.fallbackClient) return `fallback (${this.fallbackUrl})`
    return "unknown"
  }

  private getHealthRef(client: PublicClient): RpcHealth | null {
    if (client === this.primaryClient) return this.primaryHealth
    if (client === this.fallbackClient) return this.fallbackHealth
    return null
  }
}

export const rpcManager = new RpcManager()
