"use client"

import { memo, useEffect, useLayoutEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

type VisualizedDeltaProps = {
  children: string
  dollar?: boolean
  scramble?: boolean
}

const VisualizedDelta = memo(({ children, dollar = false }: VisualizedDeltaProps) => {
  return (
    <span className="inline-flex items-end tabular-nums">
      {dollar && <span style={{ height: "1.2em", lineHeight: "1.2em", verticalAlign: "bottom" }}>$</span>}
      <RollingText value={children} />
    </span>
  )
})

VisualizedDelta.displayName = "VisualizedDelta"

function RollingText({ value }: { value: string }) {
  const prevRef = useRef(value)
  const [chars, setChars] = useState(() =>
    value.split("").map((char, i) => ({ char, prevChar: char, key: i }))
  )

  useEffect(() => {
    const prev = prevRef.current
    const maxLen = Math.max(prev.length, value.length)
    const alignedPrev = prev.padStart(maxLen, " ")
    const alignedNext = value.padStart(maxLen, " ")
    setChars(
      alignedNext.split("").map((char, i) => ({
        char,
        prevChar: alignedPrev[i] ?? char,
        key: i,
      }))
    )
    prevRef.current = value
  }, [value])

  return (
    <>
      {chars.map((c) =>
        c.char === " " ? null : <DigitSlot key={c.key} char={c.char} prevChar={c.prevChar} />
      )}
    </>
  )
}

type AnimPhase = "idle" | "up" | "down-setup" | "down"

function DigitSlot({ char, prevChar }: { char: string; prevChar: string }) {
  const isDigit = /\d/.test(char)
  const prevRef = useRef(prevChar)
  const [phase, setPhase] = useState<AnimPhase>("idle")

  useLayoutEffect((): (() => void) | void => {
    if (char !== prevRef.current && isDigit && /\d/.test(prevRef.current)) {
      const goingUp = parseInt(char, 10) > parseInt(prevRef.current, 10)
      setPhase(goingUp ? "up" : "down-setup")
      const timer = setTimeout(() => {
        setPhase("idle")
        prevRef.current = char
      }, goingUp ? 350 : 400)
      return () => clearTimeout(timer)
    } else {
      prevRef.current = char
    }
  }, [char, isDigit])

  useLayoutEffect(() => {
    if (phase === "down-setup") {
      const raf = requestAnimationFrame(() => setPhase("down"))
      return () => cancelAnimationFrame(raf)
    }
  }, [phase])

  if (!isDigit) {
    return (
      <span className="inline-block text-inherit tabular-nums" style={{ height: "1.2em", lineHeight: "1.2em", minWidth: char === "." || char === "," ? "0.3em" : "0.55em", verticalAlign: "bottom" }}>
        {char}
      </span>
    )
  }

  const isAnimating = phase !== "idle"
  let transform = "translateY(0)"
  let transition = "none"

  if (phase === "up") {
    transform = "translateY(-1.2em)"
    transition = "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)"
  } else if (phase === "down-setup") {
    transform = "translateY(-1.2em)"
  } else if (phase === "down") {
    transition = "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)"
  }

  return (
    <span
      className="inline-block overflow-hidden relative"
      style={{ height: "1.2em", minWidth: "0.62em", verticalAlign: "bottom" }}
    >
      <span
        className="absolute flex flex-col"
        style={{
          top: 0,
          transition,
          transform,
          willChange: isAnimating ? "transform" : undefined,
        }}
      >
        {isAnimating ? (
          phase === "up" ? (
            <>
              <span style={{ height: "1.2em", lineHeight: "1.2em" }}>{prevRef.current}</span>
              <span style={{ height: "1.2em", lineHeight: "1.2em" }}>{char}</span>
            </>
          ) : (
            <>
              <span style={{ height: "1.2em", lineHeight: "1.2em" }}>{char}</span>
              <span style={{ height: "1.2em", lineHeight: "1.2em" }}>{prevRef.current}</span>
            </>
          )
        ) : (
          <span style={{ height: "1.2em", lineHeight: "1.2em" }}>{char}</span>
        )}
      </span>
    </span>
  )
}

export default VisualizedDelta
