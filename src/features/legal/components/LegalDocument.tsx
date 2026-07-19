import { Container, Section } from '@/shared/components/ui'
import { DocHero, ProseBody } from '@/features/support/components'
import type { ResolvedLegalPage } from '@/features/cms/legal/resolveLegalContent'

/**
 * The cohesive legal-document template: a forged masthead (title + "Last
 * updated" + intro), a sticky in-page table of contents on desktop, and the
 * sections rendered as accessible `<section>`s with paragraph-split bodies.
 *
 * Static HTML only — the TOC is anchor links (`#section-id`), no client JS — so
 * long policies stay fast and are reduced-motion-safe by construction.
 */
export function LegalDocument({
  page,
  eyebrow = 'Legal',
}: {
  page: ResolvedLegalPage
  eyebrow?: string
}) {
  const sections = page.sections
  const showToc = sections.length > 1

  return (
    <>
      <DocHero eyebrow={eyebrow} title={page.title} intro={page.intro} updatedAt={page.updatedAt} />

      <Section>
        <Container className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
          {showToc ? (
            <nav
              aria-label="On this page"
              className="hidden lg:block lg:self-start lg:sticky lg:top-[calc(var(--anvl-header-h)+2rem)]"
            >
              <p className="anvl-micro mb-4 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
                On this page
              </p>
              <ul className="space-y-2.5 border-l border-[var(--color-line)]">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="focus-ring -ml-px block border-l border-transparent py-0.5 pl-4 text-sm text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-highlight)] hover:text-[var(--color-heading)]"
                    >
                      {section.heading}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ) : (
            // Keep the content column aligned even without a TOC.
            <div className="hidden lg:block" aria-hidden="true" />
          )}

          <div className="min-w-0 max-w-3xl space-y-12 md:space-y-16">
            {sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-[calc(var(--anvl-header-h)+1.5rem)]"
              >
                <h2 className="anvl-heading text-2xl text-[var(--color-heading)] md:text-3xl">
                  {section.heading}
                </h2>
                <hr className="anvl-highlight-rule mt-4 max-w-[6rem]" />
                <ProseBody body={section.body} className="mt-5" />
              </section>
            ))}
          </div>
        </Container>
      </Section>
    </>
  )
}
