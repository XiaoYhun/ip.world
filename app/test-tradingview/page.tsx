"use client"

import { useState } from "react"
import LazyChartWrapper from "@/components/lazy-chart-wrapper"
// Electric SQL configuration
const ELECTRIC_CONFIG = {
  url: "https://api.electric-sql.cloud/v1/shape",
  sourceId: "e3054f84-8a36-4499-980c-961ff506d0f5",
  sourceSecret:
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzb3VyY2VfaWQiOiJlMzA1NGY4NC04YTM2LTQ0OTktOTgwYy05NjFmZjUwNmQwZjUiLCJpYXQiOjE3MzkyOTAxMTZ9.1yO05fJNzwXdRQQ-tfU_qpOqwCc007oIW9ujjTgoiHQ",
}

export default function TestTradingViewPage() {
  const [theme, setTheme] = useState<"light" | "dark">("dark")
  const [useElectric, setUseElectric] = useState(true)
  const [symbol, setSymbol] = useState(
    "0x1514000000000000000000000000000000000000/0x94d769f89b31daa40aa9314f163a5dbce1a8a4eb"
  )
  const [interval, setInterval] = useState("15")

  return (
    <div className="bg-background flex h-screen flex-col">
      {/* Header with controls */}
      <div className="border-b p-4">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-4 text-2xl font-bold">TradingView Advanced Charts Test</h1>

          <div className="flex flex-wrap gap-4">
            {/* Theme toggle */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Theme:</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as "light" | "dark")}
                className="bg-background rounded-[6px] border px-3 py-1"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>

            {/* Data source toggle */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Data Source:</label>
              <button
                onClick={() => setUseElectric(!useElectric)}
                className={`rounded-[6px] px-4 py-1 transition-colors ${useElectric
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                  }`}
              >
                {useElectric ? "Electric SQL" : "Demo Feed"}
              </button>
            </div>

            {/* Symbol selector */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Symbol:</label>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="bg-background rounded-[6px] border px-3 py-1"
              >
                <option value="0x1514000000000000000000000000000000000000/0x94d769f89b31daa40aa9314f163a5dbce1a8a4eb">
                  Token Pair 1
                </option>
                <option value="0x1514000000000000000000000000000000000000/0xa310556abbd4343e31aa56b82e9426a4d7d3e7b5">
                  Token Pair 2
                </option>
                <option value="0x1514000000000000000000000000000000000000/0x1cd71413caf56cd547da0e2862b33121bc194b2f">
                  Token Pair 3
                </option>
                <option value="0x1514000000000000000000000000000000000000/0xfc4424bec066e205d65fd8ea08d935447e4a5fec">
                  Token Pair 4
                </option>
                <option value="BTC/USD">BTC/USD (Demo)</option>
                <option value="ETH/USD">ETH/USD (Demo)</option>
              </select>
            </div>

            {/* Interval selector */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Interval:</label>
              <select
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                className="bg-background rounded-[6px] border px-3 py-1"
              >
                <option value="1">1m</option>
                <option value="5">5m</option>
                <option value="15">15m</option>
                <option value="30">30m</option>
                <option value="60">1h</option>
                <option value="240">4h</option>
                <option value="1D">1D</option>
              </select>
            </div>
          </div>

          {useElectric && (
            <div className="text-muted-foreground mt-2 text-sm">Using Electric SQL data from ohlcv_15min table</div>
          )}
        </div>
      </div>

      {/* Chart container */}
      <div className="flex-1 p-4">
        <div className="mx-auto h-full max-w-7xl">
          <div className="h-full overflow-hidden rounded-[10px] border">
            <LazyChartWrapper
              key={`${symbol}-${interval}-${theme}-${useElectric}`}
              displaySymbol={symbol}
              symbol={symbol}
              interval={interval}
              theme={theme}
              electricConfig={useElectric ? ELECTRIC_CONFIG : undefined}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
