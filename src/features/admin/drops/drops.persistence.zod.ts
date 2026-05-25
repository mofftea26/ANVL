import { z } from 'zod'

const dropStatusSchema = z.enum(['active', 'inactive', 'scheduled'])

const landingActSlotKeySchema = z.enum([
  'hero',
  'manifesto',
  'dropReveal',
  'pieces',
  'materials',
  'waitlist',
])

const landingActSlotSchema = z.object({
  key: landingActSlotKeySchema,
  enabled: z.boolean(),
})

const actAnimationIntensitySchema = z.enum(['subtle', 'standard', 'bold'])

const actAnimationConfigSchema = z.object({
  enabled: z.boolean(),
  desktopOnly: z.boolean(),
  type: z.string(),
  intensity: actAnimationIntensitySchema,
})

const landingActSchema = z.object({
  id: z.string(),
  nature: z.string(),
  preset: z.string(),
  isEnabled: z.boolean(),
  sortOrder: z.number(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  eyebrow: z.string().optional(),
  body: z.string().optional(),
  animation: actAnimationConfigSchema.optional(),
  content: z.record(z.string(), z.unknown()).optional(),
  productIds: z.array(z.string()).optional(),
  media: z
    .object({
      imageUrl: z.string().optional(),
      videoUrl: z.string().optional(),
      alt: z.string().optional(),
    })
    .optional(),
  campaignMarkFallback: z.enum(['emblem', 'wordmark']).optional(),
})

export const dropThemePaletteSchema = z.object({
  id: z.string(),
  name: z.string(),
  colors: z.object({
    background: z.string(),
    surface: z.string(),
    surfaceSoft: z.string(),
    heading: z.string(),
    text: z.string(),
    mutedText: z.string(),
    line: z.string(),
    accent: z.string(),
    accentSoft: z.string(),
    heroGlow: z.string(),
    danger: z.string().optional(),
    success: z.string().optional(),
  }),
})

const dropVisualsSchema = z.object({
  emblemImageUrl: z.string(),
  emblemAlt: z.string(),
  heroImageUrl: z.string().optional(),
  logoImageUrl: z.string().optional(),
  wordmarkImageUrl: z.string().optional(),
  loadingEmblemUrl: z.string().optional(),
})

const heroCtaSchema = z.object({
  label: z.string(),
  href: z.string(),
})

const metaRowSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
})

const tenetSchema = z.object({
  id: z.string(),
  text: z.string(),
  isVisible: z.boolean(),
})

const statSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
})

const materialSchema = z.object({
  id: z.string(),
  code: z.string(),
  title: z.string(),
  description: z.string(),
  isFeatured: z.boolean(),
  isVisible: z.boolean(),
})

const bulletSchema = z.object({
  id: z.string(),
  text: z.string(),
  isVisible: z.boolean(),
})

const waitlistFormSchema = z.object({
  emailLabel: z.string(),
  emailPlaceholder: z.string(),
  firstNameLabel: z.string(),
  firstNamePlaceholder: z.string(),
  preferredProductLabel: z.string(),
  preferredProductPlaceholder: z.string(),
  submitLabel: z.string(),
  submittingLabel: z.string(),
  successToast: z.string(),
})

export const dropLandingContentSchema = z.object({
  hero: z.object({
    actLabel: z.string(),
    badgeText: z.string(),
    title: z.string(),
    subtitle: z.string(),
    primaryCta: heroCtaSchema,
    secondaryCta: heroCtaSchema,
    meta: z.array(metaRowSchema),
  }),
  manifesto: z.object({
    actLabel: z.string(),
    counterLabel: z.string(),
    heading: z.string(),
    intro: z.string(),
    tenets: z.array(tenetSchema),
  }),
  dropReveal: z.object({
    actLabel: z.string(),
    counterLabel: z.string(),
    words: z.array(z.string()),
    tagline: z.string(),
    stats: z.array(statSchema),
    primaryCta: heroCtaSchema,
    secondaryCta: heroCtaSchema,
  }),
  pieces: z.object({
    actLabel: z.string(),
    headingLineOne: z.string(),
    headingLineTwo: z.string(),
    viewAllLabel: z.string(),
    viewAllHref: z.string(),
    footerLeftText: z.string(),
    footerLinkLabel: z.string(),
    footerLinkHref: z.string(),
  }),
  materials: z.object({
    actLabel: z.string(),
    counterSuffix: z.string(),
    heading: z.string(),
    intro: z.string(),
    materials: z.array(materialSchema),
  }),
  waitlist: z.object({
    actLabel: z.string(),
    rightLabel: z.string(),
    heading: z.string(),
    intro: z.string(),
    bullets: z.array(bulletSchema),
    form: waitlistFormSchema,
  }),
})

const dropSeoSchema = z.object({
  title: z.string(),
  description: z.string(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  canonicalUrl: z.string().optional(),
  noIndex: z.boolean().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  twitterTitle: z.string().optional(),
  twitterDescription: z.string().optional(),
  twitterImage: z.string().optional(),
  structuredDataType: z
    .enum(['Organization', 'Product', 'CollectionPage', 'WebPage', 'BreadcrumbList'])
    .optional(),
})

/** Validates a persisted drop row before merge defaults (localStorage tamper guard). */
export const persistedDropSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  dropNumber: z.string(),
  title: z.string(),
  subtitle: z.string(),
  description: z.string(),
  status: dropStatusSchema,
  isActive: z.boolean(),
  releaseDate: z.string().optional(),
  scheduledActivationAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  theme: dropThemePaletteSchema,
  visuals: dropVisualsSchema,
  landingContent: dropLandingContentSchema,
  landingActSequence: z.array(landingActSlotSchema),
  acts: z.array(landingActSchema),
  productIds: z.array(z.string()),
  seo: dropSeoSchema,
})

export const dropsPersistedPayloadSchema = z.object({
  drops: z.array(z.unknown()).min(1),
})
