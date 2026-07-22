"use client"

import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  TimeScale,
  Tooltip,
} from "chart.js"
import { useEffect, useMemo, useRef } from "react"
import { Line } from "react-chartjs-2"
import "chartjs-adapter-date-fns"
import { formatNumberWithSuffix } from "@/lib/number"

ChartJS.register(LineElement, PointElement, LinearScale, TimeScale, Tooltip, Filler, CategoryScale)

interface CustomData {
  labels: string[]
  data: number[]
}

export default function LineChart({ className, customData }: { className?: string; customData?: CustomData }) {
  const chartRef = useRef<ChartJS<"line"> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { chartData, chartOptions } = useMemo(() => {
    const labels = customData?.labels || []
    const dataValues = customData?.data || []

    const minValue = 0
    const maxValue = dataValues.length > 0 ? Math.max(...dataValues) : 100
    const padding = Math.max(maxValue * 0.1, maxValue === minValue ? 1 : 0)

    const data = {
      labels,
      datasets: [
        {
          label: "Data",
          data: dataValues,
          fill: true,
          borderColor: "#AD74FE",
          borderWidth: 2,
          backgroundColor: "rgba(148, 74, 255, 0.1)",
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: "#AD74FE",
          pointHoverBorderColor: "#AD74FE",
          pointHoverBorderWidth: 2,
        },
      ],
    }

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 0,
      },
      interaction: {
        mode: "nearest",
        axis: "x",
        intersect: false,
      },
      scales: {
        x: {
          type: "time",
          time: {
            parser: "yyyy-MM-dd'T'HH:mm:ss'Z'",
            tooltipFormat: "MMM d",
            displayFormats: {
              day: "MMM d",
            },
          },
          display: false,
          grid: {
            display: false,
          },
        },
        y: {
          display: false,
          min: minValue,
          max: maxValue + padding,
          grid: {
            display: false,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: false,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          external: function (context: any) {
            const tooltipEl = getOrCreateTooltip(context.chart)

            const tooltipModel = context.tooltip

            if (tooltipModel.opacity === 0) {
              tooltipEl.style.opacity = "0"
              return
            }

            const { offsetLeft: positionX, offsetTop: positionY } = context.chart.canvas

            const value = tooltipModel.dataPoints?.[0]?.parsed.y ?? ""
            const label = tooltipModel.dataPoints?.[0]?.label ?? ""

            tooltipEl.innerHTML = `
              <div class="flex px-2 py-1 items-center justify-center gap-2 bg-black border rounded-[10px] font-medium text-xs">
                <div class="text-white">${formatNumberWithSuffix(value)}</div>
                <div class="text-neutral-300 whitespace-nowrap">${label}</div>
              </div>
            `

            const chartWidth = context.chart.width
            const tooltipWidth = 100
            let left = positionX + tooltipModel.caretX
            if (left + tooltipWidth > positionX + chartWidth) {
              left = positionX + tooltipModel.caretX - tooltipWidth
            }
            tooltipEl.style.opacity = "1"
            tooltipEl.style.position = "absolute"
            tooltipEl.style.left = left + "px"
            tooltipEl.style.top = positionY + tooltipModel.caretY + "px"
            tooltipEl.style.pointerEvents = "none"
            tooltipEl.style.zIndex = "100"
          },
        },
      },
      elements: {
        line: {
          borderWidth: 2,
        },
        point: {
          hitRadius: 10,
          hoverRadius: 6,
        },
      },
    }

    return { chartData: data, chartOptions: options }
  }, [customData])

  // Handle window resize
  useEffect(() => {
    if (!containerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const { } of entries) {
        if (chartRef.current) {
          chartRef.current.resize()
        }
      }
    })

    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
      if (chartRef.current) {
        chartRef.current.destroy()
        chartRef.current = null
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={`relative h-9 w-full ${className}`}
      style={{ minWidth: "100px" }} // Add minimum width to prevent collapse
    >
      {customData?.data?.length ? (
        <Line
          ref={chartRef}
          data={chartData}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          options={chartOptions as any}
          key={JSON.stringify(customData)}
          redraw={true}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-neutral-300">No data available</div>
      )}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getOrCreateTooltip(chart: any) {
  let tooltipEl = chart.canvas.parentNode.querySelector("div.custom-tooltip")

  if (!tooltipEl) {
    tooltipEl = document.createElement("div")
    tooltipEl.classList.add("custom-tooltip")
    chart.canvas.parentNode.appendChild(tooltipEl)
  }

  return tooltipEl
}
