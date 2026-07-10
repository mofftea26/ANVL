import { motion } from 'framer-motion'
import type { PropsWithChildren } from 'react'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'

export function RevealOnScroll({ children }: PropsWithChildren) {
  const reduced = useReducedMotion()

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: reduced ? 0 : 0.4 }}
    >
      {children}
    </motion.div>
  )
}
