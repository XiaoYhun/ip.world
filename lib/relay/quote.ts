import { env } from "@/config"
import { NATIVE_CURRENCY_ADDRESS, RELAY_STORY_CHAIN_ID } from "@/config/relay-chains"
import { tradeTimer } from "@/lib/trade-timer"
import { formatRelayHttpErrorBody } from "./relay-errors"
import type {
  RelayQuoteParams,
  RelayQuoteResponse,
  RelayQuoteWithFallbackResult,
  RelayBridgeEstimate,
  RelayWithdrawQuoteParams,
  GeneralWithdrawQuoteParams,
} from "./types"

export const RELAY_API_URL = "https://api.relay.link"
export const RELAY_REFERRER = "relay.link/swap"

function relayHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (env.NEXT_PUBLIC_RELAY_API_KEY) {
    headers["x-api-key"] = env.NEXT_PUBLIC_RELAY_API_KEY
  }
  return headers
}

// ---------------------------------------------------------------------------
// getRelayQuote
// ---------------------------------------------------------------------------

export async function getRelayQuote(params: RelayQuoteParams): Promise<RelayQuoteResponse> {
  const hasDestTxs = params.destinationTxs && params.destinationTxs.length > 0
  const label = `[relay] getRelayQuote (${params.originChainId}→${params.destinationChainId ?? RELAY_STORY_CHAIN_ID}, destTxs=${!!hasDestTxs})`
  tradeTimer.start(label)

  const body: Record<string, unknown> = {
    user: params.userAddress,
    originChainId: params.originChainId,
    originCurrency: params.originCurrency,
    destinationChainId: params.destinationChainId ?? RELAY_STORY_CHAIN_ID,
    destinationCurrency: params.destinationCurrency ?? NATIVE_CURRENCY_ADDRESS,
    recipient: params.recipientAddress,
    tradeType: params.tradeType ?? "EXPECTED_OUTPUT",
    amount: params.amount,
    referrer: RELAY_REFERRER,
    useExternalLiquidity: false,
  }

  if (hasDestTxs) {
    body.txs = params.destinationTxs
  }

  const response = await fetch(`${RELAY_API_URL}/quote/v2`, {
    method: "POST",
    headers: relayHeaders(),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error")
    tradeTimer.end(label)
    throw new Error(formatRelayHttpErrorBody(response.status, errorText))
  }

  const result = (await response.json()) as RelayQuoteResponse
  tradeTimer.end(label)
  return result
}

// ---------------------------------------------------------------------------
// getRelayQuoteWithFallback
// ---------------------------------------------------------------------------

/**
 * Always fetches a bridge-only quote (SOL → IP). Relay does not support
 * direct token swap routes on Story mainnet, so the app handles the
 * IP → meme-token swap on-chain after the bridge completes.
 */
export async function getRelayQuoteWithFallback(
  params: RelayQuoteParams
): Promise<RelayQuoteWithFallbackResult> {
  const bridgeParams: RelayQuoteParams = { ...params, destinationTxs: undefined }
  const quote = await getRelayQuote(bridgeParams)
  return { quote, usedFallback: true }
}

// ---------------------------------------------------------------------------
// getRelayBridgeEstimate
// ---------------------------------------------------------------------------

export async function getRelayBridgeEstimate(params: {
  originChainId: number
  originCurrency: string
  amount: string
  userAddress: string
  recipientAddress: string
}): Promise<RelayBridgeEstimate> {
  tradeTimer.start("[relay] bridgeEstimate")
  const body = {
    user: params.userAddress,
    originChainId: params.originChainId,
    originCurrency: params.originCurrency,
    destinationChainId: RELAY_STORY_CHAIN_ID,
    destinationCurrency: NATIVE_CURRENCY_ADDRESS,
    recipient: params.recipientAddress,
    tradeType: "EXACT_INPUT",
    amount: params.amount,
    referrer: RELAY_REFERRER,
    useExternalLiquidity: false,
  }

  const response = await fetch(`${RELAY_API_URL}/quote/v2`, {
    method: "POST",
    headers: relayHeaders(),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error")
    tradeTimer.end("[relay] bridgeEstimate")
    throw new Error(formatRelayHttpErrorBody(response.status, errorText))
  }

  const raw = (await response.json()) as RelayQuoteResponse
  tradeTimer.end("[relay] bridgeEstimate")

  const estimatedIpWei = BigInt(raw.details?.currencyOut?.amount ?? "0")
  const inputAmount = parseFloat(raw.details?.currencyIn?.amount ?? "0")
  const inputUsd = parseFloat(raw.details?.currencyIn?.amountUsd ?? "0")
  const inputDecimals = raw.details?.currencyIn?.currency?.decimals ?? 9
  const inputHuman = inputAmount / 10 ** inputDecimals
  const usdPerInputToken = inputHuman > 0 ? inputUsd / inputHuman : 0

  const relayUsd = raw.fees?.relayer?.amountUsd ?? "0"
  const gasUsd = raw.fees?.gas?.amountUsd ?? "0"
  const totalUsd = (parseFloat(relayUsd) + parseFloat(gasUsd)).toFixed(2)

  return { estimatedIpWei, usdPerInputToken, fees: { relayUsd, gasUsd, totalUsd }, raw }
}

// ---------------------------------------------------------------------------
// getRelayWithdrawQuote
// ---------------------------------------------------------------------------

export async function getRelayWithdrawQuote(
  params: RelayWithdrawQuoteParams
): Promise<RelayQuoteResponse> {
  const body = {
    user: params.userAddress,
    originChainId: RELAY_STORY_CHAIN_ID,
    originCurrency: NATIVE_CURRENCY_ADDRESS,
    destinationChainId: params.destinationChainId,
    destinationCurrency: params.destinationCurrency,
    recipient: params.recipientAddress,
    tradeType: "EXACT_INPUT",
    amount: params.amount,
    referrer: RELAY_REFERRER,
    useExternalLiquidity: false,
  }

  const res = await fetch(`${RELAY_API_URL}/quote/v2`, {
    method: "POST",
    headers: relayHeaders(),
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown error")
    throw new Error(formatRelayHttpErrorBody(res.status, errorText))
  }

  return (await res.json()) as RelayQuoteResponse
}

// ---------------------------------------------------------------------------
// getRelayGeneralWithdrawQuote – flexible origin chain/currency
// ---------------------------------------------------------------------------

export async function getRelayGeneralWithdrawQuote(
  params: GeneralWithdrawQuoteParams
): Promise<RelayQuoteResponse> {
  const body = {
    user: params.userAddress,
    originChainId: params.originChainId,
    originCurrency: params.originCurrency,
    destinationChainId: params.destinationChainId,
    destinationCurrency: params.destinationCurrency,
    recipient: params.recipientAddress,
    tradeType: "EXACT_INPUT",
    amount: params.amount,
    referrer: RELAY_REFERRER,
    useExternalLiquidity: false,
  }

  const res = await fetch(`${RELAY_API_URL}/quote/v2`, {
    method: "POST",
    headers: relayHeaders(),
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown error")
    throw new Error(formatRelayHttpErrorBody(res.status, errorText))
  }

  return (await res.json()) as RelayQuoteResponse
}
