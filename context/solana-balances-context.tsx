"use client"

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { isSolanaWallet } from "@dynamic-labs/solana"
import { type Commitment, PublicKey } from "@solana/web3.js"
import { SOLANA_USDC_ADDRESS } from "@/config/relay-chains"
import { useEmbeddedWallets } from "@/hooks/use-embedded-wallets"

const POLL_INTERVAL_MS = 30_000
/** Read at processed commitment so UI updates right after txs (confirmed/finalized can lag on public RPCs). */
const READ_COMMITMENT: Commitment = "processed"

export interface SolanaBalanceSnapshot {
  solLamports: bigint
  solanaUsdcRaw: bigint
}

interface SolanaBalancesContextType {
  /** SOL balance as a float (e.g. 0.5 SOL) */
  solBalance: number
  /** SOL balance in lamports */
  solLamports: bigint
  /** Solana USDC balance in raw token units (6 decimals) */
  solanaUsdcRaw: bigint
  /** Solana USDC balance as a float */
  solanaUsdc: number
  /** Whether the initial fetch is still in progress */
  isLoading: boolean
  /** Refetch both balances immediately (call after transactions). Returns fresh values for same-tick reads. */
  refetch: () => Promise<SolanaBalanceSnapshot>
}

const SolanaBalancesContext = createContext<SolanaBalancesContextType | undefined>(undefined)

const SOL_DECIMALS = 9
const USDC_DECIMALS = 6

export function SolanaBalancesProvider({ children }: { children: ReactNode }) {
  const { solanaWallet, solanaAddress } = useEmbeddedWallets()

  const [solBalance, setSolBalance] = useState(0)
  const [solLamports, setSolLamports] = useState(BigInt(0))
  const [solanaUsdcRaw, setSolanaUsdcRaw] = useState(BigInt(0))
  const [isLoading, setIsLoading] = useState(false)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchBalances = useCallback(async (): Promise<SolanaBalanceSnapshot> => {
    if (!solanaWallet || !solanaAddress || !isSolanaWallet(solanaWallet)) {
      setSolBalance(0)
      setSolLamports(BigInt(0))
      setSolanaUsdcRaw(BigInt(0))
      return { solLamports: BigInt(0), solanaUsdcRaw: BigInt(0) }
    }

    try {
      const connection = await solanaWallet.getConnection()
      const owner = new PublicKey(solanaAddress)

      const [lamports, tokenResult] = await Promise.all([
        connection.getBalance(owner, READ_COMMITMENT),
        connection.getParsedTokenAccountsByOwner(
          owner,
          { mint: new PublicKey(SOLANA_USDC_ADDRESS) },
          READ_COMMITMENT
        ),
      ])

      const nextLamports = BigInt(lamports)
      const rawAmount =
        tokenResult?.value?.[0]?.account?.data?.parsed?.info?.tokenAmount?.amount ?? "0"
      const nextUsdc = BigInt(rawAmount)

      setSolLamports(nextLamports)
      setSolBalance(lamports / 10 ** SOL_DECIMALS)
      setSolanaUsdcRaw(nextUsdc)

      return { solLamports: nextLamports, solanaUsdcRaw: nextUsdc }
    } catch {
      setSolBalance(0)
      setSolLamports(BigInt(0))
      setSolanaUsdcRaw(BigInt(0))
      return { solLamports: BigInt(0), solanaUsdcRaw: BigInt(0) }
    }
  }, [solanaWallet, solanaAddress])

  useEffect(() => {
    if (!solanaWallet || !solanaAddress || !isSolanaWallet(solanaWallet)) {
      setSolBalance(0)
      setSolLamports(BigInt(0))
      setSolanaUsdcRaw(BigInt(0))
      return
    }

    setIsLoading(true)
    fetchBalances().finally(() => setIsLoading(false))

    intervalRef.current = setInterval(fetchBalances, POLL_INTERVAL_MS)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchBalances, solanaWallet, solanaAddress])

  const refetch = useCallback(async () => fetchBalances(), [fetchBalances])

  const value = useMemo(() => {
    const solanaUsdc = Number(solanaUsdcRaw) / 10 ** USDC_DECIMALS
    return { solBalance, solLamports, solanaUsdcRaw, solanaUsdc, isLoading, refetch }
  }, [solBalance, solLamports, solanaUsdcRaw, isLoading, refetch])

  return (
    <SolanaBalancesContext.Provider value={value}>
      {children}
    </SolanaBalancesContext.Provider>
  )
}

export function useSolanaBalances() {
  const context = useContext(SolanaBalancesContext)
  if (context === undefined) {
    throw new Error("useSolanaBalances must be used within a SolanaBalancesProvider")
  }
  return context
}
