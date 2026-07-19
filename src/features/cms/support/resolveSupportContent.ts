import { SUPPORT_CONTENT_DEFAULTS } from '@/features/cms/support/supportContent.defaults'
import type {
  CareProductEntry,
  FaqItem,
  SizeProductEntry,
  SupportContentConfig,
  SupportSection,
} from '@/features/cms/support/supportContent.zod'

/**
 * Render-ready support content: the CMS `support_content` blob merged over the
 * FULL designed defaults (blank string = "use the default"). Scalars fall back
 * per field; list blocks (FAQ items, section lists) fall back as a whole when
 * the CMS list is empty. Per-product care/size entries have no code default —
 * they surface only when authored, keyed by commerce product slug.
 *
 * Storefront-safe and pure — the page agent renders straight off this shape.
 */

export type ResolvedFaqItem = { id: string; question: string; answer: string }
export type ResolvedSupportSection = { id: string; heading: string; body: string }

export type ResolvedSupportContent = {
  faq: { intro: string; items: ResolvedFaqItem[] }
  contact: {
    intro: string
    email: string
    phone: string
    instagram: string
    address: string
    hours: string
  }
  shipping: { intro: string; sections: ResolvedSupportSection[] }
  returns: { intro: string; sections: ResolvedSupportSection[] }
  careGuide: {
    intro: string
    sections: ResolvedSupportSection[]
    perProduct: Record<string, CareProductEntry>
  }
  sizeGuide: {
    intro: string
    note: string
    perProduct: Record<string, SizeProductEntry>
  }
}

const D = SUPPORT_CONTENT_DEFAULTS

function text(value: string, fallback: string): string {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : fallback
}

function resolveSections(
  cms: SupportSection[],
  fallback: SupportSection[],
): ResolvedSupportSection[] {
  const authored = cms.filter(
    (s) => s.heading.trim().length > 0 || s.body.trim().length > 0,
  )
  const source = authored.length > 0 ? authored : fallback
  return source.map((s, i) => ({
    id: s.id.trim() || `section-${i}`,
    heading: s.heading,
    body: s.body,
  }))
}

function resolveFaqItems(cms: FaqItem[], fallback: FaqItem[]): ResolvedFaqItem[] {
  const authored = cms.filter(
    (s) => s.question.trim().length > 0 || s.answer.trim().length > 0,
  )
  const source = authored.length > 0 ? authored : fallback
  return source.map((s, i) => ({
    id: s.id.trim() || `faq-${i}`,
    question: s.question,
    answer: s.answer,
  }))
}

/**
 * Merge the CMS support blob over the designed defaults.
 * `config` is the parsed `support_content`; the returned shape is render-ready.
 */
export function resolveSupportContent(
  config: SupportContentConfig,
): ResolvedSupportContent {
  return {
    faq: {
      intro: text(config.faq.intro, D.faq.intro),
      items: resolveFaqItems(config.faq.items, D.faq.items),
    },
    contact: {
      intro: text(config.contact.intro, D.contact.intro),
      email: text(config.contact.email, D.contact.email),
      phone: text(config.contact.phone, D.contact.phone),
      instagram: text(config.contact.instagram, D.contact.instagram),
      address: text(config.contact.address, D.contact.address),
      hours: text(config.contact.hours, D.contact.hours),
    },
    shipping: {
      intro: text(config.shipping.intro, D.shipping.intro),
      sections: resolveSections(config.shipping.sections, D.shipping.sections),
    },
    returns: {
      intro: text(config.returns.intro, D.returns.intro),
      sections: resolveSections(config.returns.sections, D.returns.sections),
    },
    careGuide: {
      intro: text(config.careGuide.intro, D.careGuide.intro),
      sections: resolveSections(config.careGuide.sections, D.careGuide.sections),
      // Per-product care notes have no code default — pass authored entries through.
      perProduct: config.careGuide.perProduct,
    },
    sizeGuide: {
      intro: text(config.sizeGuide.intro, D.sizeGuide.intro),
      note: text(config.sizeGuide.note, D.sizeGuide.note),
      // Per-product size tables have no code default — pass authored entries through.
      perProduct: config.sizeGuide.perProduct,
    },
  }
}
