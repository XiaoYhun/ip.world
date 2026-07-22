"use client"

import { useEffect, useRef, useState } from "react"
import TradingViewErrorBoundary from "@/components/error-boundary/tradingview-error-boundary"
import { formatNumberWithSuffix, formatTradingViewPriceLabel } from "@/lib/number"
import type { TvChartUnit } from "@/hooks/use-chart-price-unit"
import { ElectricDatafeed } from "@/lib/tradingview/electric-datafeed"

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TradingView: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Datafeeds: any
  }
}

interface TradingViewAdvancedChartProps {
  displaySymbol: string
  symbol: string
  interval?: string
  theme?: "light" | "dark"
  electricConfig?: {
    url: string
    // No sourceId, no sourceSecret
  }
  /** When true, hides the drawings left toolbar (e.g. mobile token page). */
  hideLeftToolbar?: boolean
  /** Multiply OHLC (e.g. current total supply for MCap). Default 1. */
  priceMultiplier?: number
  /** Shown in TradingView header when electric chart + onChartUnitChange set. */
  chartUnit?: TvChartUnit
  onChartUnitChange?: (u: TvChartUnit) => void
}

export default function TradingViewAdvancedChart({
  displaySymbol,
  symbol,
  interval = "15",
  theme = "dark",
  electricConfig,
  hideLeftToolbar = false,
  priceMultiplier = 1,
  chartUnit,
  onChartUnitChange,
}: TradingViewAdvancedChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentInterval, setCurrentInterval] = useState(interval)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const widgetRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const datafeedRef = useRef<any>(null)

  useEffect(() => {
    /** Native TV header dropdown; remove before widget teardown if created. */
    let chartDenomDropdown: { remove: () => void } | null = null
    let effectCancelled = false

    const initializeChart = () => {
      if (!containerRef.current || !window.TradingView) {
        return
      }

      try {
        // Create datafeed
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let datafeed: any

        if (electricConfig) {
          // Use Electric SQL datafeed
          datafeed = new ElectricDatafeed({
            electricUrl: electricConfig.url,
            currentInterval: currentInterval,
            debug: process.env.NODE_ENV == "development", // Enable debug mode only in development
            pairType: "USD", // Default to USD pairs on first load
            displaySymbol, // pass displaySymbol for UI in datafeed
            symbol,
            priceMultiplier,
            mcapAxis: chartUnit === "mcap",
          })
          datafeedRef.current = datafeed
        } else {
          // Use demo datafeed
          datafeed = new window.Datafeeds.UDFCompatibleDatafeed("https://demo-feed-data.tradingview.com", undefined, {
            maxResponseLength: 1000,
            expectedOrder: "latestFirst",
          })
        }

        // One-time cache bust to apply new brand colors (v4 — toolbar chrome + separators #0d0d0d)
        const TV_SETTINGS_VERSION = "tv_settings_v5"
        if (!localStorage.getItem(TV_SETTINGS_VERSION)) {
          Object.keys(localStorage).forEach((key) => {
            if (key.startsWith("tradingview.") || key.startsWith("tvx.") || key.startsWith("chart.")) {
              localStorage.removeItem(key)
            }
          })
          localStorage.setItem(TV_SETTINGS_VERSION, "1")
        }

        const disabledFeatures = [
          "study_templates",
          "header_symbol_search",
          "header_compare",
          "symbol_search_hot_key",
          ...(hideLeftToolbar ? (["left_toolbar"] as const) : []),
        ]

        const enabledFeaturesBase = [
          "side_toolbar_in_fullscreen_mode",
          "use_localstorage_for_settings",
          "save_chart_properties_to_local_storage",
          "auto_save_chart",
          "create_volume_indicator_by_default",
          "volume_force_overlay",
          "show_logo_on_all_charts",
          "caption_buttons_text_if_possible",
          "dont_show_boolean_study_arguments",
          "no_min_chart_width",
          "no_min_chart_height",
          ...(hideLeftToolbar ? [] : (["fix_left_toolbar"] as const)),
          "lock_visible_time_range_on_resize",
          "determine_first_data_request_size_using_visible_range",
          "request_only_visible_range_on_reset",
          "volume_scale_auto",
          "chart_property_page_background",
          "chart_property_page_scales",
          "chart_property_page_style",
          "chart_property_page_timezone_sessions",
          "chart_property_page_trading",
          "chart_property_page_legend_widget",
          "chart_property_page_chart_border",
          "header_chart_type",
          "header_indicators",
          "header_resolutions",
          "header_fullscreen_button",
          "header_undo_redo",
          "header_screenshot",
          "header_settings",
          "header_saveload",
        ]

        // Create widget
        const widgetOptions = {
          debug: process.env.NODE_ENV == "development",
          fullscreen: false,
          autosize: true,
          symbol: symbol, // use address pair for TradingView symbol
          timezone: "Etc/UTC",
          interval: currentInterval,
          container: containerRef.current,
          datafeed: datafeed,
          library_path: "/charting_library/",
          locale: "en",
          timeframes: [
            { text: "30S", resolution: "30S", description: "30 seconds" },
            { text: "1m", resolution: "1", description: "1 minute" },
            { text: "5m", resolution: "5", description: "5 minutes" },
            { text: "15m", resolution: "15", description: "15 minutes" },
            { text: "30m", resolution: "30", description: "30 minutes" },
            { text: "1h", resolution: "60", description: "1 hour" },
            { text: "4h", resolution: "240", description: "4 hours" },
            { text: "12h", resolution: "720", description: "12 hours" },
            { text: "1D", resolution: "1D", description: "1 day" },
            { text: "1W", resolution: "1W", description: "1 week" },
          ],
          disabled_features: disabledFeatures,
          enabled_features: enabledFeaturesBase,
          custom_formatters: {
            priceFormatterFactory: () => ({
              format: (price: number, signPositive?: boolean) => {
                if (chartUnit === "mcap") {
                  if (!Number.isFinite(price)) return "—"
                  if (price === 0 || Object.is(price, -0)) return "0"
                  const sign = price < 0 ? "-" : signPositive && price > 0 ? "+" : ""
                  return `${sign}$${formatNumberWithSuffix(Math.abs(price))}`
                }
                const body = formatTradingViewPriceLabel(price)
                if (signPositive && Number.isFinite(price) && price > 0) {
                  return `+${body}`
                }
                return body
              },
            }),
            // Keep indicator / legend price text consistent when zooming (otherwise default minTick formatting wins).
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            studyFormatterFactory: (format: any) => {
              if (format?.type === "price") {
                return {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  format: (value: any) =>
                    chartUnit === "mcap"
                      ? `$${formatNumberWithSuffix(Math.abs(Number(value)))}`
                      : formatTradingViewPriceLabel(Number(value)),
                }
              }
              return null
            },
          },
          theme: theme,
          custom_css_url: "/tradingview-custom.css?v=8",
          chartType: "candles",
          overrides: {
            "paneProperties.background": theme === "dark" ? "#0d0d0d" : "#ffffff",
            "paneProperties.backgroundType": "solid",
            "paneProperties.vertGridProperties.color": theme === "dark" ? "#1e1e1e" : "#e0e0e0",
            "paneProperties.horzGridProperties.color": theme === "dark" ? "#1e1e1e" : "#e0e0e0",
            "symbolWatermarkProperties.transparency": 90,
            "scalesProperties.textColor": theme === "dark" ? "#d1d4dc" : "#131722",
            // Candle colors
            "mainSeriesProperties.candleStyle.upColor": "#AFFF2E",
            "mainSeriesProperties.candleStyle.downColor": "#FF4297",
            "mainSeriesProperties.candleStyle.borderUpColor": "#AFFF2E",
            "mainSeriesProperties.candleStyle.borderDownColor": "#FF4297",
            "mainSeriesProperties.candleStyle.wickUpColor": "#AFFF2E",
            "mainSeriesProperties.candleStyle.wickDownColor": "#FF4297",
            // Volume indicator properties
            volumePaneSize: "medium",
            "paneProperties.volumePaneSize": "medium",
            "volumePaneProperties.background": theme === "dark" ? "#0a0a0a" : "#ffffff",
            "volumePaneProperties.backgroundType": "solid",
            "volumePaneProperties.vertGridProperties.color": theme === "dark" ? "#1e1e1e" : "#e0e0e0",
            "volumePaneProperties.horzGridProperties.color": theme === "dark" ? "#1e1e1e" : "#e0e0e0",
            "volumePaneProperties.scalesProperties.textColor": theme === "dark" ? "#d1d4dc" : "#131722",
          },
          studies_overrides: {
            "volume.volume.color.0": "#FF4297",
            "volume.volume.color.1": "#AFFF2E",
          },
          loading_screen: {
            backgroundColor: theme === "dark" ? "#0d0d0d" : "#ffffff",
            foregroundColor: theme === "dark" ? "#1e90ff" : "#2962ff",
          },
          toolbar_bg: theme === "dark" ? "#0d0d0d" : "#ffffff",
          custom_font_family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }

        widgetRef.current = new window.TradingView.widget(widgetOptions)

        widgetRef.current.onChartReady(() => {
          const chart = widgetRef.current.chart()
          chart.onIntervalChanged().subscribe(null, (newInterval: string) => {
            setCurrentInterval(newInterval)
          })

          // Price / MCap: use built-in header dropdown (same control family as interval / timeframe).
          if (electricConfig && onChartUnitChange && chartUnit) {
            const w = widgetRef.current
            void (async () => {
              try {
                if (typeof w.headerReady === "function") {
                  await w.headerReady()
                }
                if (typeof w.createDropdown !== "function" || effectCancelled) return

                const api = await w.createDropdown({
                  align: "left",
                  title: chartUnit === "mcap" ? "MCap" : "Price",
                  tooltip:
                    "Chart scale: token price (USD per token) or market cap (price × current on-chain supply). Past burns are not applied to older bars.",
                  items: [
                    {
                      title: "Price · USD / token",
                      onSelect: () => onChartUnitChange("price"),
                    },
                    {
                      title: "Market cap · USD (FDV)",
                      onSelect: () => onChartUnitChange("mcap"),
                    },
                  ],
                })
                if (effectCancelled) {
                  try {
                    api.remove()
                  } catch {
                    /* ignore */
                  }
                  return
                }
                chartDenomDropdown = api
              } catch (e) {
                console.warn("[TradingView] createDropdown (Price/MCap) failed:", e)
              }
            })()
          }

          // Nudge layout so price-axis width re-measures after custom CSS caps the right column.
          const nudgeResize = () => window.dispatchEvent(new Event("resize"))
          requestAnimationFrame(() => {
            requestAnimationFrame(nudgeResize)
          })
          window.setTimeout(nudgeResize, 250)
        })

        setIsLoading(false)
      } catch (err) {
        console.error("Failed to initialize TradingView:", err)
        setError("Failed to initialize chart")
        setIsLoading(false)
      }
    }

    // Load scripts
    const loadScripts = async () => {
      try {
        // Check if scripts are already loaded
        if (window.TradingView && window.Datafeeds) {
          initializeChart()
          return
        }

        // Load charting library
        const chartScript = document.createElement("script")
        chartScript.src = "/charting_library/charting_library.standalone.js"
        chartScript.async = true
        chartScript.onload = () => {
          // Load datafeeds bundle
          const datafeedScript = document.createElement("script")
          datafeedScript.src = "/datafeeds/udf/dist/bundle.js"
          datafeedScript.async = true
          datafeedScript.onload = () => {
            initializeChart()
          }
          datafeedScript.onerror = () => {
            setError("Failed to load datafeed script")
            setIsLoading(false)
          }
          document.head.appendChild(datafeedScript)
        }
        chartScript.onerror = () => {
          setError("Failed to load charting library")
          setIsLoading(false)
        }
        document.head.appendChild(chartScript)
      } catch (err) {
        console.error("Failed to load scripts:", err)
        setError("Failed to load required scripts")
        setIsLoading(false)
      }
    }

    loadScripts()

    // Cleanup
    return () => {
      effectCancelled = true
      if (chartDenomDropdown) {
        try {
          chartDenomDropdown.remove()
        } catch {
          /* ignore */
        }
        chartDenomDropdown = null
      }
      if (widgetRef.current) {
        try {
          widgetRef.current.remove()
        } catch (err) {
          console.error("Failed to remove widget:", err)
        }
        widgetRef.current = null
      }

      // Clean up datafeed
      if (datafeedRef.current && typeof datafeedRef.current.destroy === "function") {
        try {
          datafeedRef.current.destroy()
        } catch (err) {
          console.error("Failed to destroy datafeed:", err)
        }
        datafeedRef.current = null
      }
    }
  }, [
    displaySymbol,
    symbol,
    interval,
    theme,
    electricConfig,
    currentInterval,
    hideLeftToolbar,
    priceMultiplier,
    chartUnit,
    onChartUnitChange,
  ])

  if (error) {
    return (
      <div className="bg-background flex h-full items-center justify-center">
        <div className="text-center">
          <p className="mb-2 text-red-500">Error loading chart</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <TradingViewErrorBoundary>
      <div className="bg-[#0d0d0d] relative h-full w-full -ml-2 py-3">
        {isLoading && (
          <div className="bg-[#0d0d0d] absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="border-primary mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2"></div>
              <p className="text-muted-foreground text-sm">Loading charts...</p>
            </div>
          </div>
        )}
        <div ref={containerRef} className="h-full w-full" />
      </div>
    </TradingViewErrorBoundary>
  )
}
