import type {
  CmsLinkItem,
  LandingNavigationContent,
} from '@/features/cms/navigation/navigation.types'
import { DropEmblemDecor } from '@/shared/components/brand/DropEmblemDecor'
import { AnvlLogoImage } from '@/shared/components/brand/AnvlLogoImage'
import { Container } from '@/shared/components/ui/Container'
import { SafeLink } from '@/shared/components/ui/SafeLink'
import { stripAngleBracketTags } from '@/shared/lib/stripAngleBracketTags'
import { cn } from '@/shared/lib/cn'

interface SiteFooterProps {
  navigation: LandingNavigationContent
  className?: string
}

function FooterLink({ link }: { link: CmsLinkItem }) {
  return (
    <SafeLink
      href={link.href}
      className="focus-ring inline-block text-sm text-[var(--color-text-muted)] no-underline transition-colors hover:text-[var(--color-heading)]"
    >
      {stripAngleBracketTags(link.label)}
    </SafeLink>
  )
}

/**
 * Storefront footer — brand block + navigation, closed by a thin legal bar.
 *
 * Deliberately lean: the placeholder newsletter form and the dead `#` social
 * links were removed (nothing real was wired behind them). The drop emblem still
 * watermarks the panel, and the brand tagline + "Forged Under Pressure"
 * micro-caption are retained. Footer links come from the website-layout groups
 * (titled groups render as columns; an untitled/flat set renders as one tidy
 * multi-column grid).
 */
export function SiteFooter({ navigation, className }: SiteFooterProps) {
  const year = new Date().getFullYear()

  const visibleFooterLinks = (navigation.footerLinks ?? []).filter(
    (link) => link.isVisible !== false,
  )
  const groups = (navigation.footerLinkGroups ?? [])
    .map((group) => ({
      ...group,
      links: group.links.filter((l) => l.isVisible !== false),
    }))
    .filter((group) => group.links.length > 0)

  const hasTitledGroups = groups.some((group) => Boolean(group.title?.trim()))
  const flatLinks: CmsLinkItem[] = groups.length
    ? groups.flatMap((group) => group.links)
    : visibleFooterLinks

  const emblemSrc =
    navigation.activeDropEmblemSrc?.trim() ||
    navigation.footerDecorativeEmblemFallbackSrc?.trim()

  const footerLogoSrc = navigation.footerLogoSrc?.trim()
  const tagline = stripAngleBracketTags(navigation.footerTagline)
  const microCaption = stripAngleBracketTags(navigation.footerMicroCaption)
  const copyright =
    navigation.copyrightSuffix?.trim() || 'ANVL Athletics. All rights reserved.'

  return (
    <footer className={cn('relative overflow-hidden border-t border-[var(--color-line)]', className)}>
      <DropEmblemDecor
        src={emblemSrc}
        alt=""
        presentationOnly
        className="pointer-events-none absolute -right-32 top-1/2 z-0 h-[150%] w-auto -translate-y-1/2 text-[var(--color-heading)] opacity-[0.04] md:-right-16 md:opacity-[0.05]"
      />

      <Container className="relative z-10 py-14 md:py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr] md:gap-16 lg:gap-24">
          {/* Brand */}
          <div className="mx-auto flex max-w-md flex-col items-center text-center md:mx-0 md:items-start md:text-left">
            {footerLogoSrc ? (
              <img
                src={footerLogoSrc}
                alt="ANVL"
                className="h-14 w-auto max-w-[min(100%,260px)] object-contain md:h-16"
              />
            ) : (
              <AnvlLogoImage
                variant="stacked"
                className="h-14 w-auto max-w-[min(100%,260px)] md:h-16"
              />
            )}
            {tagline ? (
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-[var(--color-text-muted)]">
                {tagline}
              </p>
            ) : null}
            <span
              aria-hidden="true"
              className="mt-6 block h-px w-12 bg-[var(--color-highlight)]/60"
            />
          </div>

          {/* Navigation */}
          {hasTitledGroups ? (
            <div className="grid grid-cols-2 gap-x-8 gap-y-10 text-center sm:grid-cols-3 md:text-left">
              {groups.map((group) => (
                <nav key={group.id} aria-label={group.title || 'Footer'} className="space-y-3">
                  {group.title ? (
                    <h3 className="anvl-micro mb-1 text-[10px] font-normal text-[var(--color-highlight-bright)]">
                      {stripAngleBracketTags(group.title)}
                    </h3>
                  ) : null}
                  <ul className="space-y-3">
                    {group.links.map((link) => (
                      <li key={link.id ?? link.href}>
                        <FooterLink link={link} />
                      </li>
                    ))}
                  </ul>
                </nav>
              ))}
            </div>
          ) : (
            <nav
              aria-label="Footer"
              className="grid grid-cols-2 justify-items-center gap-x-8 gap-y-3 self-start text-center sm:grid-cols-3 md:justify-items-start md:text-left"
            >
              {flatLinks.map((link) => (
                <FooterLink key={link.id ?? link.href} link={link} />
              ))}
            </nav>
          )}
        </div>
      </Container>

      {/* Legal bar */}
      <div className="relative z-10 border-t border-[var(--color-line)]">
        <Container className="flex flex-col items-center gap-2 py-6 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p className="text-xs text-[var(--color-text-muted)]">
            © {year} {stripAngleBracketTags(copyright)}
          </p>
          {microCaption ? (
            <p className="anvl-micro text-[var(--color-text-muted)]">{microCaption}</p>
          ) : null}
        </Container>
      </div>
    </footer>
  )
}
