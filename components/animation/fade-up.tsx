"use client"

import { AnimatePresence, motion } from "framer-motion"

export const fadeUpVariant = {
  initial: { opacity: 0, x: 100 },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
    },
  },
}
import { ReactNode } from "react"

const FadeUpAnimation = ({ children, className }: { children: ReactNode; className?: string }) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div variants={fadeUpVariant} initial="initial" animate="animate" className={className}>
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

export default FadeUpAnimation
