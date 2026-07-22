"use client"

import { motion } from "framer-motion"
import React, { useEffect, useRef, useState } from "react"

interface AnimatedNumberProps {
  value: number
  duration?: number
  className?: string
  locale?: string
}

const DIGITS = Array.from({ length: 10 }, (_, i) => i) // 0-9

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, duration = 0.6, className = "", locale = "en-US" }) => {
  const numberStr = value.toLocaleString(locale)
  const ref = useRef<HTMLDivElement>(null)
  const [digitHeight, setDigitHeight] = useState(0)

  useEffect(() => {
    if (ref.current) {
      setDigitHeight(ref.current.offsetHeight)
    }
  }, [])

  return (
    <div className={`flex overflow-hidden ${className} p-1`}>
      {Array.from(numberStr).map((char, i) => {
        const isDigit = /\d/.test(char)
        const digit = parseInt(char)

        if (!isDigit) {
          return (
            <div key={i} className="w-[0.6em] text-center">
              {char}
            </div>
          )
        }

        return (
          <div key={i} className="w-[0.75em] overflow-hidden text-center" style={{ height: digitHeight || "1em" }}>
            <motion.div
              animate={{ y: -digit * digitHeight }}
              transition={{ duration, ease: "easeOut" }}
              className="flex flex-col"
            >
              {DIGITS.map((d) => (
                <div key={d} ref={d === 0 ? ref : null} className="leading-none" style={{ height: "1em" }}>
                  {d}
                </div>
              ))}
            </motion.div>
          </div>
        )
      })}
    </div>
  )
}

export default AnimatedNumber
