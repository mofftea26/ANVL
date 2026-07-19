import { z } from 'zod'

/**
 * Storefront announcement banner — the CMS-controlled strip rendered at the
 * very top of every storefront page (above the topbar) while live. Mirrors how
 * `coming_soon` flows: edited locally → `adminCmsRemoteSync` →
 * `cms_settings.banner_config` + `storefront_publication.banner_config` →
 * SSR projection.
 *
 * Visibility = `enabled` AND inside the optional schedule window — see
 * `isBannerLive.ts`. Colors are optional hex overrides; blank falls back to
 * the theme tokens (`--color-accent` / `--color-on-highlight`).
 *
 * Persistence schemas are `.strict()`; `parseBannerConfig` pre-filters to the
 * known keys so legacy/tampered blobs degrade to defaults instead of throwing.
 */

export const DEFAULT_BANNER_CONFIG = {
  enabled: false,
  message: '',
  /** Optional link — when set (and no `linkLabel`), the message itself links. */
  href: '',
  /** Optional CTA label rendered after the message instead of linking it. */
  linkLabel: '',
  /** Media-library asset id shown as a small icon before the message. */
  imageMediaId: '',
  /** Hex overrides; '' = fall back to theme tokens. */
  colors: { background: '', text: '' },
  /** Optional ISO datetimes (either may be blank). */
  schedule: { startAt: '', endAt: '' },
}

const bannerColorsSchema = z
  .object({
    background: z.string().catch(DEFAULT_BANNER_CONFIG.colors.background),
    text: z.string().catch(DEFAULT_BANNER_CONFIG.colors.text),
  })
  .strict()
  .catch({ ...DEFAULT_BANNER_CONFIG.colors })

const bannerScheduleSchema = z
  .object({
    startAt: z.string().catch(DEFAULT_BANNER_CONFIG.schedule.startAt),
    endAt: z.string().catch(DEFAULT_BANNER_CONFIG.schedule.endAt),
  })
  .strict()
  .catch({ ...DEFAULT_BANNER_CONFIG.schedule })

export const bannerConfigSchema = z
  .object({
    enabled: z.boolean().catch(DEFAULT_BANNER_CONFIG.enabled),
    message: z.string().catch(DEFAULT_BANNER_CONFIG.message),
    href: z.string().catch(DEFAULT_BANNER_CONFIG.href),
    linkLabel: z.string().catch(DEFAULT_BANNER_CONFIG.linkLabel),
    imageMediaId: z.string().catch(DEFAULT_BANNER_CONFIG.imageMediaId),
    colors: bannerColorsSchema,
    schedule: bannerScheduleSchema,
  })
  .strict()

export type BannerConfig = z.infer<typeof bannerConfigSchema>

/** Deep-pick only known keys so `.strict()` never trips on legacy blobs. */
function pickKnownBannerKeys(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of ['enabled', 'message', 'href', 'linkLabel', 'imageMediaId'] as const) {
    if (key in raw) out[key] = raw[key]
  }
  const colors = raw.colors
  if (colors && typeof colors === 'object' && !Array.isArray(colors)) {
    const c = colors as Record<string, unknown>
    out.colors = {
      ...DEFAULT_BANNER_CONFIG.colors,
      ...(('background' in c) ? { background: c.background } : {}),
      ...(('text' in c) ? { text: c.text } : {}),
    }
  }
  const schedule = raw.schedule
  if (schedule && typeof schedule === 'object' && !Array.isArray(schedule)) {
    const s = schedule as Record<string, unknown>
    out.schedule = {
      ...DEFAULT_BANNER_CONFIG.schedule,
      ...(('startAt' in s) ? { startAt: s.startAt } : {}),
      ...(('endAt' in s) ? { endAt: s.endAt } : {}),
    }
  }
  return out
}

/**
 * Parse any stored banner blob into a complete, valid {@link BannerConfig}.
 * Non-object input → full defaults. Object input → per-field `.catch` defaults
 * fill missing/invalid keys, unknown keys are dropped.
 */
export function parseBannerConfig(raw: unknown): BannerConfig {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return bannerConfigSchema.parse({
      ...DEFAULT_BANNER_CONFIG,
      colors: { ...DEFAULT_BANNER_CONFIG.colors },
      schedule: { ...DEFAULT_BANNER_CONFIG.schedule },
    })
  }
  return bannerConfigSchema.parse({
    ...DEFAULT_BANNER_CONFIG,
    colors: { ...DEFAULT_BANNER_CONFIG.colors },
    schedule: { ...DEFAULT_BANNER_CONFIG.schedule },
    ...pickKnownBannerKeys(raw as Record<string, unknown>),
  })
}
