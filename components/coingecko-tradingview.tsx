"use client"

import { memo } from "react"

interface TradingViewWidgetProps {
  tokenAddress?: string
}

// Hardcoded pool addresses for specific tokens
const TOKEN_POOL_MAP: Record<string, string> = {
  "0x02353a3bd5c9668159cf9fd54ac61b03212fcf41": "0x8Cb0A60ADc920fD5ae8AEC1775F231D3cB3004Ea",
  "0x210e36b5cdb47c010c3225a065467ea193ded463": "0xA44F486E84879F85E90C63bD5b5580DfC1C23eD1",
}

function TradingViewWidget({ tokenAddress }: TradingViewWidgetProps) {
  if (!tokenAddress) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-neutral-900 text-white">
        <div className="text-center">
          <p className="text-lg font-semibold">Chart Not Available</p>
          <p className="text-sm text-neutral-400">No token address provided</p>
        </div>
      </div>
    )
  }

  const poolAddress = TOKEN_POOL_MAP[tokenAddress.toLowerCase()]

  if (!poolAddress) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-neutral-900 text-white">
        <div className="text-center">
          <p className="text-lg font-semibold">Chart Not Available</p>
          <p className="text-sm text-neutral-400">Pool not found for this token</p>
          <p className="mt-2 text-xs text-neutral-3000">Token: {tokenAddress}</p>
        </div>
      </div>
    )
  }

  return (
    <iframe
      height="100%"
      width="100%"
      id="geckoterminal-embed"
      title="GeckoTerminal Embed"
      src={`https://www.geckoterminal.com/story/pools/${poolAddress}?embed=1&info=0&swaps=0&grayscale=0&light_chart=0&chart_type=price&resolution=15m`}
      frameBorder="0"
      allow="clipboard-write"
      allowFullScreen
    ></iframe>
  )
}

export default memo(TradingViewWidget)
