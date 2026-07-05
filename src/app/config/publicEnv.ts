import { z } from 'zod'

/**
 * Build-time `import.meta.env` values consumed in the client bundle.
 */
const PublicEnvSchema = z.object({
  VITE_ANVL_INTERNATIONAL_CHECKOUT: z.string().optional(),
})

export type PublicEnv = z.infer<typeof PublicEnvSchema>

export const publicEnv: PublicEnv = PublicEnvSchema.parse({
  VITE_ANVL_INTERNATIONAL_CHECKOUT: import.meta.env.VITE_ANVL_INTERNATIONAL_CHECKOUT,
})
