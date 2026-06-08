import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { SafeLink } from '@/shared/components/ui/SafeLink'
import { cn } from '@/shared/lib/cn'

interface OathCtaLinkProps {
  href: string
  variant?: 'primary' | 'secondary'
  className?: string
  children: ReactNode
}

const BASE =
  'focus-ring group relative inline-flex h-11 min-w-0 items-center justify-center gap-1.5 overflow-hidden rounded-md px-3.5 text-[0.7rem] font-semibold uppercase tracking-[0.13em] no-underline transition-[color,background-color,border-color,box-shadow,transform] duration-300 active:translate-y-px sm:h-12 sm:gap-2 sm:px-7 sm:tracking-[0.2em] sm:text-xs'

const VARIANTS: Record<'primary' | 'secondary', string> = {
  // Forged ember slab with an ember glow that deepens on hover.
  primary:
    'border border-[var(--color-ember)] bg-[var(--color-ember)] text-[var(--color-bg)] shadow-[0_10px_30px_-14px_var(--color-ember)] hover:shadow-[0_16px_38px_-12px_var(--color-ember)]',
  // Ghost outline that ignites to ember on hover.
  secondary:
    'border border-[var(--color-heading)]/25 bg-[var(--color-heading)]/[0.04] text-[var(--color-heading)] backdrop-blur-sm hover:border-[var(--color-ember)] hover:text-[var(--color-ember-bright)]',
}

/**
 * Branded CTA. Renders a native anchor for in-page hash targets (so the router
 * does not intercept smooth-scroll jumps) and the sanitized {@link SafeLink} for
 * real routes/URLs. The primary variant carries a nudging arrow and a sheen sweep.
 */
export function OathCtaLink({
  href,
  variant = 'primary',
  className,
  children,
}: OathCtaLinkProps) {
  const classes = cn(BASE, VARIANTS[variant], className)
  const isPrimary = variant === 'primary'
  const content = (
    <>
      <span className="relative z-10 inline-flex items-center gap-1.5 whitespace-nowrap sm:gap-2">
        {children}
        {isPrimary ? (
          <ArrowRight
            size={15}
            aria-hidden="true"
            className="shrink-0 transition-transform duration-300 group-hover:translate-x-0.5"
          />
        ) : null}
      </span>
      {isPrimary ? (
        <span
          aria-hidden="true"
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-white/0 via-white/30 to-white/0 transition-transform duration-500 group-hover:translate-x-full"
        />
      ) : null}
    </>
  )

  if (href.startsWith('#')) {
    return (
      <a href={href} className={classes}>
        {content}
      </a>
    )
  }
  return (
    <SafeLink href={href} className={classes}>
      {content}
    </SafeLink>
  )
}
