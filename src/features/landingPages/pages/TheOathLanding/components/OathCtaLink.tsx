import type { ReactNode } from 'react'
import { ArrowRight } from '@/shared/icons'
import { SafeLink } from '@/shared/components/ui/SafeLink'
import { buttonVariants } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'

interface OathCtaLinkProps {
  href: string
  variant?: 'primary' | 'secondary'
  className?: string
  children: ReactNode
}

/**
 * Branded CTA for The Oath. Renders the shared {@link buttonVariants} so the
 * landing CTAs are visually identical to the buttons used across the rest of
 * the site (just as links, not `<button>`s). CMS-editable label/href — hrefs
 * are sanitized via {@link SafeLink}; in-page hash targets render a native
 * anchor so the router does not intercept smooth-scroll jumps. Magnetic hover
 * + the custom cursor attach in the desktop motion branch via `data-magnetic` /
 * `data-cursor` (no-op on touch/static).
 */
export function OathCtaLink({
  href,
  variant = 'primary',
  className,
  children,
}: OathCtaLinkProps) {
  const classes = cn(
    buttonVariants({ variant, size: 'lg' }),
    'group gap-2 no-underline',
    className,
  )
  const isPrimary = variant === 'primary'
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
      <a href={href} className={classes} data-magnetic data-cursor="cta">
        {content}
      </a>
    )
  }
  return (
    <SafeLink href={href} className={classes} data-magnetic data-cursor="cta">
      {content}
    </SafeLink>
  )
}
