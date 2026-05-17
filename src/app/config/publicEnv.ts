import { z } from 'zod'

/**
 * Build-time `import.meta.env` values consumed in the client bundle.
 * Keep optional keys loose — empty admin password means "not configured".
 */
const PublicEnvSchema = z.object({
  VITE_ANVL_ADMIN_USERNAME: z.string().optional(),
  VITE_ANVL_ADMIN_PASSWORD: z.string().optional(),
  VITE_ANVL_INTERNATIONAL_CHECKOUT: z.string().optional(),
})

export type PublicEnv = z.infer<typeof PublicEnvSchema>

export const publicEnv: PublicEnv = PublicEnvSchema.parse({
  VITE_ANVL_ADMIN_USERNAME: import.meta.env.VITE_ANVL_ADMIN_USERNAME,
  VITE_ANVL_ADMIN_PASSWORD: import.meta.env.VITE_ANVL_ADMIN_PASSWORD,
  VITE_ANVL_INTERNATIONAL_CHECKOUT: import.meta.env.VITE_ANVL_INTERNATIONAL_CHECKOUT,
})
