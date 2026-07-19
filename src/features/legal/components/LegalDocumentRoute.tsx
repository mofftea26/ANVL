import { SafeLink } from '@/shared/components/ui/SafeLink'
import { usePreviewDraft } from '@/features/cms/preview'
import { resolveLegalPage } from '@/features/cms/legal/resolveLegalContent'
import type { LegalContentConfig, LegalPageKey } from '@/features/cms/legal/legalContent.zod'
import {
  DocFooterCta,
  DOC_CTA_PRIMARY_CLASS,
  DOC_CTA_SECONDARY_CLASS,
} from '@/features/support/components'
import { LegalDocument } from './LegalDocument'

/** Sibling legal pages linked from the footer band (excludes the current one). */
const LEGAL_LINKS: Record<LegalPageKey, { href: string; label: string }> = {
  privacy: { href: '/privacy', label: 'Privacy' },
  terms: { href: '/terms', label: 'Terms' },
  cookies: { href: '/cookie-policy', label: 'Cookies' },
  accessibility: { href: '/accessibility', label: 'Accessibility' },
}

const LEGAL_KEY_ORDER: LegalPageKey[] = ['privacy', 'terms', 'cookies', 'accessibility']

/**
 * Thin route body for every legal page. Prefers the admin live-preview draft
 * (`usePreviewDraft().legalContent`) over the published config so unsaved edits
 * render inside the CMS preview iframe; every real visitor gets published copy.
 */
export function LegalDocumentRoute({
  pageKey,
  publishedContent,
}: {
  pageKey: LegalPageKey
  publishedContent: LegalContentConfig
}) {
  const previewDraft = usePreviewDraft()
  const content = previewDraft?.legalContent ?? publishedContent
  const page = resolveLegalPage(content, pageKey)

  const siblings = LEGAL_KEY_ORDER.filter((key) => key !== pageKey).map((key) => LEGAL_LINKS[key])

  return (
    <>
      <LegalDocument page={page} />
      <DocFooterCta message="Questions about how we handle your data or your rights? Reach out any time.">
        <SafeLink href="/contact" className={DOC_CTA_PRIMARY_CLASS}>
          Contact us
        </SafeLink>
        {siblings.slice(0, 2).map((link) => (
          <SafeLink key={link.href} href={link.href} className={DOC_CTA_SECONDARY_CLASS}>
            {link.label}
          </SafeLink>
        ))}
      </DocFooterCta>
    </>
  )
}
