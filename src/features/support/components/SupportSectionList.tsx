import { Container, Section } from '@/shared/components/ui'
import { GuideSectionHeader } from './GuideSectionHeader'
import { ProseBody } from './ProseBody'
import type { ResolvedSupportSection } from '@/features/cms/support/resolveSupportContent'

/**
 * Renders a support page's section list (shipping, returns, care-guide globals)
 * as accessible `<section>`s — the shared guide title block, then the
 * paragraph-split body. Static HTML (no client JS), so it stays fast and is
 * reduced-motion-safe by construction.
 *
 * The body is rendered here rather than through the header's `intro` slot so it
 * keeps the container's full reading measure; the header's own intro is clamped
 * for the wide guide sections.
 *
 * The first section's header skips its own rule — this list always follows
 * the page masthead, whose molten rule and fade-out already separate it, so a
 * second full-width rule one `Section` padding below would double up. Every later section still gets
 * its own rule; it is the only separator between consecutive body sections.
 */
export function SupportSectionList({ sections }: { sections: ResolvedSupportSection[] }) {
  if (sections.length === 0) return null
  return (
    <Section>
      <Container className="max-w-3xl space-y-12 md:space-y-16">
        {sections.map((section, index) => (
          <section key={section.id} id={section.id} className="scroll-mt-[var(--anvl-header-h)]">
            <GuideSectionHeader title={section.heading} rule={index !== 0} />
            <ProseBody body={section.body} className="mt-5" />
          </section>
        ))}
      </Container>
    </Section>
  )
}
