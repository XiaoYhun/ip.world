import type { Address } from "viem"
import {
  NATIVE_CURRENCY_ADDRESS,
  RELAY_SOLANA_CHAIN_ID,
  RELAY_STORY_CHAIN_ID,
  SOLANA_NATIVE_SOL_ADDRESS,
} from "@/config/relay-chains"
import { getRelayGeneralWithdrawQuote, pollRelayStatus } from "@/lib/relay"

type SendTx = (args: {
  to: Address
  data?: `0x${string}`
  value?: bigint
  gas?: bigint
}) => Promise<`0x${string}`>

/**
 * Bridge native IP on Story to native SOL on Solana via Relay (EVM deposit tx).
 */
export async function relayStoryIpToSolana(params: {
  amountWei: bigint
  evmUserAddress: Address
  solanaRecipientAddress: string
  sendTransactionAsync: SendTx
}): Promise<void> {
  const { amountWei, evmUserAddress, solanaRecipientAddress, sendTransactionAsync } = params
  if (amountWei <= BigInt(0)) throw new Error("Relay amount must be positive")

  const quote = await getRelayGeneralWithdrawQuote({
    originChainId: RELAY_STORY_CHAIN_ID,
    originCurrency: NATIVE_CURRENCY_ADDRESS,
    destinationChainId: RELAY_SOLANA_CHAIN_ID,
    destinationCurrency: SOLANA_NATIVE_SOL_ADDRESS,
    amount: amountWei.toString(),
    userAddress: evmUserAddress,
    recipientAddress: solanaRecipientAddress,
  })

  const depositStep = quote.steps?.find((step) => step.id === "deposit" || step.action === "deposit")
  const depositData = depositStep?.items?.[0]?.data
  const requestId = depositStep?.requestId ?? quote.requestId
  if (!depositData?.to || !requestId) throw new Error("Invalid relay withdraw quote")

  await sendTransactionAsync({
    to: depositData.to as Address,
    value: BigInt(depositData.value ?? "0"),
    data: (depositData.data ?? "0x") as `0x${string}`,
  })

  const finalStatus = await pollRelayStatus(requestId)
  if (finalStatus.status === "refund") {
    throw new Error("Bridge was refunded — funds remain on Story.")
  }
  if (finalStatus.status !== "success") {
    throw new Error("Cross-chain relay did not complete successfully.")
  }
}
