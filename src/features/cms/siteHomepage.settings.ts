import { z } from 'zod'

export type HomepageMode = 'default' | 'custom'

export type SiteHomepageSettings = {
  mode: HomepageMode
  updatedAt: string
}

const schema = z.object({
  mode: z.enum(['default', 'custom']),
  updatedAt: z.string(),
})

export const DEFAULT_SITE_HOMEPAGE: SiteHomepageSettings = {
  mode: 'custom',
  updatedAt: new Date().toISOString(),
}

function normalizeHomepageMode(mode: HomepageMode): HomepageMode {
  return mode === 'default' ? 'custom' : mode
}

export function parseSiteHomepageSettings(raw: unknown): SiteHomepageSettings {
  const r = schema.safeParse(raw)
  if (!r.success) return DEFAULT_SITE_HOMEPAGE
  return {
    ...r.data,
    mode: normalizeHomepageMode(r.data.mode),
  }
}

