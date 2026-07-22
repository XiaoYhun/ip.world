/**
 * Re-export from the modular relay package for backwards compatibility.
 * New code should import from `@/lib/relay/index` directly.
 */
export {
  RELAY_API_URL,
  RELAY_REFERRER,
  getRelayQuote,
  getRelayQuoteWithFallback,
  getRelayBridgeEstimate,
  getRelayWithdrawQuote,
  getRelayGeneralWithdrawQuote,
  pollRelayStatus,
  buildStorySwapTxs,
  planUsdcToIpRoute,
  formatRelayHttpErrorBody,
  relayUserMessageFromErrorMessage,
} from "./relay/index"

export type {
  RelayTx,
  RelayQuoteParams,
  RelaySolanaInstruction,
  RelayQuoteStep,
  RelayQuoteResponse,
  RelayStatusResponse,
  RelayQuoteWithFallbackResult,
  RelayBridgeEstimate,
  RelayWithdrawQuoteParams,
  GeneralWithdrawQuoteParams,
  StatusCallback,
  UsdcSource,
  UsdcRouteInput,
  UsdcRouteStep,
  UsdcRoutePlan,
} from "./relay/index"
