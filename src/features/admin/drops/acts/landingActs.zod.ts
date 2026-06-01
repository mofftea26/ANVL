import { z } from 'zod'



const cta = z.object({ label: z.string(), href: z.string() })



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


