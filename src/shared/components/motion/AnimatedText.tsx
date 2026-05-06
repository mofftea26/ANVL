import { motion } from 'framer-motion'
import type { PropsWithChildren } from 'react'

export function AnimatedText({ children }: PropsWithChildren) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
