import type { ReactNode } from 'react'
import { ArrowRight } from '@/shared/icons'
import { SafeLink } from '@/shared/components/ui/SafeLink'
import { buttonVariants } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'

interface AboutCtaLinkProps {
  href: string
  variant?: 'primary' | 'secondary'
  className?: string
  children: ReactNode
  /**
   * Orb accent (#RRGGBB). When set, the CTA is tinted to the orb it belongs
   * to, so a button inside a modal reads as part of that section rather than
   * as generic site chrome.
   */
  accent?: string
}

/**
 * Branded CTA for the About page. Renders the shared {@link buttonVariants} so
 * these CTAs are visually identical to the rest of the site. CMS-editable
 * label/href — hrefs are sanitized via {@link SafeLink}; in-page hash targets
 * render a native anchor so the router does not intercept smooth-scroll jumps.
 */
export function AboutCtaLink({
  href,
  variant = 'primary',
  className,
  children,
  accent,
}: AboutCtaLinkProps) {
  const classes = cn(buttonVariants({ variant, size: 'lg' }), 'group gap-2 no-underline', className)
  const isPrimary = variant === 'primary'

  /**
   * Tint via inline styles rather than utility classes: the orb colour is
   * arbitrary CMS hex, so there is no Tailwind class to reach for. The shared
   * primary variant paints a background-image GRADIENT — `backgroundColor`
   * alone loses to it silently (the champagne-button-with-purple-border bug),
   * so the tint rebuilds the same top-lit gradient in the orb's colour. Text
   * forces near-black (every orb tint is a mid-to-light industrial tone, so
   * bone-on-accent would fail contrast); the secondary keeps its transparent
   * fill and takes the accent on its border and label.
   */
  const accentStyle: React.CSSProperties | undefined = accent
    ? isPrimary
      ? {
          backgroundImage: `linear-gradient(to bottom, color-mix(in oklab, ${accent} 82%, white), ${accent})`,
          borderColor: `color-mix(in oklab, ${accent} 70%, white)`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.22), 0 10px 26px -10px color-mix(in oklab, ${accent} 75%, transparent)`,
          color: 'var(--anvl-black, #0B0B0C)',
        }
      : { borderColor: accent, color: accent }
    : undefined
  const content = (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      {children}
      {isPrimary ? (
        <ArrowRight
          size={17}
          aria-hidden="true"
          className="shrink-0 transition-transform duration-300 group-hover:translate-x-0.5"
        />
      ) : null}
    </span>
  )

  if (href.startsWith('#')) {
    return (
      <a href={href} className={classes} style={accentStyle}>
        {content}
      </a>
    )
  }
  return (
    <SafeLink href={href} className={classes} style={accentStyle}>
      {content}
    </SafeLink>
  )
}
