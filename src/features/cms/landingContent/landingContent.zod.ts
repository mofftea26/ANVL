import { z } from 'zod'

/**
 * Landing content envelope: `{ [landingPageKey]: { ...page-shaped blob } }`.
 *
 * The envelope stays loose on purpose — each landing page owns its slice
 * schema (e.g. `forgeContent.schema.ts`) and parses it at render with code
 * defaults filling every gap. The envelope only guarantees the outer shape
 * and strips prototype-pollution keys (SEC-17 parity with createJsonStore).
 */

const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

const pageSliceSchema = z.record(z.string(), z.unknown())

export const landingContentConfigSchema = z.record(z.string(), pageSliceSchema)

export type LandingContentConfig = z.infer<typeof landingContentConfigSchema>

export const DEFAULT_LANDING_CONTENT: LandingContentConfig = {}

function stripUnsafeKeys(config: LandingContentConfig): LandingContentConfig {
  const out: LandingContentConfig = {}
  for (const [pageKey, slice] of Object.entries(config)) {
    if (UNSAFE_KEYS.has(pageKey)) continue
    const safeSlice: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(slice)) {
      if (UNSAFE_KEYS.has(k)) continue
      safeSlice[k] = v
    }
    out[pageKey] = safeSlice
  }
  return out
}

/** Tolerant parse: malformed input degrades to an empty envelope. */
export function parseLandingContentConfig(raw: unknown): LandingContentConfig {
  const r = landingContentConfigSchema.safeParse(raw)
  if (!r.success) return DEFAULT_LANDING_CONTENT
  return stripUnsafeKeys(r.data)
}
