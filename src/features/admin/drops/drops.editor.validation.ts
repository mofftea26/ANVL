import { isValidColor } from '@/shared/lib/color'
import type { Drop, DropThemePalette } from '@/features/admin/drops/drops.types'

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * Public URL — also accepts `/relative/paths` and `data:` URIs.
 * Data URIs accept either parameter delimiter:
 *   - `data:image/png;base64,...`  (typical FileReader output)
 *   - `data:image/svg+xml,<svg/>`  (param-less form, RFC 2397)
 */
const URL_OR_PATH_PATTERN =
  /^(?:https?:\/\/|\/[^\s]*|data:[a-z]+\/[\w.+-]+[;,]|mailto:|tel:)/i

const REQUIRED_PALETTE_KEYS: Array<keyof DropThemePalette['colors']> = [
  'background',
  'surface',
  'surfaceSoft',
  'heading',
  'text',
  'mutedText',
  'line',
  'accent',
  'accentSoft',
  'heroGlow',
]

export type DropFieldErrors = {
  /** Whole-form summary lines (toast-friendly). */
  summary: string[]
  /** Per-field error map keyed by stable path strings (`basics.slug`, …). */
  fields: Record<string, string>
}

export type DropEditorValidationResult =
  | { ok: true; errors?: undefined }
  | { ok: false; errors: string[] }

export function isValidUrlOrPath(value: string | undefined | null): boolean {
  if (!value) return false
  const t = value.trim()
  if (!t) return false
  return URL_OR_PATH_PATTERN.test(t)
}

/**
 * Returns the full set of validation issues across all editor tabs. Used both
 * for save gating and for surfacing inline error hints next to each field.
 */
export function collectDropDraftErrors(
  drop: Drop,
  otherDrops: Drop[] = [],
): DropFieldErrors {
  const summary: string[] = []
  const fields: Record<string, string> = {}

  const slug = drop.slug.trim()
  if (!slug) {
    fields['basics.slug'] = 'Slug is required.'
    summary.push('Slug is required.')
  } else if (!SLUG_PATTERN.test(slug)) {
    fields['basics.slug'] =
      'Use lowercase letters, numbers, and single hyphens only (e.g. `the-oath`).'
    summary.push(fields['basics.slug'])
  } else if (otherDrops.some((d) => d.id !== drop.id && d.slug === slug)) {
    fields['basics.slug'] = 'Another drop already uses this slug.'
    summary.push(fields['basics.slug'])
  }

  if (!drop.title.trim()) {
    fields['basics.title'] = 'Title is required.'
    summary.push('Title is required.')
  }
  if (!drop.name.trim()) {
    fields['basics.name'] = 'Internal name is required.'
  }

  if (drop.scheduledActivationAt) {
    const d = new Date(drop.scheduledActivationAt)
    if (Number.isNaN(d.getTime())) {
      fields['basics.scheduledActivationAt'] = 'Invalid scheduled activation.'
    }
  }
  if (drop.releaseDate) {
    const d = new Date(drop.releaseDate)
    if (Number.isNaN(d.getTime())) {
      fields['basics.releaseDate'] = 'Invalid release date.'
    }
  }

  for (const key of REQUIRED_PALETTE_KEYS) {
    const value = drop.theme.colors[key]
    if (!value || !value.trim()) {
      fields[`theme.${key}`] = 'Required.'
    } else if (!isValidColor(value)) {
      fields[`theme.${key}`] = 'Unrecognized color value.'
      summary.push(`Theme: ${key} is not a valid color.`)
    }
  }
  for (const optKey of ['danger', 'success'] as const) {
    const value = drop.theme.colors[optKey]
    if (value && !isValidColor(value)) {
      fields[`theme.${optKey}`] = 'Unrecognized color value.'
    }
  }

  for (const [key, val] of Object.entries(drop.visuals)) {
    if (typeof val !== 'string') continue
    if (!val.trim()) continue
    if (key === 'emblemAlt') continue
    if (!isValidUrlOrPath(val)) {
      fields[`visuals.${key}`] = 'Must be a URL, /public path, or data URI.'
    }
  }
  if (drop.visuals.emblemImageUrl && !drop.visuals.emblemAlt.trim()) {
    fields['visuals.emblemAlt'] =
      'Alt text is required when an emblem image is set.'
    summary.push('Provide emblem alt text for accessibility.')
  }

  if (!drop.seo.title.trim()) {
    fields['seo.title'] = 'SEO title is required.'
    summary.push('SEO title is required.')
  } else if (drop.seo.title.length > 70) {
    fields['seo.title'] = 'Try to keep SEO title under 70 characters.'
  }
  if (!drop.seo.description.trim()) {
    fields['seo.description'] = 'SEO description is required.'
    summary.push('SEO description is required.')
  } else if (drop.seo.description.length > 200) {
    fields['seo.description'] =
      'Keep description under 200 characters for snippet safety.'
  }
  if (drop.seo.ogImage && !isValidUrlOrPath(drop.seo.ogImage)) {
    fields['seo.ogImage'] = 'Must be a URL or /public path.'
  }

  return { summary, fields }
}

/** Back-compat: simple boolean-result wrapper around the field collector. */
export function validateDropEditorDraft(
  drop: Drop,
  otherDrops: Drop[] = [],
): DropEditorValidationResult {
  const { summary } = collectDropDraftErrors(drop, otherDrops)
  return summary.length ? { ok: false, errors: summary } : { ok: true }
}

export function scheduledIsoToDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function datetimeLocalToScheduledIso(local: string): string | null {
  if (!local.trim()) return null
  const d = new Date(local)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}
