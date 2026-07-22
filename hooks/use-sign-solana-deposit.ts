"use client"

import { useCallback } from "react"
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js"
import { isSolanaWallet } from "@dynamic-labs/solana"
import { useEmbeddedWallets } from "./use-embedded-wallets"
import { tradeTimer } from "@/lib/trade-timer"
import type { RelaySolanaInstruction } from "@/lib/relay"

function relayInstructionsToSolanaInstructions(instructions: RelaySolanaInstruction[]): TransactionInstruction[] {
  return instructions.map((ix) => {
    const hexStr = ix.data
    const bytes = new Uint8Array(hexStr.length / 2)
    for (let i = 0; i < hexStr.length; i += 2) {
      bytes[i / 2] = parseInt(hexStr.substring(i, i + 2), 16)
    }
    return new TransactionInstruction({
      keys: ix.keys.map((k) => ({
        pubkey: new PublicKey(k.pubkey),
        isSigner: k.isSigner,
        isWritable: k.isWritable,
      })),
      programId: new PublicKey(ix.programId),
      data: bytes as unknown as Buffer,
    })
  })
}

/**
 * Reusable hook that signs and sends a Solana deposit transaction
 * from Relay instructions using the embedded Solana wallet.
 */
export function useSignSolanaDeposit() {
  const { solanaWallet } = useEmbeddedWallets()

  const signSolanaDeposit = useCallback(
    async (
      instructions: RelaySolanaInstruction[],
      opts?: { addressLookupTableAddresses?: string[] }
    ): Promise<string> => {
      tradeTimer.start("[solana] signDeposit:total")
      if (!solanaWallet || !isSolanaWallet(solanaWallet)) {
        throw new Error("Solana embedded wallet not available")
      }

      tradeTimer.start("[solana] signDeposit:getConnection")
      const connection = await solanaWallet.getConnection()
      tradeTimer.end("[solana] signDeposit:getConnection")

      const payerKey = new PublicKey(solanaWallet.address)
      const builtIxs = relayInstructionsToSolanaInstructions(instructions)
      const altAddrs = opts?.addressLookupTableAddresses?.filter(Boolean) ?? []

      tradeTimer.start("[solana] signDeposit:getBlockhash")
      const { blockhash } = await connection.getLatestBlockhash()
      tradeTimer.end("[solana] signDeposit:getBlockhash")

      let legacyTx: Transaction | undefined
      let versionedTx: VersionedTransaction | undefined

      if (altAddrs.length > 0) {
        const lookupAccounts = await Promise.all(
          altAddrs.map(async (addr) => {
            const res = await connection.getAddressLookupTable(new PublicKey(addr))
            if (!res.value) throw new Error(`Missing Solana address lookup table: ${addr}`)
            return res.value
          })
        )
        const messageV0 = new TransactionMessage({
          payerKey,
          recentBlockhash: blockhash,
          instructions: builtIxs,
        }).compileToV0Message(lookupAccounts)
        versionedTx = new VersionedTransaction(messageV0)
      } else {
        const tx = new Transaction()
        builtIxs.forEach((ix) => tx.add(ix))
        tx.recentBlockhash = blockhash
        tx.feePayer = payerKey
        legacyTx = tx
      }

      tradeTimer.start("[solana] signDeposit:getSigner")
      const signer = await solanaWallet.getSigner()
      tradeTimer.end("[solana] signDeposit:getSigner")

      type SolanaSigner = {
        signAndSendTransaction: (
          tx: Transaction | VersionedTransaction
        ) => Promise<{ hash?: string; signature?: string } | string>
        signTransaction?: (tx: Transaction | VersionedTransaction) => Promise<Transaction | VersionedTransaction>
      }

      const typedSigner = signer as unknown as SolanaSigner

      if (typeof typedSigner.signAndSendTransaction === "function") {
        tradeTimer.start("[solana] signDeposit:signAndSend")
        const toSend = versionedTx ?? legacyTx!
        const result = await typedSigner.signAndSendTransaction(toSend)
        tradeTimer.end("[solana] signDeposit:signAndSend")
        tradeTimer.end("[solana] signDeposit:total")
        if (typeof result === "string") return result
        const sig = result.signature ?? result.hash
        if (!sig) throw new Error("Solana wallet returned no transaction signature")
        return sig
      }

      if (typeof typedSigner.signTransaction === "function") {
        tradeTimer.start("[solana] signDeposit:signAndBroadcast")
        const toSign = versionedTx ?? legacyTx!
        const signedTx = await typedSigner.signTransaction(toSign)
        const sig = await connection.sendRawTransaction(signedTx.serialize())
        tradeTimer.end("[solana] signDeposit:signAndBroadcast")
        tradeTimer.end("[solana] signDeposit:total")
        return sig
      }

      throw new Error("Solana wallet signer does not support transaction signing")
    },
    [solanaWallet]
  )

  const isAvailable = !!solanaWallet

  return { signSolanaDeposit, isAvailable }
}
