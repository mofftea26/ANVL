import { z } from 'zod'

export const productColorwaySchema = z.object({
  name: z.string(),
  base: z.string(),
  accent: z.string(),
})

export const productSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  dropName: z.string(),
  role: z.string(),
  fit: z.string(),
  fabric: z.string(),
  gsm: z.string(),
  storytelling: z.string(),
  designDetails: z.array(z.string()),
  careInstructions: z.array(z.string()),
  colorways: z.array(productColorwaySchema),
  sizes: z.array(z.string()),
  price: z.number(),
  images: z.array(
    z.object({
      src: z.string(),
      alt: z.string(),
    }),
  ),
})

export const productsSchema = z.array(productSchema)
