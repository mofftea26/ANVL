import { z } from 'zod'

/**
 * Coming Soon site-mode configuration — the CMS-controlled blob for the
 * pre-launch reveal page. Mirrors how `shop_config` flows: edited locally →
 * `adminCmsRemoteSync` → `cms_settings.coming_soon` +
 * `storefront_publication.coming_soon` → SSR projection.
 *
 * `enabled` is the master switch: when true, every public storefront route
 * renders the Coming Soon experience instead of the site (admin stays
 * reachable — see the gate in `src/routes/__root.tsx`).
 *
 * Every field carries a safe default via `.catch(...)` so partial, legacy, or
 * tampered blobs never crash a render (removed legacy keys — the old CTA
 * button fields — are silently stripped). There is NO color here: the page
 * derives color from the theme's CSS variables plus its own page-scoped
 * champagne accent.
 */

export const COMING_SOON_LOGO_VARIANTS = ['crest', 'wordmark', 'custom'] as const
export type ComingSoonLogoVariant = (typeof COMING_SOON_LOGO_VARIANTS)[number]

export const COMING_SOON_THEME_VARIANTS = ['champagne', 'oath'] as const
export type ComingSoonThemeVariant = (typeof COMING_SOON_THEME_VARIANTS)[number]

const logoVariantSchema = z.enum(COMING_SOON_LOGO_VARIANTS)
const themeVariantSchema = z.enum(COMING_SOON_THEME_VARIANTS)

export const DEFAULT_COMING_SOON_CONFIG = {
  enabled: false,

  // Copy
  eyebrowText: 'Drop 01 — The Oath',
  headline: 'A New Standard Is Being Forged',
  subheadline: 'Premium performance engineered beyond expectation.',
  bodyText:
    'ANVL Athletics is preparing to introduce something Lebanon has never seen before — a new benchmark in premium athletic wear, quality, and performance. Engineered to world-class standards and shaped with the best in the industry worldwide, this is not just a drop. It is the beginning of a new standard.',
  tagline: 'FORGED UNDER PRESSURE',

  // Countdown (disabled until a date is set in the CMS)
  countdownEnabled: false,
  /** ISO local datetime, `YYYY-MM-DDTHH:mm` (interpreted in `countdownTimezone`). */
  countdownDate: '',
  /** IANA timezone name the countdown date is anchored to. */
  countdownTimezone: 'Asia/Beirut',
  countdownLabel: 'The Oath begins in',

  // Email capture
  showEmailCapture: true,
  emailCaptureTitle: 'Join early access',
  emailCapturePlaceholder: 'Enter your email',
  emailCaptureButtonText: 'Notify me',

  // Contact / social (blank = icon hidden; instagram default is the brand's)
  instagramHandle: '@anvl.athletics',
  tiktokUrl: '',
  youtubeUrl: '',
  facebookUrl: '',
  supportEmail: 'support@anvlathletics.com',

  // Assets — CMS media ids resolved via the published media index; blank
  // falls back to the bundled defaults in `public/brand/coming-soon/`.
  backgroundMediaId: '',
  ambientMediaId: '',
  logoMediaId: '',
  logoVariant: 'crest' as ComingSoonLogoVariant,
  themeVariant: 'champagne' as ComingSoonThemeVariant,

  // SEO / Open Graph (og* fall back to seo* when blank)
  seoTitle: 'ANVL Athletics — Drop 01: The Oath',
  seoDescription:
    'A new standard in premium performance athletic wear is being forged. Drop 01 — The Oath is coming soon.',
  ogTitle: '',
  ogDescription: '',
  ogImageMediaId: '',
}

export const comingSoonConfigSchema = z.object({
  enabled: z.boolean().catch(DEFAULT_COMING_SOON_CONFIG.enabled),

  eyebrowText: z.string().catch(DEFAULT_COMING_SOON_CONFIG.eyebrowText),
  headline: z.string().catch(DEFAULT_COMING_SOON_CONFIG.headline),
  subheadline: z.string().catch(DEFAULT_COMING_SOON_CONFIG.subheadline),
  bodyText: z.string().catch(DEFAULT_COMING_SOON_CONFIG.bodyText),
  tagline: z.string().catch(DEFAULT_COMING_SOON_CONFIG.tagline),

  countdownEnabled: z.boolean().catch(DEFAULT_COMING_SOON_CONFIG.countdownEnabled),
  countdownDate: z.string().catch(DEFAULT_COMING_SOON_CONFIG.countdownDate),
  countdownTimezone: z.string().catch(DEFAULT_COMING_SOON_CONFIG.countdownTimezone),
  countdownLabel: z.string().catch(DEFAULT_COMING_SOON_CONFIG.countdownLabel),

  showEmailCapture: z.boolean().catch(DEFAULT_COMING_SOON_CONFIG.showEmailCapture),
  emailCaptureTitle: z.string().catch(DEFAULT_COMING_SOON_CONFIG.emailCaptureTitle),
  emailCapturePlaceholder: z
    .string()
    .catch(DEFAULT_COMING_SOON_CONFIG.emailCapturePlaceholder),
  emailCaptureButtonText: z
    .string()
    .catch(DEFAULT_COMING_SOON_CONFIG.emailCaptureButtonText),

  instagramHandle: z.string().catch(DEFAULT_COMING_SOON_CONFIG.instagramHandle),
  tiktokUrl: z.string().catch(DEFAULT_COMING_SOON_CONFIG.tiktokUrl),
  youtubeUrl: z.string().catch(DEFAULT_COMING_SOON_CONFIG.youtubeUrl),
  facebookUrl: z.string().catch(DEFAULT_COMING_SOON_CONFIG.facebookUrl),
  supportEmail: z.string().catch(DEFAULT_COMING_SOON_CONFIG.supportEmail),

  backgroundMediaId: z.string().catch(DEFAULT_COMING_SOON_CONFIG.backgroundMediaId),
  ambientMediaId: z.string().catch(DEFAULT_COMING_SOON_CONFIG.ambientMediaId),
  logoMediaId: z.string().catch(DEFAULT_COMING_SOON_CONFIG.logoMediaId),
  logoVariant: logoVariantSchema.catch(DEFAULT_COMING_SOON_CONFIG.logoVariant),
  themeVariant: themeVariantSchema.catch(DEFAULT_COMING_SOON_CONFIG.themeVariant),

  seoTitle: z.string().catch(DEFAULT_COMING_SOON_CONFIG.seoTitle),
  seoDescription: z.string().catch(DEFAULT_COMING_SOON_CONFIG.seoDescription),
  ogTitle: z.string().catch(DEFAULT_COMING_SOON_CONFIG.ogTitle),
  ogDescription: z.string().catch(DEFAULT_COMING_SOON_CONFIG.ogDescription),
  ogImageMediaId: z.string().catch(DEFAULT_COMING_SOON_CONFIG.ogImageMediaId),
})

export type ComingSoonConfig = z.infer<typeof comingSoonConfigSchema>

/**
 * Parse any stored coming-soon blob into a complete, valid
 * {@link ComingSoonConfig}. Non-object input → full defaults. Object input →
 * per-field `.catch` defaults fill any missing/invalid keys, so old or partial
 * blobs upgrade silently (the flat shape needs no deep merge).
 */
export function parseComingSoonConfig(raw: unknown): ComingSoonConfig {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return comingSoonConfigSchema.parse({ ...DEFAULT_COMING_SOON_CONFIG })
  }
  return comingSoonConfigSchema.parse({
    ...DEFAULT_COMING_SOON_CONFIG,
    ...(raw as Record<string, unknown>),
  })
}
