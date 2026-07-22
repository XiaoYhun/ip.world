"use client"

import { memo, useEffect, useRef, useState } from "react"
import NumberFlow, { continuous, Format } from "@number-flow/react"
import { cn } from "@/lib/utils"

// Unicode superscript digits produced by formatNumberWithSuperscriptZeros
const SUPERSCRIPT_RE = /[¹²³⁴⁵⁶⁷⁸⁹]/
const TIMING_MULTIPLIER = 1.2

type AnimatedNumberProps = {
  value: number | string
  /**
   * - Intl.NumberFormatOptions → NumberFlow built-in formatting
   * - (n: number) => string → digit-slot rolling animation
   * - string (e.g. "$1,234.56" or "0.00%") → auto-extracts prefix/suffix
   *   from the numeric portion and passes value to NumberFlow with inferred
   *   decimal-place format
   */
  prefix?: string
  suffix?: string
  className?: string
  delay?: number
  animateDuration?: number
  /** @deprecated No longer used — kept for backwards compat */
  flashColor?: boolean
}


/**
 * Animated number with smooth rolling digits.
 * - Intl format options → uses NumberFlow (continuous morphing)
 * - Custom format function → uses digit-slot rolling animation
 */
const AnimatedNumber = memo(({
  value,
  prefix = "",
  suffix = "",
  className,
  delay = 500,
  animateDuration = 1200,
}: AnimatedNumberProps) => {
  const [internalValue, setInternalValue] = useState<number | string>("0")
  const firstRender = useRef(true)

  useEffect(() => {
    // First render, delay the animation
    if (firstRender.current) {
      const timeout = setTimeout(() => {
        setInternalValue(value)
      }, delay)
      firstRender.current = false
      return () => clearTimeout(timeout)
    } else {
      setInternalValue(value)
    }
  }, [value, delay, animateDuration])

  const isString = typeof internalValue === "string"
  const spinTiming = {
    duration: animateDuration * TIMING_MULTIPLIER,
    easing: "cubic-bezier(0.25, 0.7, 0, 1.0)"
  }
  // String format: e.g. "$1,234.56" or "0.00%" — extract prefix/suffix and
  // infer decimal places so NumberFlow can animate the numeric portion.
  if (isString) {
    const str = internalValue as string

    // Superscript-compressed prices like "0.0⁴21": keep the superscript part
    // as a static prefix and animate the trailing numeric digits with NumberFlow.
    if (SUPERSCRIPT_RE.test(str)) {
      const superscriptMatch = str.match(/^(.*[¹²³⁴⁵⁶⁷⁸⁹])(\d+)$/)
      if (superscriptMatch) {
        const superscriptPart = superscriptMatch[1] // e.g. "0.0⁴"
        const numericTail = superscriptMatch ? superscriptMatch[2] : "0"     // e.g. "21"
        return (
          <span className={cn("inline-flex items-baseline tabular-nums", className)}>
            {prefix && <span className="inline-block" style={{ lineHeight: "1.2em" }}>{prefix}</span>}
            <span style={{ lineHeight: "1.2em" }}>{superscriptPart}</span>
            <NumberFlow
              key="number-flow-numeric-str"
              value={Number(numericTail)}
              locales="en-US"
              format={{ minimumFractionDigits: 0, maximumFractionDigits: 0 } as unknown as Format}
              plugins={[continuous]}
              willChange
              isolate
              spinTiming={spinTiming}
            />
            {suffix && <span className="inline-block" style={{ lineHeight: "1.2em" }}>{suffix}</span>}
          </span>
        )
      }
      // Fallback: superscript with no trailing digits — render as-is

    }

    // Match: (leading non-numeric)(numeric with optional sign, commas, decimals)(trailing non-numeric)
    const match = str.match(/^([^\d-]*?)(-?[\d,]+(?:\.\d+)?)([^\d]*)$/)
    const derivedPrefix = (match?.[1] ?? "") || prefix
    const numericStr = match?.[2] ?? str
    const derivedSuffix = (match?.[3] ?? "") || suffix
    const normalizedNumeric = numericStr.replace(/,/g, "")
    const decimalPlaces = normalizedNumeric.includes(".")
      ? (normalizedNumeric.split(".")[1]?.length ?? 0)
      : 0
    const parsedFromString = Number(normalizedNumeric)
    const safeNumeric = Number.isFinite(parsedFromString) ? parsedFromString : 0
    const inferredFormat: Intl.NumberFormatOptions = {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }
    return (
      <span className={cn("inline-flex items-baseline tabular-nums", className)}>
        {derivedPrefix && <span className="inline-block" style={{ lineHeight: "1.2em" }}>{derivedPrefix}</span>}
        <NumberFlow
          key="number-flow-numeric-str"
          value={safeNumeric}
          locales="en-US"
          format={inferredFormat as unknown as Format}
          plugins={[continuous]}
          willChange
          isolate
          spinTiming={spinTiming}
        />
        {derivedSuffix && <span className="inline-block" style={{ lineHeight: "1.2em" }}>{derivedSuffix}</span>}
      </span>
    )
  }

  const inferredFormat: Intl.NumberFormatOptions = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }

  const numericFromPrimitive = Number(internalValue)
  const safePrimitive = Number.isFinite(numericFromPrimitive) ? numericFromPrimitive : 0

  return (
    <span className={cn("inline-flex items-baseline tabular-nums", className)}>
      {prefix && <span className="inline-block" style={{ lineHeight: "1.2em" }}>{prefix}</span>}
      <NumberFlow
        key="number-flow-numeric-str"
        value={safePrimitive}
        locales="en-US"
        format={inferredFormat as unknown as Format}
        plugins={[continuous]}
        willChange
        isolate
        spinTiming={spinTiming}
      />
      {suffix && <span className="inline-block" style={{ lineHeight: "1.2em" }}>{suffix}</span>}
    </span>
  )

})

AnimatedNumber.displayName = "AnimatedNumber"

export default AnimatedNumber
