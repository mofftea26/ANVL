import { Container, Section } from '@/shared/components/ui'
import { ProseBody } from './ProseBody'
import type { ResolvedSupportSection } from '@/features/cms/support/resolveSupportContent'

/**
 * Renders a support page's section list (shipping, returns, care-guide globals)
 * as accessible `<section>`s — a forged heading with a highlight rule, then the
 * paragraph-split body. Static HTML (no client JS), so it stays fast and is
 * reduced-motion-safe by construction.
 */
export function SupportSectionList({ sections }: { sections: ResolvedSupportSection[] }) {
  if (sections.length === 0) return null
  return (
    <Section>
      <Container className="max-w-3xl space-y-12 md:space-y-16">
        {sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-[var(--anvl-header-h)]">
            <h2 className="anvl-heading text-2xl text-[var(--color-heading)] md:text-3xl">
              {section.heading}
            </h2>
            <hr className="anvl-highlight-rule mt-4 max-w-[6rem]" />
            <ProseBody body={section.body} className="mt-5" />
          </section>
        ))}
      </Container>
    </Section>
  )
}
