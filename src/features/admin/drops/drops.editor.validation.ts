import { DROP_THEME_PRESETS } from '@/features/admin/drops/drops.presets'
import type { Drop, DropThemePalette } from '@/features/admin/drops/drops.types'

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function isKnownPresetPalette(theme: DropThemePalette): boolean {
  return DROP_THEME_PRESETS.some((p) => p.id === theme.id)
}

export type DropEditorValidationResult =
  | { ok: true }
  | { ok: false; errors: string[] }

export function validateDropEditorDraft(drop: Drop): DropEditorValidationResult {
  const errors: string[] = []
  if (!drop.title.trim()) errors.push('Title is required.')
  if (!drop.slug.trim()) errors.push('Slug is required.')
  else if (!SLUG_PATTERN.test(drop.slug.trim()))
    errors.push('Slug must use lowercase letters, numbers, and single hyphens only.')

  if (!isKnownPresetPalette(drop.theme))
    errors.push('Theme palette must be a known preset (pick one from the list).')

  return errors.length ? { ok: false, errors } : { ok: true }
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
