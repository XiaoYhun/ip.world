"use client"

import { AnimatePresence, motion } from "framer-motion"

export const fadeInOutVariant = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
}

import { ReactNode } from "react"

const FadeInOutAnimation = ({ children, className }: { children: ReactNode; className?: string }) => {
  return (
    <AnimatePresence>
      <motion.div
        key="fade-box"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

export default FadeInOutAnimation
