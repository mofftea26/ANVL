import { Link } from '@tanstack/react-router'
import type { AnchorHTMLAttributes, ReactNode } from 'react'
import {
  isExternalHref,
  sanitizeHref,
  type SanitizeHrefOptions,
} from '@/shared/lib/url'

/**
 * Renders a CMS-driven link safely. Funnels the raw href through
 * {@link sanitizeHref}: external URLs (http/https/mailto/tel) render as
 * `<a target="_blank" rel="noreferrer noopener">`; relative URLs render as
 * TanStack `<Link to>`; any rejected URL renders as a non-interactive
 * `<span>` so the label is still visible.
 *
 * Use this at every boundary where a CMS string flows into the DOM as a
 * link. See `.cursor/rules/10-security.mdc` and audit SEC-04 / Phase B3.
 *
 * @example
 * ```tsx
 * <SafeLink href={cms.announcementBar.ctaHref} className="..." >
 *   {cms.announcementBar.ctaLabel}
 * </SafeLink>
 * ```
 */
export type SafeLinkProps = {
  href: string | null | undefined
  children: ReactNode
  className?: string
  /** Forwarded onClick for closing drawers/etc. on nav. */
  onClick?: () => void
  /** Sanitizer options (defaults are safe for storefront CMS values). */
  sanitizeOptions?: SanitizeHrefOptions
  /**
   * Force `<a target="_blank">` semantics even for relative URLs. Default
   * follows the URL type returned by sanitizeHref.
   */
  forceExternal?: boolean
  /** Aria label, when the visible text isn't descriptive enough. */
  'aria-label'?: string
} & Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  'href' | 'children' | 'onClick' | 'className' | 'aria-label'
>

export function SafeLink({
  href,
  children,
  className,
  onClick,
  sanitizeOptions,
  forceExternal,
  ...rest
}: SafeLinkProps) {
  const safe = sanitizeHref(href, sanitizeOptions)
  if (safe === null) {
    return <span className={className}>{children}</span>
  }
  const external = forceExternal === true || isExternalHref(safe)
  if (external) {
    return (
      <a
        {...rest}
        href={safe}
        target={rest.target ?? '_blank'}
        rel={rest.rel ?? 'noreferrer noopener'}
        className={className}
        onClick={onClick}
      >
        {children}
      </a>
    )
  }
  return (
    <Link
      // Anchor pass-throughs (data-*, aria-*, etc.) flow through TanStack
      // Link onto the underlying <a>. `target`/`rel` deliberately omitted
      // for internal links — use forceExternal if you want them.
      {...(rest as Record<string, unknown>)}
      to={safe}
      className={className}
      onClick={onClick}
    >
      {children}
    </Link>
  )
}
