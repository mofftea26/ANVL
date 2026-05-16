import { z } from 'zod'

export const mediaAssetSchema = z.object({
  id: z.string(),
  type: z.enum(['image', 'video', 'file']),
  url: z.string(),
  alt: z.string().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
})

export type MediaAsset = z.infer<typeof mediaAssetSchema>
