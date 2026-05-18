import { z } from 'zod'

import { dropThemePaletteSchema } from '@/features/admin/drops/drops.persistence.zod'

export const savedDropThemePalettePresetRowSchema = z.object({
  id: z.string(),
  label: z.string(),
  tokens: dropThemePaletteSchema,
  createdAt: z.string(),
})

export const savedDropThemePalettePresetsSchema = z.array(
  savedDropThemePalettePresetRowSchema,
)

export type SavedDropThemePalettePresetRow = z.infer<
  typeof savedDropThemePalettePresetRowSchema
>
