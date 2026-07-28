import { z } from 'zod'

import { pickKeys } from './parseUtils'

/**
 * The section shape (heading + plain-text body) reused across shipping,
 * returns, and the care guide's free-form sections. Split out of
 * `supportContent.zod.ts` so both `supportContent.care.zod.ts` and the root
 * file can depend on it without depending on each other.
 */
export const supportSectionSchema = z
  .object({
    id: z.string().catch(''),
    heading: z.string().catch(''),
    body: z.string().catch(''),
  })
  .strict()
export type SupportSection = z.infer<typeof supportSectionSchema>

// Each row starts from a full blank so every key is present before parse
// (a `.catch` default only fires on a *wrong type*, not a *missing* key).
export function pickSectionArray(raw: unknown): Record<string, unknown>[] {
  if (!Array.isArray(raw)) return []
  return raw.map((s) => ({ id: '', heading: '', body: '', ...pickKeys(s, ['id', 'heading', 'body']) }))
}
