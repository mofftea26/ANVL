import { z } from 'zod'



const cta = z.object({ label: z.string(), href: z.string() })

const cinematicButtonSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  variant: z.enum(['primary', 'secondary', 'ghost', 'outline']).default('primary'),
  icon: z.string().optional(),
  target: z.enum(['_blank', '_self']).optional(),
})

const cinematicSectionMediaSchema = z.object({
  imageUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  alt: z.string().optional(),
  overlayIntensity: z.number().min(0).max(1).optional(),
})

export const cinematicHeroSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().optional(),
  eyebrow: z.string().optional(),
  heading: z.string().optional(),
  body: z.string().optional(),
  background: cinematicSectionMediaSchema.optional(),
  foreground: cinematicSectionMediaSchema.optional(),
  emblemSrc: z.string().optional(),
  buttons: z.array(cinematicButtonSchema).max(4).optional(),
  animationPreset: z.string().optional(),
  textPosition: z.enum(['left', 'center', 'right']).optional(),
  visualPosition: z.enum(['left', 'center', 'right']).optional(),
  mobileBehavior: z.enum(['stack', 'simplified', 'hidden']).optional(),
  isEnabled: z.boolean(),
  sortOrder: z.number().int().min(0),
})

export const cinematicConfigSchema = z.object({
  enabled: z.boolean().default(true),
  scrollLength: z.enum(['compact', 'standard', 'extended']).default('standard'),
  navMode: z
    .enum(['auto', 'transparentTopbar', 'sideRail', 'cornerDock', 'commandOverlay'])
    .default('auto'),
  backgroundMode: z.enum(['image', 'video', 'gradient', 'forgeScene']).default('video'),
  reducedMotionFallback: z
    .object({
      mode: z.enum(['stack', 'static']).default('stack'),
      showAllSections: z.boolean().optional(),
    })
    .default({ mode: 'stack', showAllSections: true }),
  sections: z.array(cinematicHeroSectionSchema).max(8).default([]),
})

const lookbookItemSchema = z.object({
  src: z.string(),
  caption: z.string().optional(),
  alt: z.string().optional(),
})

export const lookbookContentSchema = z.object({
  layout: z.enum(['masonry', 'carousel', 'editorial']).optional(),
  galleryItems: z.array(lookbookItemSchema).max(24).optional(),
})



const tenetItem = z.object({

  id: z.string(),

  label: z.string(),

  body: z.string().optional(),

})



const characteristicItem = z.object({

  id: z.string(),

  label: z.string(),

  body: z.string().optional(),

  imageUrl: z.string().optional(),

})



const chapterItem = z.object({

  id: z.string(),

  title: z.string(),

  body: z.string(),

})



const materialProductItem = z.object({

  productId: z.string(),

  frontLabel: z.string().optional(),

  materialName: z.string().optional(),

  gsm: z.string().optional(),

  composition: z.string().optional(),

  characteristics: z.array(characteristicItem).max(12).optional(),

})



/** Layered hero presets store foreground media in content. */

export const heroContentSchema = z.object({

  countdownTargetIso: z.string().optional(),

  heroDrop: z.string().optional(),

  heroPieces: z.string().optional(),

  heroStatus: z.string().optional(),

  foregroundImageUrl: z.string().optional(),

  foregroundVideoUrl: z.string().optional(),

  primaryCta: cta.optional(),

  secondaryCta: cta.optional(),

  cinematicConfig: cinematicConfigSchema.optional(),

})



export const manifestoContentSchema = z.object({

  quote: z.string().optional(),

  tenets: z.array(tenetItem).max(12).optional(),

})



export const storytellingContentSchema = z.object({

  chapters: z.array(chapterItem).max(8).optional(),

  chapterTitle: z.string().optional(),

  chapterBody: z.string().optional(),

})



export const dropRevealContentSchema = z.object({

  releaseDateIso: z.string().optional(),

  primaryCta: cta.optional(),

  secondaryCta: cta.optional(),

  dropVisualSrc: z.string().optional(),

})



export const productShowcaseContentSchema = z.object({

  cardStyle: z.enum(['carousel', 'grid', 'story']).optional(),

  viewAllLabel: z.string().optional(),

  viewAllHref: z.string().optional(),

})



export const materialShowcaseContentSchema = z.object({

  materialProducts: z.array(materialProductItem).max(12).optional(),

  materialName: z.string().optional(),

  gsm: z.string().optional(),

  composition: z.string().optional(),

  fitNotes: z.string().optional(),

  constructionNotes: z.string().optional(),

})



export const specialEventContentSchema = z.object({

  eventTitle: z.string().optional(),

  startsAtIso: z.string().optional(),

  endsAtIso: z.string().optional(),

  location: z.string().optional(),

  linkHref: z.string().optional(),

  rules: z.string().optional(),

  cta: cta.optional(),

})



export const finalCtaContentSchema = z.object({

  backgroundImageUrl: z.string().optional(),

  primaryCta: cta.optional(),

  secondaryCta: cta.optional(),

  tertiaryCta: cta.optional(),

})



const SCHEMAS: Record<string, z.ZodType<Record<string, unknown>>> = {

  hero: heroContentSchema,

  manifesto: manifestoContentSchema,

  storytelling: storytellingContentSchema,

  dropReveal: dropRevealContentSchema,

  productShowcase: productShowcaseContentSchema,

  materialShowcase: materialShowcaseContentSchema,

  specialEvent: specialEventContentSchema,

  lookbook: lookbookContentSchema,

  finalCTA: finalCtaContentSchema,

}



export function safeParseActContent(

  nature: string,

  raw: Record<string, unknown>,

): Record<string, unknown> {

  const schema = SCHEMAS[nature] ?? z.record(z.string(), z.unknown())

  const res = schema.safeParse(raw)

  return res.success ? (res.data as Record<string, unknown>) : {}

}


