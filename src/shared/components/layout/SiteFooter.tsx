import { toast } from 'sonner'
import type { LandingNavigationContent } from '@/features/admin/landing-cms/landingCms.types'
import { DropEmblemDecor } from '@/shared/components/brand/DropEmblemDecor'
import { AnvlLogoImage } from '@/shared/components/brand/AnvlLogoImage'
import { Container } from '@/shared/components/ui/Container'
import { Input } from '@/shared/components/ui/Input'
import { Button } from '@/shared/components/ui/Button'
import { SafeLink } from '@/shared/components/ui/SafeLink'
import { stripAngleBracketTags } from '@/shared/lib/stripAngleBracketTags'

interface SiteFooterProps {
  navigation: LandingNavigationContent
}

export function SiteFooter({ navigation }: SiteFooterProps) {
  const year = new Date().getFullYear()

  const visibleFooterLinks = (navigation.footerLinks ?? []).filter(
    (link) => link.isVisible !== false,
  )

  const groups = navigation.footerLinkGroups ?? []

  const emblemSrc =
    navigation.activeDropEmblemSrc?.trim() ||
    navigation.footerDecorativeEmblemFallbackSrc?.trim()

  const footerLogoSrc = navigation.footerLogoSrc?.trim()

  const copyright =
    navigation.copyrightSuffix?.trim() ||
    'ANVL Athletics. All rights reserved.'

  const social = navigation.socialLinks ?? []

  return (
    <footer className="relative mt-16 overflow-hidden border-t border-[var(--color-line)] py-12">
      <DropEmblemDecor
        src={emblemSrc}
        alt=""
        presentationOnly
        className="pointer-events-none absolute -right-32 top-1/2 z-0 h-[140%] w-auto -translate-y-1/2 text-[var(--color-heading)] opacity-[0.04] md:-right-20 md:opacity-[0.05]"
      />
      <Container className="relative z-10 grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          {footerLogoSrc ? (
            <img
              src={footerLogoSrc}
              alt="ANVL"
              className="h-14 w-auto max-w-[min(100%,280px)] object-contain md:h-16"
            />
          ) : (
            <AnvlLogoImage
              variant="stacked"
              className="h-14 w-auto max-w-[min(100%,280px)] md:h-16"
            />
          )}
          <p className="mt-3 max-w-sm text-sm text-[var(--color-text-muted)]">
            {stripAngleBracketTags(navigation.footerTagline)}
          </p>
          <p className="anvl-micro mt-4">
            {stripAngleBracketTags(navigation.footerMicroCaption)}
          </p>
        </div>

        {groups.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2 md:block md:space-y-8">
            {groups.map((group) => {
              const links = group.links.filter((l) => l.isVisible !== false)
              if (!links.length) return null
              return (
                <nav key={group.id} className="space-y-2 text-sm">
                  {group.title ? (
                    /* RESP-10 — promote to heading so the footer participates
                       in the document outline; visual styling unchanged. */
                    <h3 className="anvl-micro mb-2 text-[10px] font-normal text-[var(--color-text-muted)]">
                      {stripAngleBracketTags(group.title)}
                    </h3>
                  ) : null}
                  {links.map((link, index) => (
                    <span key={link.id ?? link.href}>
                      <SafeLink href={link.href} className="focus-ring">
                        {stripAngleBracketTags(link.label)}
                      </SafeLink>
                      {index < links.length - 1 ? <br /> : null}
                    </span>
                  ))}
                </nav>
              )
            })}
          </div>
        ) : (
          <nav className="space-y-2 text-sm">
            {visibleFooterLinks.map((link, index) => (
              <span key={link.id ?? link.href}>
                <SafeLink href={link.href} className="focus-ring">
                  {stripAngleBracketTags(link.label)}
                </SafeLink>
                {index < visibleFooterLinks.length - 1 ? <br /> : null}
              </span>
            ))}
          </nav>
        )}

        <div>
          {/* RESP-10 — promote newsletter title to <h3> for document outline. */}
          <h3 className="anvl-micro mb-3 font-normal">
            {stripAngleBracketTags(navigation.newsletterTitle)}
          </h3>
          {/* RESP-10 — wrap in <form> so the Enter key submits and screen
              readers announce the form context. The handler is a placeholder
              toast until the real newsletter backend lands. */}
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              toast.success('Thanks — we’ll be in touch.')
              event.currentTarget.reset()
            }}
          >
            <Input
              type="email"
              name="email"
              required
              aria-label="Email for newsletter"
              placeholder={navigation.newsletterPlaceholder}
            />
            <Button type="submit">{navigation.newsletterButtonText}</Button>
          </form>
          {social.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-3 text-xs">
              {social.map((item) => (
                <li key={item.id}>
                  <SafeLink
                    href={item.href}
                    forceExternal
                    className="focus-ring text-[var(--color-text-muted)] underline-offset-4 hover:text-[var(--color-heading)] hover:underline"
                    aria-label={
                      item.label.trim()
                        ? `${item.label} (opens in a new tab)`
                        : 'Social profile (opens in a new tab)'
                    }
                  >
                    {item.label}
                  </SafeLink>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-[var(--color-text-muted)]">
              Social links are configured in Website layout (admin).
            </p>
          )}
        </div>
      </Container>
      <Container className="relative z-10 mt-8 border-t border-[var(--color-line)] pt-6 text-xs text-[var(--color-text-muted)]">
        <p>
          © {year} {stripAngleBracketTags(copyright)}
        </p>
      </Container>
    </footer>
  )
}
