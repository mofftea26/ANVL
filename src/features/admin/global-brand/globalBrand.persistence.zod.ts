import { z } from 'zod'

/**
 * Persistence Zod schema for the global brand settings (audit SEC-07 /
 * Phase C2). Used by globalBrand.service.ts to validate the localStorage
 * blob before merging into defaults.
 */
export const persistedGlobalBrandSchema = z.object({
  emblemFallbackUrl: z.string(),
  loadingEmblemFallbackUrl: z.string(),
})
