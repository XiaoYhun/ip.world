"use client"

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { formatNumberWithSuperscriptZeros } from "@/lib/number"

const SLOTS = 7

export type SparklineDataPoint =
  | number
  | string
  | { value: number | string; timestamp?: string | number | null }

interface SparklineChartProps {
  data?: SparklineDataPoint[]
  width?: number
  height?: number
  strokeWidth?: number
  className?: string
  showTrend?: boolean
  showTooltip?: boolean
}

function formatTooltipDateTime(ts: string | number | null | undefined): { date: string; time: string } {
  if (ts == null) return { date: "", time: "" }
  const d = typeof ts === "number" ? new Date(ts * 1000) : new Date(ts)
  if (isNaN(d.getTime())) return { date: "", time: "" }
  return {
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
  }
}

function SparklineChartComponent({
  data: rawData = [],
  width = 56,
  height = 32,
  strokeWidth = 2,
  className,
  showTrend = true,
  showTooltip = true,
}: SparklineChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })
  const svgRef = useRef<SVGSVGElement>(null)
  const [gradientId] = useState(() => `sparkline-grad-${Math.random().toString(36).slice(2)}`)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => { setIsMounted(true) }, [])

  const padding = 3
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2

  // ── Unpack each item → { value, timestamp } ───────────────────────────────
  const unpacked = useMemo(
    () =>
      rawData.map((item) => {
        if (item == null) return { value: null as number | null, timestamp: null as string | number | null }
        if (typeof item === "object" && "value" in item) {
          const raw = item.value
          const v = raw == null || raw === "" ? null : Number(raw)
          return { value: isNaN(v as number) ? null : v, timestamp: item.timestamp ?? null }
        }
        const v = item === "" ? null : Number(item)
        return { value: isNaN(v as number) ? null : (v as number), timestamp: null as string | number | null }
      }),
    [rawData]
  )

  // ── When there is only one data point, prepend a synthetic zero-price point
  //    at the same timestamp so the chart renders a line instead of a dot ────
  const paddedUnpacked = useMemo(() => {
    const valid = unpacked.filter((p) => p.value != null)
    if (valid.length === 1) {
      return [{ value: 0, timestamp: valid[0].timestamp }, ...unpacked]
    }
    return unpacked
  }, [unpacked])

  // ── Use data as-is, capped at SLOTS — no null padding ────────────────────
  const slots: (number | null)[] = useMemo(
    () => paddedUnpacked.map((p) => p.value).slice(-SLOTS),
    [paddedUnpacked]
  )

  const tsSlots: (string | number | null)[] = useMemo(
    () => paddedUnpacked.map((p) => p.timestamp).slice(-SLOTS),
    [paddedUnpacked]
  )

  // ── Scale on real values only ─────────────────────────────────────────────
  const realValues = useMemo(() => slots.filter((v): v is number => v != null), [slots])
  const min = realValues.length ? Math.min(...realValues) : 0
  const max = realValues.length ? Math.max(...realValues) : 1
  const range = max - min || 1

  // ── XY positions — null slots still occupy their column but are invisible ─
  const points = useMemo(() => {
    const count = slots.length
    return slots.map((value, i) => {
      const x = count > 1 ? (i / (count - 1)) * chartWidth : chartWidth / 2
      const y = value != null ? chartHeight - ((value - min) / range) * chartHeight : chartHeight / 2
      return { x, y, value }
    })
  }, [slots, chartWidth, chartHeight, min, range])

  // ── Segmented path — breaks at null slots ─────────────────────────────────
  const pathSegments = useMemo(() => {
    const segs: string[] = []
    let current = ""
    for (let i = 0; i < points.length; i++) {
      if (slots[i] == null) {
        if (current) { segs.push(current); current = "" }
      } else {
        current += current ? `L${points[i].x},${points[i].y}` : `M${points[i].x},${points[i].y}`
      }
    }
    if (current) segs.push(current)
    return segs
  }, [points, slots])

  // ── Trend colour ──────────────────────────────────────────────────────────
  const strokeColor = useMemo(() => {
    const first = realValues[0]
    const last = realValues[realValues.length - 1]
    return first != null && last != null && last >= first ? "#afff2e" : "#ff4297"
  }, [realValues])
  const midColor = strokeColor === "#afff2e" ? "#D4F99A" : "#FF66AC"

  // ── Mouse handlers ────────────────────────────────────────────────────────
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!showTooltip || !svgRef.current) return
      setCursorPos({ x: e.clientX, y: e.clientY })
      const rect = svgRef.current.getBoundingClientRect()
      const mouseX = ((e.clientX - rect.left) / rect.width) * width - padding
      let nearest = -1
      let minDist = Infinity
      points.forEach((p, i) => {
        if (slots[i] == null) return
        const d = Math.abs(p.x - mouseX)
        if (d < minDist) { minDist = d; nearest = i }
      })
      setHoveredIndex(nearest >= 0 ? nearest : null)
    },
    [showTooltip, points, slots, padding, width]
  )

  const handleMouseLeave = useCallback(() => setHoveredIndex(null), [])

  const hovered = hoveredIndex != null ? points[hoveredIndex] : null
  const hoveredValue = hoveredIndex != null ? slots[hoveredIndex] : null
  const hoveredTs = hoveredIndex != null ? tsSlots[hoveredIndex] : null
  const { date: tooltipDate, time: tooltipTime } = formatTooltipDateTime(hoveredTs)

  return (
    <div className="relative w-full" style={{ height: `${height}px` }}>
      <svg
        ref={svgRef}
        role="img"
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        className={cn("inline-block", className)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <linearGradient
            id={gradientId}
            x1={width}
            y1={height / 2}
            x2="0"
            y2={height / 2}
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor={strokeColor} />
            <stop offset="0.5" stopColor={midColor} />
            <stop offset="1" stopColor={strokeColor} />
          </linearGradient>
        </defs>

        <g transform={`translate(${padding}, ${padding})`}>
          {pathSegments.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="transparent"
              stroke={`url(#${gradientId})`}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity="1"
              strokeWidth={strokeWidth}
            />
          ))}

          {showTooltip && hovered && hoveredValue != null && (
            <circle cx={hovered.x} cy={hovered.y} r={2.5} fill={strokeColor} />
          )}

          <rect fill="transparent" width={chartWidth} height={chartHeight} />
        </g>
      </svg>

      {isMounted && showTooltip && hoveredValue != null && createPortal(
        <div
          className="pointer-events-none fixed z-9999 rounded-[6px] border border-neutral-700 bg-black px-3 py-2 font-mono text-sm font-medium whitespace-nowrap text-white shadow-xl"
          style={{
            left: cursorPos.x,
            top: cursorPos.y,
            transform: "translate(-50%, calc(-100% - 10px))",
          }}
        >
          ${formatNumberWithSuperscriptZeros(hoveredValue, 5)}
          {tooltipDate && (
            <div className="mt-1">
              {tooltipDate}
              {tooltipTime && <span className="ml-1.5">{tooltipTime}</span>}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}

const SparklineChart = React.memo(SparklineChartComponent)
export default SparklineChart

export function SparklineChartSkeleton({ width = "56px", height = "32px" }: { width?: string; height?: string }) {
  return <div className="animate-pulse rounded bg-neutral-500" style={{ width, height }} />
}
