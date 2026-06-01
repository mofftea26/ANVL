import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

export type ShowcaseBeat = 'hero' | 'manifesto' | 'products' | 'closing'

export type AnimatedSectionProps = {
  beat: ShowcaseBeat
  children: ReactNode
  className?: string
  /** When true, beat layer accepts pointer events (hero CTAs). */
  interactive?: boolean
}

const baseLayerClass =
  'pointer-events-none absolute inset-0 flex w-full max-w-full items-center justify-center overflow-x-hidden px-4 py-16 will-change-[transform,opacity,filter] md:px-8 md:py-24'

/**
 * Pinned beat layer — opacity/transform driven by the master GSAP timeline.
 */
export function AnimatedSection({
  beat,
  children,
  className,
  interactive = false,
}: AnimatedSectionProps) {
  return (
    <div
      data-brand-beat={beat}
      className={cn(baseLayerClass, interactive && 'pointer-events-auto', className)}
    >
      {children}
    </div>
  )
}
