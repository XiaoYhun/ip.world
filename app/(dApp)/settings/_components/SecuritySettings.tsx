"use client"

import { useState, useCallback } from "react"
import { useDynamicContext, useSmartWallets } from "@dynamic-labs/sdk-react-core"
import { useEmbeddedWallets } from "@/hooks/use-embedded-wallets"
import Copy from "@/components/copy"
import { Ip } from "@/components/icons/ip"
import { Solana } from "@/components/icons/solana"
import { RecoveryKeyModal } from "./RecoveryKeyModal"

const EVM_KEY_PLACEHOLDER =
  "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1bab4dff2"
const SOLANA_KEY_PLACEHOLDER =
  "5Kb8kLf9zgWQn0gJdH3Ux3s5aP6rVHKb3FTquwEBDs6TpsvC4Dq2r7VBkN7YpFe7Cx3e5aP6rVHKb3FTquwEe5aP6rVHKb3FTquwEe5aP6rVHKb3FTquwEe5aP6rVHKb3FTquchabwEe5"

const WalletRow = ({
  icon,
  label,
  address,
  className,
  onShowRecoveryKey,
}: {
  icon: React.ReactNode
  label: string
  address: string | undefined
  className?: string
  onShowRecoveryKey: () => void
}) => {
  return (
    <div
      className={`flex items-center justify-between bg-neutral-800 px-4 py-4 ${className ?? ""}`}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-neutral-100">{icon}</span>
          <span className="text-sm text-neutral-100">{label}</span>
        </div>
        <div className="flex items-center gap-1">
          {address ? (
            <>
              <span className="hidden font-mono text-xs text-neutral-400 lg:inline">{address}</span>
              <span className="font-mono text-xs text-neutral-400 lg:hidden">{`${address.slice(0, 6)}...${address.slice(-4)}`}</span>
            </>
          ) : (
            <span className="font-mono text-xs text-neutral-400">Not connected</span>
          )}
          {address && (
            <Copy
              copy={address}
              size={12}
              className="text-neutral-500"
              hideIcon={false}
            />
          )}
        </div>
      </div>
      <button
        onClick={onShowRecoveryKey}
        disabled={!address}
        className="shrink-0 rounded-[10px] border border-neutral-400 px-2 py-2.5 text-xs text-neutral-300 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        Show Recovery Key
      </button>
    </div>
  )
}

const SecuritySettings = () => {
  const { evmWallet, evmAddress, solanaWallet, solanaAddress } =
    useEmbeddedWallets()
  const { primaryWallet } = useDynamicContext()
  const { getEOAWallet } = useSmartWallets()

  const [modalOpen, setModalOpen] = useState(false)
  const [activeWallet, setActiveWallet] = useState<"ip" | "solana">("ip")

  const handleShowRecoveryKey = (wallet: "ip" | "solana") => {
    setActiveWallet(wallet)
    setModalOpen(true)
  }

  const handleRevealKey = useCallback(async (): Promise<string | boolean> => {
    const targetWallet = activeWallet === "ip" ? evmWallet : solanaWallet
    if (!targetWallet) return false

    const container = document.getElementById("recovery-key-container")
    if (!container) return false

    container.style.opacity = "1"
    container.style.pointerEvents = "auto"

    try {
      const rawWallet =
        primaryWallet && activeWallet === "ip"
          ? (getEOAWallet(primaryWallet) ?? targetWallet)
          : targetWallet

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const connector = rawWallet.connector as any

      const styleIframe = (iframe: HTMLIFrameElement) => {
        iframe.style.cssText =
          "width:100%;height:100%;border:none;display:block;"
      }

      const observer = new MutationObserver(() => {
        const iframe = container.querySelector("iframe")
        if (iframe) {
          styleIframe(iframe)
          observer.disconnect()
        }
      })
      observer.observe(container, { childList: true, subtree: true })

      const exportResult = await connector.exportPrivateKey({
        accountAddress: targetWallet.address,
        displayContainer: container,
      })

      observer.disconnect()
      const iframe = container.querySelector("iframe")
      if (iframe) styleIframe(iframe)

      if (typeof exportResult === "string" && exportResult.length > 0) {
        return exportResult
      }
      return true
    } catch (err) {
      console.error("Export failed:", err)
      return false
    }
  }, [activeWallet, evmWallet, solanaWallet, primaryWallet, getEOAWallet])

  return (
    <div className="flex w-full flex-col gap-5">
      <h1 className="text-base font-medium">Security Settings</h1>
      <div className="flex flex-col overflow-hidden rounded-[12px] border border-neutral-500">
        <WalletRow
          icon={<Ip size={14} />}
          label="Story Wallet"
          address={evmAddress}
          className="border-b border-neutral-500"
          onShowRecoveryKey={() => handleShowRecoveryKey("ip")}
        />
        <WalletRow
          icon={<span className="[&_path]:fill-neutral-200"><Solana size={14} /></span>}
          label="Solana Wallet"
          address={solanaAddress}
          onShowRecoveryKey={() => handleShowRecoveryKey("solana")}
        />
      </div>

      <RecoveryKeyModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        walletName={activeWallet === "ip" ? "IP" : "Solana"}
        walletIcon={
          activeWallet === "ip" ? <Ip size={20} /> : <span className="[&_path]:fill-neutral-200"><Solana size={20} /></span>
        }
        onRevealKey={handleRevealKey}
        keyPlaceholder={
          activeWallet === "ip" ? EVM_KEY_PLACEHOLDER : SOLANA_KEY_PLACEHOLDER
        }
      />
    </div>
  )
}

export default SecuritySettings
