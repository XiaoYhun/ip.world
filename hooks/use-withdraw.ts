"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { type Address, formatUnits } from "viem"
import { useEmbeddedSendTransaction } from "@/hooks/use-embedded-send-transaction"
import { useEmbeddedWriteContract } from "@/hooks/use-embedded-write-contract"
import { isSolanaWallet } from "@dynamic-labs/solana"
import { toast } from "sonner"
import {
  Transaction,
  TransactionInstruction,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js"
import {
  RELAY_SOLANA_CHAIN_ID,
  RELAY_STORY_CHAIN_ID,
  STORY_USDC_ADDRESS,
  SOLANA_USDC_ADDRESS,
  SOLANA_NATIVE_SOL_ADDRESS,
  NATIVE_CURRENCY_ADDRESS,
  isSolanaChain,
} from "@/config/relay-chains"
import { getRelayGeneralWithdrawQuote, pollRelayStatus } from "@/lib/relay"
import type { RelaySolanaInstruction } from "@/lib/relay"
import { useEmbeddedWallets } from "./use-embedded-wallets"
import { useEnsureEmbeddedWallet } from "./use-ensure-embedded-wallet"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const QUOTE_DEBOUNCE_MS = 600
const WITHDRAW_TOAST_ID = "withdraw-toast"

const STORY_GAS_RESERVE_WEI = BigInt("1000000000000000") // 0.001 IP
const SOLANA_GAS_RESERVE_LAMPORTS = BigInt(3_000_000) // 0.003 SOL

const ERC20_TRANSFER_ABI = [
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const

const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
)
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
)

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WithdrawStatus =
  | "idle"
  | "quoting"
  | "signing"
  | "sending"
  | "bridging"
  | "complete"
  | "error"

export type SourceChain = "Story" | "Solana"
export type WithdrawAsset = "IP" | "SOL" | "USDC"

export interface UseWithdrawParams {
  sourceChain: SourceChain
  asset: WithdrawAsset
  destinationChainId: number
  destinationAsset: WithdrawAsset
  amount: bigint
  destinationAddress: string
  enabled: boolean
}

export interface UseWithdrawReturn {
  status: WithdrawStatus
  error: string | null
  txHash: string | null
  execute: () => Promise<void>
  reset: () => void
  isQuoting: boolean
  quoteError: string | null
  receiveAmount: string
  receiveSymbol: string
  feeSummary: string | null
  timeEstimate: number | null
  isDirect: boolean
  gasReserve: bigint
}

const STATUS_LABELS: Record<WithdrawStatus, string> = {
  idle: "Withdraw",
  quoting: "Getting quote...",
  signing: "Sending...",
  sending: "Sending...",
  bridging: "Bridging...",
  complete: "Withdrawal successful",
  error: "Try Again",
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function isDirectTransfer(
  sourceChain: SourceChain,
  sourceAsset: WithdrawAsset,
  destinationChainId: number,
  destinationAsset: WithdrawAsset
): boolean {
  if (sourceAsset !== destinationAsset) return false
  if (sourceChain === "Story") return destinationChainId === RELAY_STORY_CHAIN_ID
  return destinationChainId === RELAY_SOLANA_CHAIN_ID
}

function isNativeAsset(sourceChain: SourceChain, asset: WithdrawAsset): boolean {
  return (sourceChain === "Story" && asset === "IP") || (sourceChain === "Solana" && asset === "SOL")
}

export function getGasReserve(sourceChain: SourceChain, asset: WithdrawAsset): bigint {
  if (sourceChain === "Story" && asset === "IP") return STORY_GAS_RESERVE_WEI
  if (sourceChain === "Solana" && asset === "SOL") return SOLANA_GAS_RESERVE_LAMPORTS
  return BigInt(0)
}

function getOriginChainId(sourceChain: SourceChain): number {
  return sourceChain === "Story" ? RELAY_STORY_CHAIN_ID : RELAY_SOLANA_CHAIN_ID
}

function getOriginCurrency(sourceChain: SourceChain, asset: WithdrawAsset): string {
  if (sourceChain === "Story") {
    return asset === "USDC" ? STORY_USDC_ADDRESS : NATIVE_CURRENCY_ADDRESS
  }
  return asset === "USDC" ? SOLANA_USDC_ADDRESS : SOLANA_NATIVE_SOL_ADDRESS
}

function getDestinationCurrency(
  destinationChainId: number,
  asset: WithdrawAsset
): string {
  if (asset === "IP") return NATIVE_CURRENCY_ADDRESS
  if (asset === "SOL") return SOLANA_NATIVE_SOL_ADDRESS
  if (isSolanaChain(destinationChainId)) return SOLANA_USDC_ADDRESS
  return STORY_USDC_ADDRESS
}

function getDecimalsForAsset(asset: WithdrawAsset): number {
  if (asset === "IP") return 18
  if (asset === "SOL") return 9
  return 6
}

function getAssociatedTokenAddress(owner: PublicKey, mint: PublicKey): PublicKey {
  const [ata] = PublicKey.findProgramAddressSync(
    [owner.toBytes(), TOKEN_PROGRAM_ID.toBytes(), mint.toBytes()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  )
  return ata
}

function buildSplTransferInstruction(
  sourceAta: PublicKey,
  destAta: PublicKey,
  owner: PublicKey,
  amount: bigint
): TransactionInstruction {
  const data = Buffer.alloc(9)
  data.writeUInt8(3, 0)
  data.writeBigUInt64LE(amount, 1)

  return new TransactionInstruction({
    keys: [
      { pubkey: sourceAta, isSigner: false, isWritable: true },
      { pubkey: destAta, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: true, isWritable: false },
    ],
    programId: TOKEN_PROGRAM_ID,
    data,
  })
}

function buildCreateAtaInstruction(
  payer: PublicKey,
  ata: PublicKey,
  owner: PublicKey,
  mint: PublicKey
): TransactionInstruction {
  return new TransactionInstruction({
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: ata, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: false, isWritable: false },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    data: Buffer.alloc(0),
  })
}

function parseErrorMessage(raw: string): string {
  if (raw.includes("user rejected") || raw.includes("User rejected")) {
    return "Transaction cancelled."
  }
  if (raw.includes("insufficient") || raw.includes("balance")) {
    return "Insufficient balance."
  }
  if (raw.includes("timed out")) {
    return "Transaction timed out. Your funds are safe — check your wallet."
  }
  if (raw.includes("Quote failed") || raw.includes("quote")) {
    return "Unable to get a quote. Try again."
  }
  if (raw.includes("refunded")) {
    return raw
  }
  return raw
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useWithdraw({
  sourceChain,
  asset,
  destinationChainId,
  destinationAsset,
  amount,
  destinationAddress,
  enabled,
}: UseWithdrawParams): UseWithdrawReturn {
  const [status, setStatus] = useState<WithdrawStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  // Quote state
  const [isQuoting, setIsQuoting] = useState(false)
  const [quoteError, setQuoteError] = useState<string | null>(null)
  const [receiveAmount, setReceiveAmount] = useState("")
  const [receiveSymbol, setReceiveSymbol] = useState("")
  const [feeSummary, setFeeSummary] = useState<string | null>(null)
  const [timeEstimate, setTimeEstimate] = useState<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const quoteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const quoteAbortRef = useRef<AbortController | null>(null)

  const { evmAddress, solanaWallet, solanaAddress } = useEmbeddedWallets()
  const { ensureEmbeddedWallet } = useEnsureEmbeddedWallet()
  const { sendTransactionAsync } = useEmbeddedSendTransaction()
  const { writeContractAsync } = useEmbeddedWriteContract()

  const direct = isDirectTransfer(sourceChain, asset, destinationChainId, destinationAsset)
  const gasReserve = getGasReserve(sourceChain, asset)

  // -----------------------------------------------------------------------
  // Debounced auto-quote
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (quoteTimerRef.current) clearTimeout(quoteTimerRef.current)
    quoteAbortRef.current?.abort()

    setReceiveAmount("")
    setReceiveSymbol("")
    setFeeSummary(null)
    setTimeEstimate(null)
    setQuoteError(null)
    if (amount <= BigInt(0)) {
      setIsQuoting(false)
      return
    }

    if (direct) {
      const decimals = getDecimalsForAsset(asset)
      setReceiveAmount(formatUnits(amount, decimals))
      setReceiveSymbol(destinationAsset)
      if (isNativeAsset(sourceChain, asset)) {
        const reserve = getGasReserve(sourceChain, asset)
        const reserveDecimals = sourceChain === "Story" ? 18 : 9
        const nativeSymbol = sourceChain === "Story" ? "IP" : "SOL"
        setFeeSummary(`~${formatUnits(reserve, reserveDecimals)} ${nativeSymbol} gas`)
      } else {
        setFeeSummary(null)
      }
      setTimeEstimate(null)
      setIsQuoting(false)
      return
    }

    const senderAddress = sourceChain === "Story" ? evmAddress : solanaAddress
    if (!senderAddress) {
      setIsQuoting(false)
      return
    }

    let quoteRecipient = destinationAddress
    if (!quoteRecipient) {
      const destIsEvm = !isSolanaChain(destinationChainId)
      quoteRecipient = destIsEvm ? evmAddress ?? "" : solanaAddress ?? ""
    }
    if (!quoteRecipient) {
      setIsQuoting(false)
      return
    }

    setIsQuoting(true)

    quoteTimerRef.current = setTimeout(async () => {
      const controller = new AbortController()
      quoteAbortRef.current = controller

      try {
        const quote = await getRelayGeneralWithdrawQuote({
          originChainId: getOriginChainId(sourceChain),
          originCurrency: getOriginCurrency(sourceChain, asset),
          destinationChainId,
          destinationCurrency: getDestinationCurrency(destinationChainId, destinationAsset),
          amount: amount.toString(),
          userAddress: senderAddress,
          recipientAddress: quoteRecipient,
        })

        if (controller.signal.aborted) return

        const outAmount = quote.details?.currencyOut?.amount ?? "0"
        const outDecimals = quote.details?.currencyOut?.currency?.decimals ?? getDecimalsForAsset(destinationAsset)
        const outSymbol = quote.details?.currencyOut?.currency?.symbol ?? destinationAsset

        setReceiveAmount(formatUnits(BigInt(outAmount), outDecimals))
        setReceiveSymbol(outSymbol)
        const gasUsd = parseFloat(quote.fees?.gas?.amountUsd ?? "0")
        const relayUsd = parseFloat(quote.fees?.relayer?.amountUsd ?? "0")
        const totalFeeUsd = gasUsd + relayUsd
        if (totalFeeUsd > 0) {
          setFeeSummary(`~$${totalFeeUsd.toFixed(2)} fee`)
        } else {
          setFeeSummary(null)
        }

        setTimeEstimate(quote.details?.timeEstimate ?? null)
        setQuoteError(null)
      } catch (err) {
        if (controller.signal.aborted) return
        console.error("[withdraw] quote error:", err)
        const msg = err instanceof Error ? err.message : "Quote failed"
        setQuoteError(parseErrorMessage(msg))
        setReceiveAmount("")
      } finally {
        if (!controller.signal.aborted) setIsQuoting(false)
      }
    }, QUOTE_DEBOUNCE_MS)

    return () => {
      if (quoteTimerRef.current) clearTimeout(quoteTimerRef.current)
      quoteAbortRef.current?.abort()
    }
  }, [
    sourceChain,
    asset,
    destinationChainId,
    destinationAsset,
    amount,
    destinationAddress,
    direct,
    evmAddress,
    solanaAddress,
  ])

  // -----------------------------------------------------------------------
  // Toast notifications for execution status
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (status === "idle") return

    if (status === "complete") {
      toast.success(STATUS_LABELS.complete, { id: WITHDRAW_TOAST_ID, duration: 4000 })
    } else if (status === "error") {
      toast.error(error || "Withdrawal failed", { id: WITHDRAW_TOAST_ID, duration: 5000 })
    } else {
      toast.loading(STATUS_LABELS[status], { id: WITHDRAW_TOAST_ID })
    }
  }, [status, error])

  // -----------------------------------------------------------------------
  // Reset
  // -----------------------------------------------------------------------

  const reset = useCallback(() => {
    abortRef.current?.abort()
    toast.dismiss(WITHDRAW_TOAST_ID)
    setStatus("idle")
    setError(null)
    setTxHash(null)
  }, [])

  // -----------------------------------------------------------------------
  // Direct transfer handlers
  // -----------------------------------------------------------------------

  const sendStoryIp = useCallback(async () => {
    setStatus("signing")
    const hash = await sendTransactionAsync({
      to: destinationAddress as Address,
      value: amount,
    })
    setTxHash(hash)
    setStatus("complete")
  }, [sendTransactionAsync, destinationAddress, amount])

  const sendStoryUsdc = useCallback(async () => {
    setStatus("signing")
    const hash = await writeContractAsync({
      address: STORY_USDC_ADDRESS,
      abi: ERC20_TRANSFER_ABI,
      functionName: "transfer",
      args: [destinationAddress as Address, amount],
    })
    setTxHash(hash)
    setStatus("complete")
  }, [writeContractAsync, destinationAddress, amount])

  const sendSolanaSol = useCallback(async () => {
    if (!solanaWallet || !solanaAddress || !isSolanaWallet(solanaWallet)) {
      throw new Error("Solana embedded wallet not available")
    }

    setStatus("signing")

    const connection = await solanaWallet.getConnection()
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: new PublicKey(solanaAddress),
        toPubkey: new PublicKey(destinationAddress),
        lamports: amount,
      })
    )

    const { blockhash } = await connection.getLatestBlockhash()
    tx.recentBlockhash = blockhash
    tx.feePayer = new PublicKey(solanaAddress)

    const sig = await signAndSendSolanaTransaction(solanaWallet, tx, connection)
    setTxHash(sig)
    setStatus("complete")
  }, [solanaWallet, solanaAddress, destinationAddress, amount])

  const sendSolanaUsdc = useCallback(async () => {
    if (!solanaWallet || !solanaAddress || !isSolanaWallet(solanaWallet)) {
      throw new Error("Solana embedded wallet not available")
    }

    setStatus("signing")

    const connection = await solanaWallet.getConnection()
    const owner = new PublicKey(solanaAddress)
    const recipient = new PublicKey(destinationAddress)
    const mint = new PublicKey(SOLANA_USDC_ADDRESS)

    const sourceAta = getAssociatedTokenAddress(owner, mint)
    const destAta = getAssociatedTokenAddress(recipient, mint)

    const tx = new Transaction()

    const destAccount = await connection.getAccountInfo(destAta)
    if (!destAccount) {
      tx.add(buildCreateAtaInstruction(owner, destAta, recipient, mint))
    }

    tx.add(buildSplTransferInstruction(sourceAta, destAta, owner, amount))

    const { blockhash } = await connection.getLatestBlockhash()
    tx.recentBlockhash = blockhash
    tx.feePayer = owner

    const sig = await signAndSendSolanaTransaction(solanaWallet, tx, connection)
    setTxHash(sig)
    setStatus("complete")
  }, [solanaWallet, solanaAddress, destinationAddress, amount])

  // -----------------------------------------------------------------------
  // Relay bridge (always fetches fresh quote for execution safety)
  // -----------------------------------------------------------------------

  const sendViaRelay = useCallback(async () => {
    const senderAddress = sourceChain === "Story" ? evmAddress : solanaAddress
    if (!senderAddress) throw new Error("Wallet not connected")

    setStatus("quoting")
    const quote = await getRelayGeneralWithdrawQuote({
      originChainId: getOriginChainId(sourceChain),
      originCurrency: getOriginCurrency(sourceChain, asset),
      destinationChainId,
      destinationCurrency: getDestinationCurrency(destinationChainId, destinationAsset),
      amount: amount.toString(),
      userAddress: senderAddress,
      recipientAddress: destinationAddress,
    })

    const depositStep = quote.steps?.find(
      (step) => step.id === "deposit" || step.action === "deposit"
    )
    const depositData = depositStep?.items?.[0]?.data
    if (!depositData) throw new Error("No deposit transaction in relay quote")

    const requestId = depositStep?.requestId ?? quote.requestId
    if (!requestId) throw new Error("No request ID in relay quote")

    setStatus("signing")

    if (depositData.instructions && sourceChain === "Solana") {
      if (!solanaWallet || !solanaAddress || !isSolanaWallet(solanaWallet)) {
        throw new Error("Solana embedded wallet not available")
      }
      await signSolanaRelayDeposit(
        solanaWallet,
        solanaAddress,
        depositData.instructions
      )
    } else if (depositData.to && sourceChain === "Story") {
      await sendTransactionAsync({
        to: depositData.to as Address,
        value: BigInt(depositData.value ?? "0"),
        data: (depositData.data ?? "0x") as `0x${string}`,
      })
    } else {
      throw new Error("Unknown deposit format in relay quote")
    }

    setStatus("bridging")

    const finalStatus = await pollRelayStatus(requestId, (update) => {
      if (update.outTxHashes?.[0]) setTxHash(update.outTxHashes[0])
    })

    if (finalStatus.status === "success") {
      if (finalStatus.outTxHashes?.[0]) setTxHash(finalStatus.outTxHashes[0])
      setStatus("complete")
    } else if (finalStatus.status === "refund") {
      throw new Error("Bridge was refunded — funds are safe on the source chain.")
    } else {
      throw new Error("Cross-chain relay failed. Check your wallet.")
    }
  }, [
    sourceChain,
    asset,
    destinationAsset,
    destinationChainId,
    amount,
    destinationAddress,
    evmAddress,
    solanaAddress,
    solanaWallet,
    sendTransactionAsync,
  ])

  // -----------------------------------------------------------------------
  // Main execute
  // -----------------------------------------------------------------------

  const execute = useCallback(async () => {
    if (!enabled || amount <= BigInt(0) || !destinationAddress) {
      setError("Missing amount or destination address")
      return
    }

    try {
      abortRef.current?.abort()
      abortRef.current = new AbortController()
      setError(null)
      setTxHash(null)
      void ensureEmbeddedWallet().catch(() => {})

      if (direct) {
        if (sourceChain === "Story" && asset === "IP") await sendStoryIp()
        else if (sourceChain === "Story" && asset === "USDC") await sendStoryUsdc()
        else if (sourceChain === "Solana" && asset === "SOL") await sendSolanaSol()
        else if (sourceChain === "Solana" && asset === "USDC") await sendSolanaUsdc()
        else throw new Error("Unsupported direct transfer combination")
      } else {
        await sendViaRelay()
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Unknown error"
      const message = parseErrorMessage(raw)
      setError(message)
      setStatus("error")
    }
  }, [
    enabled,
    amount,
    destinationAddress,
    sourceChain,
    asset,
    direct,
    sendStoryIp,
    sendStoryUsdc,
    sendSolanaSol,
    sendSolanaUsdc,
    sendViaRelay,
    ensureEmbeddedWallet,
  ])

  return {
    status,
    error,
    txHash,
    execute,
    reset,
    isQuoting,
    quoteError,
    receiveAmount,
    receiveSymbol,
    feeSummary,
    timeEstimate,
    isDirect: direct,
    gasReserve,
  }
}

// ---------------------------------------------------------------------------
// Solana transaction signing helpers
// ---------------------------------------------------------------------------

type SolanaSigner = {
  signAndSendTransaction: (tx: Transaction) => Promise<{ hash: string } | string>
  signTransaction?: (tx: Transaction) => Promise<Transaction>
}

async function signAndSendSolanaTransaction(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wallet: any,
  tx: Transaction,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  connection: any
): Promise<string> {
  const signer = await wallet.getSigner()
  const typedSigner = signer as unknown as SolanaSigner

  if (typeof typedSigner.signAndSendTransaction === "function") {
    const result = await typedSigner.signAndSendTransaction(tx)
    return typeof result === "string" ? result : result.hash
  }

  if (typeof typedSigner.signTransaction === "function") {
    const signedTx = await typedSigner.signTransaction(tx)
    return await connection.sendRawTransaction(signedTx.serialize())
  }

  throw new Error("Solana wallet signer does not support transaction signing")
}

async function signSolanaRelayDeposit(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wallet: any,
  walletAddress: string,
  instructions: RelaySolanaInstruction[]
): Promise<string> {
  const connection = await wallet.getConnection()
  const tx = new Transaction()

  for (const ix of instructions) {
    const hexStr = ix.data
    const bytes = new Uint8Array(hexStr.length / 2)
    for (let i = 0; i < hexStr.length; i += 2) {
      bytes[i / 2] = parseInt(hexStr.substring(i, i + 2), 16)
    }

    tx.add(
      new TransactionInstruction({
        keys: ix.keys.map((k) => ({
          pubkey: new PublicKey(k.pubkey),
          isSigner: k.isSigner,
          isWritable: k.isWritable,
        })),
        programId: new PublicKey(ix.programId),
        data: bytes as unknown as Buffer,
      })
    )
  }

  const { blockhash } = await connection.getLatestBlockhash()
  tx.recentBlockhash = blockhash
  tx.feePayer = new PublicKey(walletAddress)

  return signAndSendSolanaTransaction(wallet, tx, connection)
}
