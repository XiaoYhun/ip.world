"use client"

import { motion } from "framer-motion"
import { gsap } from "gsap"
import { useEffect, useRef, useState } from "react"
import { BeautifulQRCode } from "@beautiful-qr-code/react"
import { useUserWallets } from "@dynamic-labs/sdk-react-core"
import { useEmbeddedWallets } from "@/hooks/use-embedded-wallets"
import Copy from "@/components/copy"

interface OnboardingStartTradingProps {
  currentStep: number
  totalSteps: number
  isReturningUser?: boolean
  onBack: () => void
  onFinish: () => void
  isHallidayModalOpen: boolean
  setIsHallidayModalOpen: (open: boolean) => void
}

type NetworkTab = "ip" | "solana"

function truncateAddress(address: string): string {
  if (!address || address.length < 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function OnboardingStartTrading({
  currentStep,
  totalSteps,
  isReturningUser,
  onBack,
  onFinish,
  isHallidayModalOpen,
  setIsHallidayModalOpen
}: OnboardingStartTradingProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { evmAddress, solanaAddress } = useEmbeddedWallets()
  const userWallets = useUserWallets()
  const hasExternalWallet = userWallets.some(
    (w) => !w.connector?.isEmbeddedWallet && w.address?.startsWith("0x")
  )
  const [activeTab, setActiveTab] = useState<NetworkTab>("ip")

  const walletAddress = activeTab === "ip"
    ? (evmAddress ?? "")
    : (solanaAddress ?? "")
  const addressPlaceholder = activeTab === "ip" ? "0x0000...0000" : "Loading..."
  const displayAddress = walletAddress || addressPlaceholder

  // Animate blur on mount
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    gsap.set(container, { filter: "blur(30px)" })
    gsap.to(container, {
      filter: "blur(0px)",
      duration: 1.2,
      ease: "power2.out",
    })
  }, [])

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full max-w-[380px] flex-col items-center justify-center px-4"
    >
      {/* Header */}
      <motion.div
        className="mb-9 flex flex-col items-center gap-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <h1 className="font-archivo text-center text-2xl leading-[0.95] font-semibold text-white">
          Start trading
        </h1>
        <p className="font-archivo text-center text-base leading-[0.95] font-normal text-neutral-200">
          {isReturningUser && hasExternalWallet
            ? "We now use in-app wallets — use these instead of external wallets"
            : "Top up your wallet balance to start trading"}
        </p>
      </motion.div>

      <motion.div
        className="flex w-full max-w-[400px] flex-col gap-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        {/* Network Tab Selector */}
        <div className="flex items-center gap-2 rounded-[12px] border border-[#313131] bg-[rgba(25,25,25,0.5)] p-2">
          <button
            onClick={() => setActiveTab("ip")}
            className={`flex flex-1 items-center justify-center rounded-[10px] px-4 py-3 text-base font-semibold transition-all ${activeTab === "ip"
              ? "bg-[#C093FF] text-[#321F4D]"
              : "bg-transparent text-neutral-400 hover:text-neutral-200"
              }`}
          >
            Story
          </button>
          <button
            onClick={() => setActiveTab("solana")}
            className={`flex flex-1 items-center justify-center rounded-[10px] px-4 py-3 text-base font-medium transition-all ${activeTab === "solana"
              ? "bg-[#C093FF] text-[#321F4D] font-semibold"
              : "bg-transparent text-neutral-400 hover:text-neutral-200"
              }`}
          >
            Solana
          </button>
        </div>

        {/* QR Code & Info Area */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-[169px] w-[169px] items-center justify-center overflow-hidden rounded-2xl border border-[#313131] bg-[#191919]">
            {walletAddress ? (
              <BeautifulQRCode
                data={walletAddress}
                foregroundColor="#ffffff"
                backgroundColor="#191919"
                radius={2}
                className="size-[160px]"
              />
            ) : (
              <span className="text-center text-xs text-neutral-500 px-4">
                Wallet is being set up...
              </span>
            )}
          </div>

          {/* Instructional Text */}
          <p className="text-center text-sm leading-[1.4] text-neutral-200 font-medium">
            {activeTab === "ip"
              ? "Send $IP or $USDC to your Story wallet to start trading"
              : "Send $SOL or $USDC to your Solana wallet to start trading"}
          </p>
        </div>

        {/* Wallet Address */}
        <div className="w-fit flex items-center self-center gap-2 justify-between rounded-[12px] border bg-[rgba(57,57,57,0.5)] px-4 py-3">
          <span className="font-mono text-sm text-neutral-200">
            {truncateAddress(displayAddress)}
          </span>
          {walletAddress && (
            <Copy
              copy={walletAddress}
              size={14}
              className="text-neutral-200 hover:text-white"
            />
          )}
        </div>

        {/* Buy Instead Button */}
        <motion.button
          className="flex items-center gap-3 rounded-full border border-[#313131]/50 bg-[#191919]/80 px-3 py-3 shadow-[0px_2px_12px_0px_rgba(0,0,0,0.2)] backdrop-blur-[10px] transition-all hover:border-[#313131] hover:bg-[#191919] w-full"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setIsHallidayModalOpen(true)}
        >
          {/* Icon */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#313131]/50 bg-[#191919] shadow-[0px_2px_12px_0px_rgba(0,0,0,0.2)] backdrop-blur-[10px]">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M1.66667 1.66699C0.746192 1.66699 0 2.41318 0 3.33366V5.00033H20V3.33366C20 2.41318 19.2538 1.66699 18.3333 1.66699H1.66667ZM20 7.50033H0V16.667C0 17.5875 0.746193 18.3337 1.66667 18.3337H18.3333C19.2538 18.3337 20 17.5875 20 16.667V7.50033ZM10 11.667H2.5V10.0003H10V11.667ZM2.5 15.8337H7.5V14.167H2.5V15.8337ZM17.5 11.667H14.1667V10.0003H17.5V11.667Z" fill="#C093FF" />
            </svg>
          </div>

          {/* Text */}
          <div className="flex flex-1 flex-col items-start gap-0.5">
            <span className="text-sm font-medium text-white leading-none">Purchase tokens directly instead</span>
            <span className="text-sm text-[#797979] leading-[1.04]">Buy coins with credit or debit card</span>
          </div>

          {/* Chevron */}
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className="shrink-0 text-neutral-500"
          >
            <path
              d="M5.25 2.625L9.625 7L5.25 11.375"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.button>
      </motion.div>
    </div>
  )
}
