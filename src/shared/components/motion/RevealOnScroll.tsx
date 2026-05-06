import { motion } from 'framer-motion'
import type { PropsWithChildren } from 'react'

export function RevealOnScroll({ children }: PropsWithChildren) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4 }}
    >
      {children}
    </motion.div>
  )
}
