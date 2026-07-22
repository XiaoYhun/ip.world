const PREFIX = "[⏱ swap]"

/**
 * Enable via browser console: localStorage.setItem("debug:trade-timer", "1")
 * Disable: localStorage.removeItem("debug:trade-timer")
 */
function isEnabled(): boolean {
  try {
    return localStorage.getItem("debug:trade-timer") === "1"
  } catch {
    return false
  }
}

interface TimerEntry {
  start: number
  end?: number
}

interface CompletedEntry {
  step: string
  ms: number
  startOffset: number
}

class TradeTimer {
  private entries = new Map<string, TimerEntry>()
  private sessionStart = 0
  private logs: string[] = []

  start(label: string) {
    if (!this.sessionStart) this.sessionStart = performance.now()
    this.entries.set(label, { start: performance.now() })
  }

  end(label: string) {
    const entry = this.entries.get(label)
    if (!entry) return
    entry.end = performance.now()
    if (!isEnabled()) return
    const ms = entry.end - entry.start
    console.log(`${PREFIX} ${label}: ${ms.toFixed(1)}ms`)
  }

  log(msg: string) {
    const elapsed = this.sessionStart ? (performance.now() - this.sessionStart).toFixed(0) : "?"
    const line = `[+${elapsed}ms] ${msg}`
    this.logs.push(line)
    if (!isEnabled()) return
    console.log(`${PREFIX} ${line}`)
  }

  summary(tradeType: string) {
    const completed: CompletedEntry[] = []
    for (const [label, entry] of this.entries) {
      if (entry.end != null) {
        completed.push({
          step: label,
          ms: entry.end - entry.start,
          startOffset: entry.start - this.sessionStart,
        })
      }
    }

    if (completed.length === 0) {
      this.reset()
      return
    }

    const latestEnd = Math.max(...completed.map((e) => e.startOffset + e.ms))
    const totalMs = latestEnd

    const byDuration = [...completed].sort((a, b) => b.ms - a.ms)
    const byTimeline = [...completed].sort((a, b) => a.startOffset - b.startOffset)

    const stepCol = Math.max(12, ...completed.map((e) => e.step.length)) + 2
    const header = `${"Step".padEnd(stepCol)}${"Duration".padStart(10)}${"Start".padStart(10)}${"% total".padStart(10)}`
    const separator = "─".repeat(header.length)

    const fmt = (ms: number) => ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${Math.round(ms)}ms`

    const lines = [
      ``,
      `${PREFIX} ╔══════════════════════════════════════════════════╗`,
      `${PREFIX} ║  ${tradeType} SWAP — FULL TIMING BREAKDOWN`,
      `${PREFIX} ║  Total wall time: ${fmt(totalMs)}`,
      `${PREFIX} ╚══════════════════════════════════════════════════╝`,
      ``,
      `${PREFIX} ── Timeline order ──`,
      `${PREFIX} ${separator}`,
      `${PREFIX} ${header}`,
      `${PREFIX} ${separator}`,
      ...byTimeline.map((e) => {
        const pct = totalMs > 0 ? `${((e.ms / totalMs) * 100).toFixed(1)}%` : "—"
        return `${PREFIX} ${e.step.padEnd(stepCol)}${fmt(e.ms).padStart(10)}${fmt(e.startOffset).padStart(10)}${pct.padStart(10)}`
      }),
      `${PREFIX} ${separator}`,
      ``,
      `${PREFIX} ── Slowest steps ──`,
      `${PREFIX} ${separator}`,
      ...byDuration.slice(0, 10).map((e, i) => {
        const pct = totalMs > 0 ? `${((e.ms / totalMs) * 100).toFixed(1)}%` : "—"
        const bar = "█".repeat(Math.max(1, Math.round((e.ms / totalMs) * 30)))
        return `${PREFIX}  ${String(i + 1).padStart(2)}. ${e.step.padEnd(stepCol)}${fmt(e.ms).padStart(10)} ${pct.padStart(7)} ${bar}`
      }),
      `${PREFIX} ${separator}`,
    ]

    if (this.logs.length > 0) {
      lines.push(``, `${PREFIX} ── Debug logs ──`)
      this.logs.forEach((l) => lines.push(`${PREFIX}  ${l}`))
    }

    lines.push(``, `${PREFIX} ══ END ${tradeType} ══`)

    if (isEnabled()) console.log(lines.join("\n"))
    this.reset()
  }

  reset() {
    this.entries.clear()
    this.logs = []
    this.sessionStart = 0
  }
}

export const tradeTimer = new TradeTimer()
