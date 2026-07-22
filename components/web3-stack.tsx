"use client"

import { useEffect, useMemo, useState } from "react"
import { WagmiProvider } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ZeroDevSmartWalletConnectors } from "@dynamic-labs/ethereum-aa"
import { SolanaWalletConnectorsWithConfig } from "@dynamic-labs/solana"
import {
  STORY_RPC_CHANGED_EVENT,
  STORY_RPC_OVERRIDE_STORAGE_KEY,
  getEffectiveStoryRpcUrl,
  getStoryRpcAuthHeaders,
  hasStoryRpcOverride,
} from "@/lib/story-rpc-override"
import { buildEvmNetworks, createAppWagmiConfig } from "@/lib/client/wagmi"
import { rpcManager } from "@/lib/web3/rpc-manager"
import { env } from "@/config"
import { DynamicContextProvider, DynamicWagmiConnector, EthereumWalletConnectors } from "@/lib/dynamic"
import { NavigationProvider } from "@/context/navigation-context"
import { SolanaBalancesProvider } from "@/context/solana-balances-context"
import { OnboardingProvider } from "@/context/onboarding-context"
import { EmbeddedWalletMigrator } from "./embedded-wallet-migrator"
import { EmbeddedWalletPrewarmer } from "./embedded-wallet-prewarmer"
import { EmbeddedWalletProvisioner } from "./embedded-wallet-provisioner"
import { UserAutoCreator } from "./user-auto-creator"
import { DynamicErrorInterceptor } from "./dynamic-error-interceptor"
import { clearEmbeddedWalletClientCache } from "@/hooks/use-embedded-evm-wallet-client"

type Wallet = {
  key: string
  name: string
  isInstalledOnBrowser: boolean
  walletConnector: unknown
  chainGroup?: string
  group?: string
  injectedConfig?: Record<string, unknown>[]
  walletGroup?: string
}

interface Web3StackProps {
  children: React.ReactNode
  queryClient: QueryClient
  environmentId: string
  customWalletFilter: (wallets: Wallet[]) => Wallet[]
}

export function Web3Stack({
  children,
  queryClient,
  environmentId,
  customWalletFilter,
}: Web3StackProps) {
  const [rpcEpoch, setRpcEpoch] = useState(0)

  const { effectiveRpc, includeEnvFallback } = useMemo(() => {
    void rpcEpoch
    const effective = getEffectiveStoryRpcUrl()
    const overrideOn = hasStoryRpcOverride()
    const includeFallback = !overrideOn && !!env.NEXT_PUBLIC_JSON_RPC_URL_FALLBACK
    return { effectiveRpc: effective, includeEnvFallback: includeFallback }
  }, [rpcEpoch])

  useEffect(() => {
    rpcManager.configure(
      effectiveRpc,
      includeEnvFallback ? (env.NEXT_PUBLIC_JSON_RPC_URL_FALLBACK ?? null) : null,
      getStoryRpcAuthHeaders(),
    )
    clearEmbeddedWalletClientCache()
  }, [effectiveRpc, includeEnvFallback, rpcEpoch])

  useEffect(() => {
    const bump = () => setRpcEpoch((n) => n + 1)
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORY_RPC_OVERRIDE_STORAGE_KEY || e.key === null) bump()
    }
    window.addEventListener("storage", onStorage)
    window.addEventListener(STORY_RPC_CHANGED_EVENT, bump)
    return () => {
      window.removeEventListener("storage", onStorage)
      window.removeEventListener(STORY_RPC_CHANGED_EVENT, bump)
    }
  }, [])

  const wagmiConfig = useMemo(
    () => createAppWagmiConfig(effectiveRpc, includeEnvFallback, getStoryRpcAuthHeaders()),
    // rpcEpoch: auth-only changes still need a new wagmi config (getStoryRpcAuthHeaders reads storage)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional rpcEpoch subscription
    [effectiveRpc, includeEnvFallback, rpcEpoch],
  )

  const evmNetworks = useMemo(
    () => buildEvmNetworks(effectiveRpc, includeEnvFallback),
    [effectiveRpc, includeEnvFallback],
  )

  return (
    <DynamicContextProvider
      settings={{
        environmentId: environmentId || "",
        walletConnectors: [
          EthereumWalletConnectors,
          ZeroDevSmartWalletConnectors,
          SolanaWalletConnectorsWithConfig({
            ...(env.NEXT_PUBLIC_SOLANA_RPC_URL
              ? { customRpcUrls: { solana: [env.NEXT_PUBLIC_SOLANA_RPC_URL] } }
              : {}),
          }),
        ],
        recommendedWallets: [{ walletKey: "metamask" }, { walletKey: "phantom" }, { walletKey: "rabby" }],
        overrides: {
          evmNetworks,
          onrampOptions: (defaultOnrampOptions) => defaultOnrampOptions,
          views: [
            {
              type: "login",
              sections: [
                { type: "social" },
                { type: "separator", label: "Or" },
                { type: "email" },
                { type: "separator", label: "Or" },
                { type: "wallet" },
              ],
            },
          ] as Parameters<typeof DynamicContextProvider>[0]["settings"]["overrides"] extends { views?: infer V }
            ? V
            : never,
        },
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        walletsFilter: customWalletFilter as unknown as typeof customWalletFilter,
        events: {
          onAuthSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["user"] })
          },
        },
        cssOverrides: `
            .modal-card {
              background: black !important;
            }
            .dynamic-footer {
              display: none;
            }

            div[data-testid="sandbox-indicator"] {
              display: none !important;
            }

            .input {
              background: #0D0D0D !important;
            }

            .login-with-email-wallet-list__container {
              gap: 0;
              border: 1px solid #2e2e33;
              background: #0D0D0D;
              border-radius: 4px;
            }

            .social-sign-in--tile {
              background: #0D0D0D !important;
            }
            .login-with-email-wallet-list__container .wallet-list-item__tile:first-child {
              border-radius: 8px 8px 0px 0px; 
            }
              .login-with-email-wallet-list__container .list-item-button {
              border-radius: 0px 0px 8px 8px !important; 
            }
            .wallet-list-item__tile {
              border-radius: 0px;
              background: transparent;
              border-bottom: 1px solid #2e2e33;
            }
            .wallet-list-item__tile:hover {
              border-bottom: 1px solid #2e2e33 !important;
            }
            .list-item-button {
              border-radius: 0px;
            }

            .input__container .input {
              background: transparent;
              border-bottom: 1px solid #2e2e33;
            }

            .list-tile {
              background: transparent;
              border: 1px solid #2e2e33;
            }
            .list-tile:hover {
              border: 1px solid #2e2e33 !important;
            }
            .button:disabled:not(.button--loading) {
              background: transparent;
              opacity: 50%;
            }
            .login-with-email-wallet-list__container {
              border: 0px;
            }

            img[data-testid="wallet-icon-bitgetwallet"] {
              content: url("/images/bitget.webp") !important;
              background: transparent !important;
              border-radius: 6px !important;
              padding: 2px !important;
              object-fit: contain !important;
            }
          `,
      }}
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <DynamicWagmiConnector>
            <NavigationProvider>
              <SolanaBalancesProvider>
                <OnboardingProvider>
                  {children}
                  <EmbeddedWalletProvisioner />
                  <EmbeddedWalletPrewarmer />
                  <DynamicErrorInterceptor />
                  <EmbeddedWalletMigrator />
                  <UserAutoCreator />
                </OnboardingProvider>
              </SolanaBalancesProvider>
            </NavigationProvider>
          </DynamicWagmiConnector>
        </QueryClientProvider>
      </WagmiProvider>
    </DynamicContextProvider>
  )
}
