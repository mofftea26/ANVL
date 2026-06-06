import type { ReactNode } from 'react'
import { SafeLink } from '@/shared/components/ui/SafeLink'
import { cn } from '@/shared/lib/cn'

interface OathCtaLinkProps {
  href: string
  variant?: 'primary' | 'secondary'
  className?: string
  children: ReactNode
}

const BASE =
  'focus-ring group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-md px-6 text-sm font-semibold uppercase tracking-[0.12em] no-underline'

const VARIANTS: Record<'primary' | 'secondary', string> = {
  primary:
    'border border-[var(--color-ember)] bg-[var(--color-ember)] text-[var(--color-bg)]',
  secondary:
    'border border-[var(--color-line)] bg-[var(--color-surface)]/60 text-[var(--color-text)] backdrop-blur hover:border-[color-mix(in_oklab,var(--color-ember)_55%,var(--color-line))] hover:bg-[var(--color-surface-elevated)]',
}

/**
 * Branded CTA. Renders a native anchor for in-page hash targets (so the router
 * does not intercept smooth-scroll jumps) and the sanitized {@link SafeLink} for
 * real routes/URLs.
 */
export function OathCtaLink({
  href,
  variant = 'primary',
  className,
  children,
}: OathCtaLinkProps) {
  const classes = cn(BASE, VARIANTS[variant], className)
  const content = (
    <>
      <span className="relative z-10">{children}</span>
      {variant === 'primary' ? (
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
