import { type Chain, http, webSocket, fallback } from "viem"
import { createConfig } from "wagmi"
import { env } from "@/config"

export function createStoryChain(httpRpcUrl: string): Chain {
  return {
    id: env.NEXT_PUBLIC_CHAIN_ID,
    nativeCurrency: { name: "IP", symbol: "IP", decimals: 18 },
    name: env.NEXT_PUBLIC_CHAIN_NAME,
    rpcUrls: {
      default: {
        http: [httpRpcUrl],
      },
    },
    blockExplorers: {
      default: {
        name: "Explorer",
        url: env.NEXT_PUBLIC_EXPLORER_URL,
      },
    },
    testnet: env.NEXT_PUBLIC_ENVIRONMENT === "development" ? true : false,
  }
}

/** Static chain/RPC from env — server-side and tests */
export const chainConfig = createStoryChain(env.NEXT_PUBLIC_JSON_RPC_URL)

export function buildEvmNetworks(primaryHttpRpcUrl: string, includeEnvFallbackRpc: boolean) {
  const rpcUrls = [
    primaryHttpRpcUrl,
    ...(includeEnvFallbackRpc && env.NEXT_PUBLIC_JSON_RPC_URL_FALLBACK ? [env.NEXT_PUBLIC_JSON_RPC_URL_FALLBACK] : []),
  ]
  return [
    {
      blockExplorerUrls: [env.NEXT_PUBLIC_EXPLORER_URL],
      chainId: env.NEXT_PUBLIC_CHAIN_ID,
      chainName: env.NEXT_PUBLIC_CHAIN_NAME,
      iconUrls: ["https://app.dynamic.xyz/assets/networks/eth.svg"],
      name: env.NEXT_PUBLIC_CHAIN_NAME,
      nativeCurrency: {
        decimals: 18,
        name: "Story",
        symbol: "IP",
        iconUrl: "https://app.dynamic.xyz/assets/networks/eth.svg",
      },
      networkId: env.NEXT_PUBLIC_CHAIN_ID,
      rpcUrls,
      vanityName: env.NEXT_PUBLIC_CHAIN_NAME,
    },
  ]
}

/**
 * @param primaryAuthHeaders - Optional JSON-RPC auth headers for the primary URL only (not applied to env fallback).
 * When non-empty, WebSocket transport is skipped for the primary endpoint because browser WS cannot attach headers reliably.
 */
export function createAppWagmiConfig(
  primaryHttpRpcUrl: string,
  includeEnvFallbackTransport: boolean,
  primaryAuthHeaders: Record<string, string> = {},
) {
  const chain = createStoryChain(primaryHttpRpcUrl)
  const wsRpcUrl = primaryHttpRpcUrl.replace(/^https?:\/\//, "wss://")
  const hasPrimaryAuth = Object.keys(primaryAuthHeaders).length > 0

  const primaryHttp = hasPrimaryAuth
    ? http(primaryHttpRpcUrl, {
        fetchOptions: {
          headers: primaryAuthHeaders,
        },
      })
    : http(primaryHttpRpcUrl)

  const transportList = hasPrimaryAuth
    ? [
        primaryHttp,
        ...(includeEnvFallbackTransport && env.NEXT_PUBLIC_JSON_RPC_URL_FALLBACK
          ? [http(env.NEXT_PUBLIC_JSON_RPC_URL_FALLBACK)]
          : []),
      ]
    : [
        webSocket(wsRpcUrl),
        http(primaryHttpRpcUrl),
        ...(includeEnvFallbackTransport && env.NEXT_PUBLIC_JSON_RPC_URL_FALLBACK
          ? [http(env.NEXT_PUBLIC_JSON_RPC_URL_FALLBACK)]
          : []),
      ]

  return createConfig({
    multiInjectedProviderDiscovery: false,
    chains: [chain],
    pollingInterval: 1_000,
    transports: {
      [chain.id]: fallback(transportList),
    },
    ssr: true,
  })
}

export const config = createAppWagmiConfig(env.NEXT_PUBLIC_JSON_RPC_URL, !!env.NEXT_PUBLIC_JSON_RPC_URL_FALLBACK)

export const evmNetworks = buildEvmNetworks(env.NEXT_PUBLIC_JSON_RPC_URL, !!env.NEXT_PUBLIC_JSON_RPC_URL_FALLBACK)
